from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.supabase_client import supabase
from auth import get_current_user

router = APIRouter()


class PredictionLog(BaseModel):
    model_id: str
    input_features: dict
    prediction_output: str
    confidence_score: Optional[float] = None
    metadata: Optional[dict] = None


class ModelRegister(BaseModel):
    model_name: str
    model_version: Optional[str] = "1.0"
    description: Optional[str] = None


@router.post("/register-model")
def register_model(data: ModelRegister, user_id: str = Depends(get_current_user)):
    try:
        result = supabase.table("models").insert({
            "user_id": user_id,
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


@router.post("/log-prediction")
def log_prediction(data: PredictionLog, user_id: str = Depends(get_current_user)):
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


@router.post("/log-batch")
def log_batch(model_id: str, predictions: list[PredictionLog], user_id: str = Depends(get_current_user)):
    try:
        rows = [{
            "model_id": model_id,
            "input_features": p.input_features,
            "prediction_output": p.prediction_output,
            "confidence_score": p.confidence_score,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": p.metadata
        } for p in predictions]

        supabase.table("prediction_logs").insert(rows).execute()
        return {"message": f"{len(rows)} predictions logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
def get_models(user_id: str = Depends(get_current_user)):
    try:
        result = supabase.table("models")\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()
        return {"models": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs/{model_id}")
def get_logs(model_id: str, limit: int = 100, user_id: str = Depends(get_current_user)):
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


@router.delete("/models/{model_id}")
def delete_model(model_id: str, user_id: str = Depends(get_current_user)):
    try:
        supabase.table("models")\
            .delete()\
            .eq("id", model_id)\
            .eq("user_id", user_id)\
            .execute()
        return {"message": "Model deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))