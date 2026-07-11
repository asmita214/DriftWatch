import shap
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.supabase_client import supabase
from services.drift_detector import fetch_predictions


def prepare_features(df):
    feature_cols = ["age", "income", "tenure_months", "monthly_spend", "confidence_score"]
    categorical_cols = ["device"]

    available_features = [f for f in feature_cols if f in df.columns]
    available_cats = [f for f in categorical_cols if f in df.columns]

    X = df[available_features].copy()

    for col in available_cats:
        le = LabelEncoder()
        X[col] = le.fit_transform(df[col].astype(str))

    y = (df["prediction_output"] == "will_churn").astype(int)

    return X, y, available_features + available_cats


def extract_shap_matrix(shap_values):
    """
    Handles all SHAP output formats across different SHAP versions.
    Always returns a clean 2D numpy array.
    """
    # if it's already a numpy array
    if isinstance(shap_values, np.ndarray):
        if shap_values.ndim == 3:
            # shape is (n_samples, n_features, n_classes) — take class 1
            return shap_values[:, :, 1]
        elif shap_values.ndim == 2:
            return shap_values
        else:
            return shap_values

    # if it's a list (older SHAP versions)
    if isinstance(shap_values, list):
        arr = np.array(shap_values[1])
        if arr.ndim == 2:
            return arr
        return arr

    # fallback
    return np.array(shap_values)


def run_shap_analysis(model_id: str):
    df = fetch_predictions(model_id, limit=200)

    if df is None or len(df) < 20:
        return {"error": "Not enough data for SHAP analysis"}

    X, y, feature_names = prepare_features(df)
    X = X.fillna(X.median())

    split = len(X) // 2
    X_baseline = X.iloc[:split]
    X_current = X.iloc[split:]
    y_baseline = y.iloc[:split]

    clf = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=5)
    clf.fit(X_baseline, y_baseline)

    explainer = shap.TreeExplainer(clf)
    raw_shap = explainer.shap_values(X_current)

    shap_matrix = extract_shap_matrix(raw_shap)

    # mean absolute shap per feature — guaranteed 1D list of plain floats
    mean_shap = [float(v) for v in np.abs(shap_matrix).mean(axis=0).flatten()]

    # make sure length matches features
    mean_shap = mean_shap[:len(feature_names)]
    total_shap = sum(mean_shap) if sum(mean_shap) > 0 else 1.0

    feature_importance = []
    for i, feature in enumerate(feature_names):
        shap_val = mean_shap[i]
        contribution_pct = round((shap_val / total_shap) * 100, 2)
        feature_importance.append({
            "feature": feature,
            "mean_shap_value": round(shap_val, 4),
            "contribution_percentage": contribution_pct,
            "rank": 0
        })

    feature_importance.sort(key=lambda x: x["mean_shap_value"], reverse=True)
    for i, f in enumerate(feature_importance):
        f["rank"] = i + 1

    top_feature = feature_importance[0]
    second_feature = feature_importance[1] if len(feature_importance) > 1 else None

    explanation = f"The most impactful feature is '{top_feature['feature']}' contributing {top_feature['contribution_percentage']}% of the total shift."
    if second_feature:
        explanation += f" Second is '{second_feature['feature']}' at {second_feature['contribution_percentage']}%."
    explanation += " Focus retraining on these features first."

    feature_context = {}
    for feature in feature_names:
        if feature in X.columns:
            baseline_mean = float(X_baseline[feature].mean())
            current_mean = float(X_current[feature].mean())
            change_pct = round(((current_mean - baseline_mean) / (abs(baseline_mean) + 1e-6)) * 100, 1)
            feature_context[feature] = {
                "baseline_avg": round(baseline_mean, 2),
                "current_avg": round(current_mean, 2),
                "change_percentage": change_pct
            }

    return {
        "model_id": model_id,
        "total_samples_analyzed": int(len(X_current)),
        "feature_importance_ranking": feature_importance,
        "plain_english_explanation": explanation,
        "feature_context": feature_context,
        "top_culprit": top_feature["feature"]
    }


def save_shap_to_supabase(model_id: str, drift_event_id: str):
    analysis = run_shap_analysis(model_id)

    if "error" in analysis:
        return analysis

    rows = []
    for item in analysis["feature_importance_ranking"]:
        rows.append({
            "drift_event_id": drift_event_id,
            "feature_name": item["feature"],
            "shap_value": item["mean_shap_value"],
            "direction": "up" if item["mean_shap_value"] > 0 else "down",
            "rank": item["rank"]
        })

    supabase.table("shap_records").insert(rows).execute()
    return analysis