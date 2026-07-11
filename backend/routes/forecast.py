from fastapi import APIRouter, HTTPException
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.forecaster import run_forecast, generate_synthetic_history

router = APIRouter()


@router.get("/predict/{model_id}")
def get_forecast(model_id: str, days: int = 14):
    """
    Forecasts drift severity for the next N days using Prophet.
    Returns day-by-day predictions with confidence intervals
    and alerts for when critical thresholds will be crossed.
    """
    try:
        result = run_forecast(model_id, forecast_days=days)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-history/{model_id}")
def generate_history(model_id: str, days: int = 30):
    """
    Generates synthetic drift history for a model.
    Call this once to give Prophet enough data to forecast from.
    In production this data comes naturally over time.
    """
    try:
        result = generate_synthetic_history(model_id, days)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))