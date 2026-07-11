import google.generativeai as genai
import os
import sys
import time
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.supabase_client import supabase
from services.drift_detector import detect_drift
from services.shap_analyzer import run_shap_analysis
from services.clustering import run_clustering
from services.faiss_search import find_similar_drift_events

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini = genai.GenerativeModel("gemini-2.0-flash-lite")


def call_gemini_with_retry(prompt: str, max_retries: int = 3) -> str:
    """
    Calls Gemini with automatic retry on quota errors.
    Waits 60 seconds before retrying — free tier resets per minute.
    If all retries fail returns a fallback message instead of crashing.
    """
    for attempt in range(max_retries):
        try:
            response = gemini.generate_content(prompt)
            return response.text
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                if attempt < max_retries - 1:
                    wait_time = 65
                    print(f"Gemini quota hit. Waiting {wait_time}s before retry {attempt + 2}/{max_retries}...")
                    time.sleep(wait_time)
                else:
                    return "QUOTA_EXCEEDED"
            else:
                raise e
    return "QUOTA_EXCEEDED"


def build_strict_prompt(drift_report: dict, shap_report: dict, cluster_report: dict, similar_report: dict, model_name: str) -> str:
    """
    Builds a strict prompt that forces Gemini to only use
    the data we provide — never invent or assume anything.
    All facts are explicitly labeled as DATA so Gemini
    treats them as ground truth, not as suggestions.
    """

    drifted_features = drift_report.get("drifted_features", [])
    severity = drift_report.get("overall_severity", "unknown")

    # feature context
    feature_context = shap_report.get("feature_context", {})
    context_lines = []
    for feature, ctx in feature_context.items():
        context_lines.append(
            f"{feature}: was {ctx['baseline_avg']} → now {ctx['current_avg']} ({ctx['change_percentage']}% change)"
        )

    # shap top 3
    top_features = shap_report.get("feature_importance_ranking", [])[:3]
    shap_lines = [f"{f['feature']}: {f['contribution_percentage']}% of drift" for f in top_features]
    top_culprit = shap_report.get("top_culprit", "unknown")

    # clusters
    clusters = cluster_report.get("clusters", [])
    cluster_lines = []
    for c in clusters:
        cluster_lines.append(f"Segment {c['cluster_id']}: {c['plain_english_description']} — {c['size']} users ({c['percentage_of_drifted_data']}% of drifted traffic)")

    # faiss
    similar_events = similar_report.get("similar_events", [])
    if similar_events:
        best = similar_events[0]
        faiss_line = f"Similarity to past event: {best['similarity_percentage']}% match on features: {', '.join(best['drifted_features'])}"
    else:
        faiss_line = "No similar past drift events found."

    prompt = f"""You are writing a drift report. Use ONLY the data below. Do not add any information not present here. Do not guess. Do not invent numbers or features.

=== STRICT DATA START ===
MODEL: {model_name}
SEVERITY: {severity}
DRIFTED FEATURES: {', '.join(drifted_features)}

FEATURE VALUE SHIFTS:
{chr(10).join(context_lines)}

ROOT CAUSE (SHAP analysis - use only these numbers):
{chr(10).join(shap_lines)}
Primary culprit: {top_culprit}

NEW USER SEGMENTS FOUND:
{chr(10).join(cluster_lines) if cluster_lines else 'No distinct segments found.'}

HISTORICAL MATCH:
{faiss_line}
=== STRICT DATA END ===

Write a drift investigation report with exactly these 4 sections.
Use only the data above. If data is missing for a section say 'insufficient data'.
Never invent numbers, features, or segments not listed above.

1. SUMMARY
One paragraph. What happened and severity.

2. WHAT CHANGED
Reference exact feature names and exact numbers from the data above only.

3. ROOT CAUSE
Which features caused this and by what percentage. Use only SHAP numbers above.

4. ACTIONS
Two specific actions based only on the drifted features listed above.
"""
    return prompt


def generate_report(model_id: str, model_name: str = "Production Model"):
    """
    Main report generation function.
    Runs all analyses, builds strict prompt, calls Gemini with retry,
    saves to Supabase, returns full result.
    """

    drift_report = detect_drift(model_id)

    if not drift_report.get("drift_detected"):
        return {
            "model_id": model_id,
            "drift_detected": False,
            "report": "No drift detected. Model is currently stable.",
            "severity": "none"
        }

    shap_report = run_shap_analysis(model_id)
    cluster_report = run_clustering(model_id)
    similar_report = find_similar_drift_events(drift_report)

    prompt = build_strict_prompt(
        drift_report=drift_report,
        shap_report=shap_report,
        cluster_report=cluster_report,
        similar_report=similar_report,
        model_name=model_name
    )

    report_text = call_gemini_with_retry(prompt)

    # if quota exceeded after all retries, build report from raw data without Gemini
    if report_text == "QUOTA_EXCEEDED":
        top_features = shap_report.get("feature_importance_ranking", [])[:2]
        top_names = [f["feature"] for f in top_features]
        clusters = cluster_report.get("clusters", [])
        cluster_desc = clusters[0]["plain_english_description"] if clusters else "no distinct segments found"

        report_text = f"""
SUMMARY
Drift detected in {model_name} with {drift_report.get('overall_severity')} severity. Features {', '.join(drift_report.get('drifted_features', []))} have shifted significantly from baseline.

WHAT CHANGED
{chr(10).join([f"{f}: {c['baseline_avg']} → {c['current_avg']} ({c['change_percentage']}% change)" for f, c in shap_report.get('feature_context', {}).items()])}

ROOT CAUSE
Primary driver: {shap_report.get('top_culprit', 'unknown')} ({top_features[0]['contribution_percentage'] if top_features else 'N/A'}% of drift). {shap_report.get('plain_english_explanation', '')}

NEW USER SEGMENTS
{cluster_desc}

ACTIONS
1. Retrain model prioritizing recent data for features: {', '.join(top_names)}.
2. Investigate data pipeline for changes in {drift_report.get('drifted_features', ['unknown'])[0]} collection.

Note: This report was generated from raw analysis data. Gemini API quota was exceeded.
"""

    # save drift event to Supabase
    drift_event_result = supabase.table("drift_events").insert({
        "model_id": model_id,
        "drift_type": "multi_feature",
        "severity_score": round(len(drift_report.get("drifted_features", [])) / 10.0, 2),
        "affected_features": drift_report.get("drifted_features", []),
        "status": "active"
    }).execute()

    drift_event_id = drift_event_result.data[0]["id"]

    # save report
    supabase.table("remediation_recipes").insert({
        "drift_event_id": drift_event_id,
        "report_text": report_text,
        "retraining_recommendation": shap_report.get("plain_english_explanation", ""),
        "data_window_suggestion": f"Retrain using last 60 days, oversample drifted segments."
    }).execute()

    return {
        "model_id": model_id,
        "drift_event_id": drift_event_id,
        "drift_detected": True,
        "severity": drift_report.get("overall_severity"),
        "drifted_features": drift_report.get("drifted_features"),
        "top_culprit": shap_report.get("top_culprit"),
        "clusters_found": cluster_report.get("clusters_found", 0),
        "gemini_used": report_text != "QUOTA_EXCEEDED",
        "report": report_text
    }