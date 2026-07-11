import pandas as pd
import numpy as np
from prophet import Prophet
from datetime import datetime, timedelta
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.supabase_client import supabase


def fetch_severity_history(model_id: str):
    """
    Fetches historical drift events with severity scores from Supabase.
    Prophet needs a time series — date and value pairs.
    
    Returns a DataFrame with two columns:
    ds = date (Prophet requires this exact column name)
    y  = severity score (Prophet requires this exact column name)
    """
    result = supabase.table("drift_events")\
        .select("detected_at, severity_score")\
        .eq("model_id", model_id)\
        .order("detected_at", desc=False)\
        .execute()

    if not result.data or len(result.data) < 2:
        return None

    rows = []
    for record in result.data:
        if record.get("severity_score") is not None:
            rows.append({
                "ds": pd.to_datetime(record["detected_at"]),
                "y": float(record["severity_score"])
            })

    if len(rows) < 2:
        return None

    return pd.DataFrame(rows)


def generate_synthetic_history(model_id: str, days: int = 30):
    """
    Generates 30 days of synthetic severity history and saves to Supabase.
    This gives Prophet enough data to learn from.
    
    The pattern simulates a realistic drift scenario:
    Days 1-10:  model is stable, low severity (5-15)
    Days 11-20: drift starts appearing, medium severity (20-45)
    Days 21-30: drift accelerates, high severity (50-85)
    
    This is exactly what happens in real life — drift builds up gradually
    then suddenly becomes critical.
    """
    base_date = datetime.utcnow() - timedelta(days=days)
    rows = []

    for i in range(days):
        current_date = base_date + timedelta(days=i)

        if i < 10:
            # stable phase
            severity = np.random.uniform(5, 15) + np.random.normal(0, 2)
        elif i < 20:
            # drift building phase
            progress = (i - 10) / 10.0
            severity = 15 + (progress * 30) + np.random.uniform(-5, 5)
        else:
            # drift accelerating phase
            progress = (i - 20) / 10.0
            severity = 45 + (progress * 40) + np.random.uniform(-5, 5)

        severity = float(np.clip(severity, 0, 100))

        rows.append({
            "model_id": model_id,
            "drift_type": "synthetic_history",
            "severity_score": round(severity, 2),
            "affected_features": [],
            "status": "resolved",
            "detected_at": current_date.isoformat()
        })

    supabase.table("drift_events").insert(rows).execute()
    return {"message": f"Generated {days} days of synthetic history", "days": days}


def run_forecast(model_id: str, forecast_days: int = 14):
    """
    Main forecasting function.
    1. Fetches severity history from Supabase
    2. Trains Prophet on that history
    3. Forecasts next 14 days
    4. Returns forecast with confidence intervals
    5. Flags when severity will cross critical threshold (75)
    """
    df = fetch_severity_history(model_id)

    if df is None:
        return {
            "error": "Not enough historical data for forecasting.",
            "suggestion": "Call /api/drift/generate-history/{model_id} first to create synthetic history."
        }

    # train Prophet
    # we disable weekly and daily seasonality because
    # drift doesn't follow day-of-week patterns
    # we keep yearly seasonality off too since we have less than a year of data
    model = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.3,  # how flexible the trend is
        interval_width=0.8             # 80% confidence interval
    )

    model.fit(df)

    # create future dataframe for next forecast_days days
    future = model.make_future_dataframe(periods=forecast_days)
    forecast = model.predict(future)

    # extract only the future predictions (not historical)
    historical_end = df["ds"].max()
    future_forecast = forecast[forecast["ds"] > historical_end].copy()

    # build clean forecast output
    forecast_points = []
    critical_threshold = 75
    warning_threshold = 50
    critical_day = None
    warning_day = None

    for _, row in future_forecast.iterrows():
        predicted = round(float(np.clip(row["yhat"], 0, 100)), 1)
        lower = round(float(np.clip(row["yhat_lower"], 0, 100)), 1)
        upper = round(float(np.clip(row["yhat_upper"], 0, 100)), 1)
        date_str = row["ds"].strftime("%Y-%m-%d")

        # find first day severity crosses warning threshold
        if warning_day is None and predicted >= warning_threshold:
            warning_day = date_str

        # find first day severity crosses critical threshold
        if critical_day is None and predicted >= critical_threshold:
            critical_day = date_str

        forecast_points.append({
            "date": date_str,
            "predicted_severity": predicted,
            "lower_bound": lower,
            "upper_bound": upper
        })

    # current trend direction
    if len(forecast_points) >= 3:
        start_val = forecast_points[0]["predicted_severity"]
        end_val = forecast_points[-1]["predicted_severity"]
        trend_change = end_val - start_val

        if trend_change > 10:
            trend = "rapidly_increasing"
            trend_message = f"Severity is projected to increase by {abs(trend_change):.1f} points over the next {forecast_days} days."
        elif trend_change > 3:
            trend = "increasing"
            trend_message = f"Severity is slowly increasing. Monitor closely."
        elif trend_change < -10:
            trend = "decreasing"
            trend_message = f"Severity appears to be recovering. Good sign."
        else:
            trend = "stable"
            trend_message = "Severity is projected to remain stable."
    else:
        trend = "unknown"
        trend_message = "Insufficient data for trend analysis."

    # build alert message
    if critical_day:
        alert = f"WARNING: Severity projected to reach critical level (75+) by {critical_day}. Immediate action recommended."
    elif warning_day:
        alert = f"CAUTION: Severity projected to reach warning level (50+) by {warning_day}. Schedule retraining soon."
    else:
        alert = "No critical thresholds projected in the next 14 days."

    return {
        "model_id": model_id,
        "forecast_days": forecast_days,
        "historical_data_points": len(df),
        "trend": trend,
        "trend_message": trend_message,
        "alert": alert,
        "warning_day": warning_day,
        "critical_day": critical_day,
        "forecast": forecast_points
    }