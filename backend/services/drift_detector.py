import numpy as np
import pandas as pd
from scipy import stats
from scipy.spatial.distance import jensenshannon
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.supabase_client import supabase


def fetch_predictions(model_id: str, limit: int = 200):
    """
    Fetches the latest predictions for a model from Supabase.
    Returns them as a pandas DataFrame — like an Excel sheet in Python.
    """
    result = supabase.table("prediction_logs")\
        .select("*")\
        .eq("model_id", model_id)\
        .order("timestamp", desc=False)\
        .limit(limit)\
        .execute()

    if not result.data:
        return None

    rows = []
    for record in result.data:
        flat = record["input_features"]   # the actual feature values
        flat["prediction_output"] = record["prediction_output"]
        flat["confidence_score"] = record["confidence_score"]
        flat["timestamp"] = record["timestamp"]
        rows.append(flat)

    return pd.DataFrame(rows)


def calculate_psi(baseline, current, bins=10):
    """
    PSI — Population Stability Index.
    Compares two distributions of a numerical feature.
    Returns a score. Higher = more drift.
    0.0 - 0.1  = no drift
    0.1 - 0.2  = slight drift, monitor
    above 0.2  = significant drift, alert
    """
    baseline = np.array(baseline, dtype=float)
    current = np.array(current, dtype=float)

    # create bins based on baseline distribution
    breakpoints = np.percentile(baseline, np.linspace(0, 100, bins + 1))
    breakpoints = np.unique(breakpoints)

    if len(breakpoints) < 2:
        return 0.0

    # count how many values fall in each bin
    baseline_counts = np.histogram(baseline, bins=breakpoints)[0]
    current_counts = np.histogram(current, bins=breakpoints)[0]

    # convert to proportions, avoid division by zero
    baseline_pct = (baseline_counts + 1e-6) / len(baseline)
    current_pct = (current_counts + 1e-6) / len(current)

    # PSI formula
    psi = np.sum((baseline_pct - current_pct) * np.log(baseline_pct / current_pct))
    return round(float(psi), 4)


def calculate_ks(baseline, current):
    """
    KS Test — checks if two numerical distributions are the same.
    Returns statistic and p-value.
    p-value below 0.05 means drift is statistically significant.
    """
    stat, p_value = stats.ks_2samp(baseline, current)
    return round(float(stat), 4), round(float(p_value), 4)


def calculate_chi_squared(baseline, current):
    """
    Chi-squared test for categorical features like device type.
    Checks if the proportion of categories changed.
    p-value below 0.05 means the category distribution shifted.
    """
    # get all unique categories from both
    all_categories = list(set(list(baseline) + list(current)))

    baseline_counts = np.array([baseline.count(c) for c in all_categories], dtype=float)
    current_counts = np.array([current.count(c) for c in all_categories], dtype=float)

    # avoid zero counts
    baseline_counts = np.where(baseline_counts == 0, 1e-6, baseline_counts)
    current_counts = np.where(current_counts == 0, 1e-6, current_counts)

    # normalize expected frequencies to match current total
    expected = baseline_counts * (current_counts.sum() / baseline_counts.sum())

    stat, p_value = stats.chisquare(f_obs=current_counts, f_exp=expected)
    return round(float(stat), 4), round(float(p_value), 4)


def detect_drift(model_id: str):
    """
    Main function — fetches predictions, splits into baseline and current,
    runs all three tests on every feature, returns a full drift report.
    """
    df = fetch_predictions(model_id)

    if df is None or len(df) < 20:
        return {"error": "Not enough data to detect drift. Need at least 20 predictions."}

    # split data in half — first half is baseline, second half is recent
    split = len(df) // 2
    baseline_df = df.iloc[:split]
    current_df = df.iloc[split:]

    # numerical features to check
    numerical_features = ["age", "income", "tenure_months", "monthly_spend", "confidence_score"]
    
    # categorical features to check
    categorical_features = ["device", "prediction_output"]

    drift_report = {
        "model_id": model_id,
        "total_predictions_analyzed": len(df),
        "baseline_size": len(baseline_df),
        "current_window_size": len(current_df),
        "numerical_drift": {},
        "categorical_drift": {},
        "drift_detected": False,
        "drifted_features": [],
        "overall_severity": "none"
    }

    # check each numerical feature
    for feature in numerical_features:
        if feature not in df.columns:
            continue

        baseline_vals = baseline_df[feature].dropna().tolist()
        current_vals = current_df[feature].dropna().tolist()

        if len(baseline_vals) < 5 or len(current_vals) < 5:
            continue

        psi = calculate_psi(baseline_vals, current_vals)
        ks_stat, ks_p = calculate_ks(baseline_vals, current_vals)

        # determine if this feature drifted
        feature_drifted = psi > 0.2 or ks_p < 0.05

        drift_report["numerical_drift"][feature] = {
            "psi": psi,
            "psi_status": "drift" if psi > 0.2 else "warning" if psi > 0.1 else "stable",
            "ks_statistic": ks_stat,
            "ks_p_value": ks_p,
            "ks_status": "drift" if ks_p < 0.05 else "stable",
            "drifted": feature_drifted
        }

        if feature_drifted:
            drift_report["drifted_features"].append(feature)

    # check each categorical feature
    for feature in categorical_features:
        if feature not in df.columns:
            continue

        baseline_vals = baseline_df[feature].dropna().tolist()
        current_vals = current_df[feature].dropna().tolist()

        if len(baseline_vals) < 5 or len(current_vals) < 5:
            continue

        chi_stat, chi_p = calculate_chi_squared(baseline_vals, current_vals)

        feature_drifted = chi_p < 0.05

        drift_report["categorical_drift"][feature] = {
            "chi_squared_statistic": chi_stat,
            "chi_p_value": chi_p,
            "status": "drift" if feature_drifted else "stable",
            "drifted": feature_drifted
        }

        if feature_drifted:
            drift_report["drifted_features"].append(feature)

    # set overall drift flag
    if drift_report["drifted_features"]:
        drift_report["drift_detected"] = True

    # calculate overall severity based on how many features drifted
    drifted_count = len(drift_report["drifted_features"])
    if drifted_count == 0:
        drift_report["overall_severity"] = "none"
    elif drifted_count <= 2:
        drift_report["overall_severity"] = "low"
    elif drifted_count <= 4:
        drift_report["overall_severity"] = "medium"
    else:
        drift_report["overall_severity"] = "high"

    return drift_report