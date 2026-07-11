import joblib
import numpy as np
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# load the trained model once at startup
# joblib loads it into memory and keeps it there
# every request reuses the same loaded model — no repeated disk reads
MODEL_PATH = os.path.join(os.path.dirname(__file__), "severity_model.joblib")
severity_model = joblib.load(MODEL_PATH)


def calculate_drift_speed(numerical_drift: dict) -> float:
    """
    Calculates how fast drift is spreading across features.
    
    We measure this by looking at how extreme the KS statistics are.
    KS stat close to 1.0 means the distributions are completely different
    which implies a fast sudden shift rather than gradual change.
    
    Returns a value between 0 and 1.
    0 = very slow gradual drift
    1 = instant complete shift
    """
    if not numerical_drift:
        return 0.0

    ks_values = [
        v.get("ks_statistic", 0)
        for v in numerical_drift.values()
        if v.get("drifted", False)
    ]

    if not ks_values:
        return 0.0

    # average KS statistic of drifted features
    # high KS = fast dramatic shift
    return round(float(np.mean(ks_values)), 4)


def calculate_confidence_drop(prediction_logs: list) -> float:
    """
    Measures how much the model's confidence has dropped
    between baseline period and current period.

    Confidence drop is a symptom of the model being uncertain
    about new types of inputs it hasn't seen before.

    Returns drop as a fraction between 0 and 1.
    0 = no confidence drop
    0.5 = confidence dropped by 50%
    """
    if not prediction_logs or len(prediction_logs) < 10:
        return 0.0

    scores = [
        log.get("confidence_score")
        for log in prediction_logs
        if log.get("confidence_score") is not None
    ]

    if len(scores) < 10:
        return 0.0

    split = len(scores) // 2
    baseline_avg = float(np.mean(scores[:split]))
    current_avg = float(np.mean(scores[split:]))

    if baseline_avg == 0:
        return 0.0

    drop = (baseline_avg - current_avg) / baseline_avg
    return round(float(np.clip(drop, 0, 1)), 4)


def score_drift_event(
    drift_report: dict,
    shap_report: dict,
    cluster_report: dict,
    similar_report: dict,
    prediction_logs: list = []
) -> dict:
    """
    Main scoring function.
    Takes outputs from all analysis services,
    engineers the 8 features XGBoost expects,
    and returns a severity score with full breakdown.
    """

    # feature 1 — how many features drifted
    num_drifted = len(drift_report.get("drifted_features", []))

    # feature 2 — average PSI across drifted numerical features
    numerical_drift = drift_report.get("numerical_drift", {})
    psi_values = [
        v.get("psi", 0)
        for v in numerical_drift.values()
        if v.get("drifted", False)
    ]
    avg_psi = float(np.mean(psi_values)) if psi_values else 0.0

    # feature 3 — average KS statistic
    ks_values = [
        v.get("ks_statistic", 0)
        for v in numerical_drift.values()
        if v.get("drifted", False)
    ]
    avg_ks = float(np.mean(ks_values)) if ks_values else 0.0

    # feature 4 — drift speed (calculated from KS statistics)
    drift_speed = calculate_drift_speed(numerical_drift)

    # feature 5 — confidence drop
    confidence_drop = calculate_confidence_drop(prediction_logs)

    # feature 6 — number of new clusters found
    num_clusters = cluster_report.get("clusters_found", 0)

    # feature 7 — historical similarity to past critical events
    similar_events = similar_report.get("similar_events", [])
    historical_similarity = float(similar_events[0]["similarity_percentage"] / 100) if similar_events else 0.0

    # feature 8 — did a high importance feature drift
    top_culprit = shap_report.get("top_culprit", "")
    feature_importance = shap_report.get("feature_importance_ranking", [])
    high_importance_drifted = 0
    if feature_importance and top_culprit:
        top_feature = feature_importance[0]
        if top_feature.get("contribution_percentage", 0) > 30:
            high_importance_drifted = 1

    # build feature vector for XGBoost
    feature_vector = np.array([[
        num_drifted,
        avg_psi,
        avg_ks,
        drift_speed,
        confidence_drop,
        num_clusters,
        historical_similarity,
        high_importance_drifted
    ]])

    # predict severity score
    raw_score = float(severity_model.predict(feature_vector)[0])
    severity_score = round(float(np.clip(raw_score, 0, 100)), 1)

    # convert score to human readable label
    if severity_score < 25:
        severity_label = "low"
        severity_message = "Minor drift detected. Monitor but no immediate action required."
    elif severity_score < 50:
        severity_label = "medium"
        severity_message = "Moderate drift detected. Schedule retraining within 2 weeks."
    elif severity_score < 75:
        severity_label = "high"
        severity_message = "Significant drift detected. Retraining recommended within 3 days."
    else:
        severity_label = "critical"
        severity_message = "Critical drift detected. Immediate retraining required."

    return {
        "severity_score": severity_score,
        "severity_label": severity_label,
        "severity_message": severity_message,
        "feature_inputs": {
            "num_drifted_features": num_drifted,
            "avg_psi": round(avg_psi, 4),
            "avg_ks": round(avg_ks, 4),
            "drift_speed": drift_speed,
            "confidence_drop": confidence_drop,
            "num_clusters": num_clusters,
            "historical_similarity": historical_similarity,
            "high_importance_feature_drifted": high_importance_drifted
        }
    }