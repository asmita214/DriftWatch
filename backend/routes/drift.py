from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.drift_detector import detect_drift
from services.shap_analyzer import run_shap_analysis
from services.clustering import run_clustering
from services.faiss_search import add_drift_event_to_index, find_similar_drift_events
from services.severity_scorer import score_drift_event
from db.supabase_client import supabase

router = APIRouter()


@router.get("/analyze/{model_id}")
def analyze_drift(model_id: str, user_id: str = Depends(get_current_user)):
    """
    Main drift analysis endpoint.
    Call this with a model_id and it returns the full drift report.
    """
    try:
        report = detect_drift(model_id)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/{model_id}")
def drift_summary(model_id: str, user_id: str = Depends(get_current_user)):
    """
    Returns a simple plain English summary of drift status.
    Good for dashboard header cards.
    """
    try:
        report = detect_drift(model_id)

        if "error" in report:
            return {"summary": report["error"]}

        if not report["drift_detected"]:
            return {
                "status": "healthy",
                "message": "Your model looks stable. No significant drift detected.",
                "severity": "none",
                "drifted_features": []
            }

        return {
            "status": "drifting",
            "message": f"Drift detected in {len(report['drifted_features'])} features: {', '.join(report['drifted_features'])}",
            "severity": report["overall_severity"],
            "drifted_features": report["drifted_features"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shap/{model_id}")
def get_shap_analysis(model_id: str, user_id: str = Depends(get_current_user)):
    """
    Returns SHAP-based feature importance.
    Tells you exactly which features are causing the drift
    and by how much — ranked from most to least impactful.
    """
    try:
        result = run_shap_analysis(model_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clusters/{model_id}")
def get_clusters(model_id: str, user_id: str = Depends(get_current_user)):
    """
    Returns HDBSCAN cluster analysis of drifted data.
    Tells you what new types of users appeared in your model's traffic.
    """
    try:
        result = run_clustering(model_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/index/{model_id}")
def index_drift_event(model_id: str, drift_event_id: str, user_id: str = Depends(get_current_user)):
    """
    Adds the current drift state of a model to the FAISS memory index.
    Call this after confirming a drift event is real.
    """
    try:
        drift_report = detect_drift(model_id)
        result = add_drift_event_to_index(
            drift_report=drift_report,
            drift_event_id=drift_event_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar/{model_id}")
def find_similar(model_id: str, user_id: str = Depends(get_current_user)):
    """
    Searches FAISS memory for past drift events similar to the current one.
    Returns similarity scores and recommendations based on past events.
    """
    try:
        drift_report = detect_drift(model_id)
        result = find_similar_drift_events(drift_report=drift_report)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/severity/{model_id}")
def get_severity_score(model_id: str, user_id: str = Depends(get_current_user)):
    """
    Returns XGBoost-powered severity score for current drift state.
    Score is 0-100 with label and recommended action.
    """
    try:
        drift_report = detect_drift(model_id)

        if not drift_report.get("drift_detected"):
            return {
                "severity_score": 0,
                "severity_label": "none",
                "severity_message": "No drift detected. Model is healthy."
            }

        shap_report = run_shap_analysis(model_id)
        cluster_report = run_clustering(model_id)
        similar_report = find_similar_drift_events(drift_report)

        # fetch recent prediction logs for confidence drop calculation
        logs_result = supabase.table("prediction_logs")\
            .select("confidence_score")\
            .eq("model_id", model_id)\
            .order("timestamp", desc=False)\
            .limit(200)\
            .execute()

        prediction_logs = logs_result.data if logs_result.data else []

        result = score_drift_event(
            drift_report=drift_report,
            shap_report=shap_report,
            cluster_report=cluster_report,
            similar_report=similar_report,
            prediction_logs=prediction_logs
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))