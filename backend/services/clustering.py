import hdbscan
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import PCA
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.supabase_client import supabase
from services.drift_detector import fetch_predictions


def prepare_cluster_features(df):
    """
    Takes raw prediction dataframe and converts it into
    a clean numerical matrix ready for clustering.

    Why StandardScaler?
    Because age (25) and income (45000) are very different scales.
    If we don't scale them, income will dominate the clustering
    just because its numbers are bigger — not because it's more important.
    StandardScaler makes every feature have mean=0 and std=1
    so they're all on equal footing.
    """
    feature_cols = ["age", "income", "tenure_months", "monthly_spend", "confidence_score"]
    categorical_cols = ["device"]

    available_features = [f for f in feature_cols if f in df.columns]
    available_cats = [f for f in categorical_cols if f in df.columns]

    X = df[available_features].copy()

    # convert categories to numbers
    for col in available_cats:
        le = LabelEncoder()
        X[col] = le.fit_transform(df[col].astype(str))

    # fill missing values
    X = X.fillna(X.median())

    # scale everything to same range
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, X, available_features + available_cats, scaler


def describe_cluster(cluster_df, feature_names, cluster_id, schema: dict = {}):
    """
    Now uses the feature schema if available.
    Falls back to generic description if no schema defined.
    """
    from services.schema_service import describe_feature_value

    description_parts = []

    for feature in feature_names:
        if feature not in cluster_df.columns:
            continue
        avg_val = float(cluster_df[feature].mean())

        if schema:
            # use user-defined schema for description
            desc = describe_feature_value(feature, avg_val, schema)
            description_parts.append(desc)
        else:
            # fallback to generic description
            description_parts.append(f"{feature}: {round(avg_val, 1)}")

    return f"Cluster {cluster_id}: " + ", ".join(description_parts) if description_parts else f"Cluster {cluster_id}"


def run_clustering(model_id: str, schema: dict = {}):
    """
    Main clustering function.
    1. Fetches predictions
    2. Takes only the DRIFTED half (recent window)
    3. Runs HDBSCAN to find natural groups
    4. Describes each cluster in plain English
    5. Returns full cluster report
    """
    df = fetch_predictions(model_id, limit=200)

    if df is None or len(df) < 20:
        return {"error": "Not enough data for clustering"}

    # take only the drifted half — recent predictions
    split = len(df) // 2
    drifted_df = df.iloc[split:].copy()
    drifted_df = drifted_df.reset_index(drop=True)

    # prepare features for clustering
    X_scaled, X_raw, feature_names, scaler = prepare_cluster_features(drifted_df)

    # run HDBSCAN
    # min_cluster_size=5 means a group needs at least 5 members to be a cluster
    # metric='euclidean' means we measure distance between points normally
    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=5,
        min_samples=3,
        metric='euclidean',
        cluster_selection_method='eom'
    )
    cluster_labels = clusterer.fit_predict(X_scaled)

    # -1 means noise — points that didn't fit any cluster
    unique_clusters = [l for l in set(cluster_labels) if l != -1]
    noise_count = int(np.sum(cluster_labels == -1))

    if len(unique_clusters) == 0:
        return {
            "model_id": model_id,
            "message": "No distinct clusters found. Data may be too uniform or too small.",
            "clusters": [],
            "noise_points": noise_count
        }

    # build cluster profiles
    clusters = []
    X_raw["_cluster"] = cluster_labels

    for cluster_id in sorted(unique_clusters):
        cluster_mask = cluster_labels == cluster_id
        cluster_data = X_raw[X_raw["_cluster"] == cluster_id].copy()

        # compute representative features (averages)
        rep_features = {}
        for feature in feature_names:
            if feature in cluster_data.columns:
                rep_features[feature] = round(float(cluster_data[feature].mean()), 2)

        # plain english description
        description = describe_cluster(cluster_data, feature_names, cluster_id + 1, schema)

        # most common prediction output in this cluster
        if "prediction_output" in drifted_df.columns:
            dominant_prediction = drifted_df.loc[
                X_raw[X_raw["_cluster"] == cluster_id].index, "prediction_output"
            ].mode()
            dominant_pred = dominant_prediction.iloc[0] if len(dominant_prediction) > 0 else "unknown"
        else:
            dominant_pred = "unknown"

        clusters.append({
            "cluster_id": int(cluster_id + 1),
            "size": int(np.sum(cluster_mask)),
            "percentage_of_drifted_data": round(float(np.sum(cluster_mask)) / len(drifted_df) * 100, 1),
            "representative_features": rep_features,
            "dominant_prediction": dominant_pred,
            "plain_english_description": description
        })

    # sort clusters by size — biggest first
    clusters.sort(key=lambda x: x["size"], reverse=True)

    # overall summary
    summary = f"Found {len(unique_clusters)} distinct user segment(s) in your drifted data. "
    if clusters:
        biggest = clusters[0]
        summary += f"The largest new segment ({biggest['percentage_of_drifted_data']}% of drifted traffic) is: {biggest['plain_english_description']}."

    return {
        "model_id": model_id,
        "total_drifted_samples": int(len(drifted_df)),
        "clusters_found": len(unique_clusters),
        "noise_points": noise_count,
        "clusters": clusters,
        "summary": summary
    }


def save_clusters_to_supabase(model_id: str, drift_event_id: str):
    """
    Runs clustering and saves each cluster to Supabase cluster_snapshots table.
    Called automatically when a drift event is stored.
    """
    result = run_clustering(model_id)

    if "error" in result or not result.get("clusters"):
        return result

    rows = []
    for cluster in result["clusters"]:
        rows.append({
            "drift_event_id": drift_event_id,
            "cluster_id": cluster["cluster_id"],
            "cluster_size": cluster["size"],
            "representative_features": cluster["representative_features"],
            "description": cluster["plain_english_description"]
        })

    supabase.table("cluster_snapshots").insert(rows).execute()
    return result