from fastapi import APIRouter, HTTPException
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.gemini_reporter import generate_report
from db.supabase_client import supabase

router = APIRouter()


@router.get("/generate/{model_id}")
def generate_drift_report(model_id: str, model_name: str = "Production Model"):
    """
    Generates a full plain English investigation report for a model.
    Combines drift detection, SHAP, clustering, and FAISS results.
    Saves everything to Supabase and returns the complete report.
    """
    try:
        result = generate_report(model_id, model_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{model_id}")
def get_report_history(model_id: str):
    """
    Fetches all past investigation reports for a model.
    Returns them sorted newest first.
    """
    try:
        # get all drift events for this model
        events = supabase.table("drift_events")\
            .select("id, drift_type, severity_score, detected_at, status")\
            .eq("model_id", model_id)\
            .order("detected_at", desc=True)\
            .execute()

        if not events.data:
            return {"reports": [], "message": "No reports found for this model."}

        # get remediation recipes for each event
        reports = []
        for event in events.data:
            recipe = supabase.table("remediation_recipes")\
                .select("report_text, retraining_recommendation, data_window_suggestion, created_at")\
                .eq("drift_event_id", event["id"])\
                .execute()

            reports.append({
                "drift_event_id": event["id"],
                "drift_type": event["drift_type"],
                "severity_score": event["severity_score"],
                "detected_at": event["detected_at"],
                "status": event["status"],
                "report": recipe.data[0] if recipe.data else None
            })

        return {"total_reports": len(reports), "reports": reports}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))