from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.supabase_client import supabase

router = APIRouter()

# This defines exactly what shape of data we accept
class PredictionLog(BaseModel):
    model_id: str
    input_features: dict        # the inputs your model received
    prediction_output: str      # what your model predicted
    confidence_score: Optional[float] = None   # how confident the model was
    metadata: Optional[dict] = None            # any extra info

class ModelRegister(BaseModel):
    user_id: str
    model_name: str
    model_version: Optional[str] = "1.0"
    description: Optional[str] = None


# Route 1 — register a new model
@router.post("/register-model")
def register_model(data: ModelRegister):
    try:
        result = supabase.table("models").insert({
            "user_id": data.user_id,
            "model_name": data.model_name,
            "model_version": data.model_version,
            "description": data.description
        }).execute()

        return {
            "message": "Model registered successfully",
            "model_id": result.data[0]["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Route 2 — log a single prediction
@router.post("/log-prediction")
def log_prediction(data: PredictionLog):
    try:
        result = supabase.table("prediction_logs").insert({
            "model_id": data.model_id,
            "input_features": data.input_features,
            "prediction_output": data.prediction_output,
            "confidence_score": data.confidence_score,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": data.metadata
        }).execute()

        return {
            "message": "Prediction logged successfully",
            "log_id": result.data[0]["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Route 3 — log predictions in bulk (for batch models)
@router.post("/log-batch")
def log_batch(model_id: str, predictions: list[PredictionLog]):
    try:
        rows = [{
            "model_id": model_id,
            "input_features": p.input_features,
            "prediction_output": p.prediction_output,
            "confidence_score": p.confidence_score,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": p.metadata
        } for p in predictions]

        result = supabase.table("prediction_logs").insert(rows).execute()

        return {
            "message": f"{len(rows)} predictions logged successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Route 4 — fetch all models for a user
@router.get("/models/{user_id}")
def get_models(user_id: str):
    try:
        result = supabase.table("models")\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()

        return {"models": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Route 5 — fetch prediction logs for a model
@router.get("/logs/{model_id}")
def get_logs(model_id: str, limit: int = 100):
    try:
        result = supabase.table("prediction_logs")\
            .select("*")\
            .eq("model_id", model_id)\
            .order("timestamp", desc=True)\
            .limit(limit)\
            .execute()

        return {"logs": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))