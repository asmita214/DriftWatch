import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.supabase_client import supabase


def save_feature_schema(model_id: str, features: list):
    """
    Saves the feature schema for a model to Supabase.
    Each feature has its own row describing what it means
    and what low/medium/high values look like for this domain.
    """
    rows = []
    for f in features:
        rows.append({
            "model_id": model_id,
            "feature_name": f["feature_name"],
            "feature_type": f.get("feature_type", "numerical"),
            "unit": f.get("unit", ""),
            "low_threshold": f.get("low_threshold"),
            "high_threshold": f.get("high_threshold"),
            "low_label": f.get("low_label", "low"),
            "medium_label": f.get("medium_label", "medium"),
            "high_label": f.get("high_label", "high"),
            "description": f.get("description", "")
        })

    result = supabase.table("feature_schemas").insert(rows).execute()
    return {"saved": len(result.data), "features": [r["feature_name"] for r in result.data]}


def get_feature_schema(model_id: str) -> dict:
    """
    Fetches the feature schema for a model.
    Returns a dictionary keyed by feature name
    so any service can look up a feature's meaning instantly.

    Example output:
    {
        "age": {
            "feature_type": "numerical",
            "unit": "years",
            "low_threshold": 25,
            "high_threshold": 50,
            "low_label": "young users",
            "medium_label": "middle-aged users",
            "high_label": "senior users"
        },
        "income": { ... }
    }
    """
    result = supabase.table("feature_schemas")\
        .select("*")\
        .eq("model_id", model_id)\
        .execute()

    if not result.data:
        return {}

    schema = {}
    for row in result.data:
        schema[row["feature_name"]] = {
            "feature_type": row["feature_type"],
            "unit": row.get("unit", ""),
            "low_threshold": row.get("low_threshold"),
            "high_threshold": row.get("high_threshold"),
            "low_label": row.get("low_label", "low"),
            "medium_label": row.get("medium_label", "medium"),
            "high_label": row.get("high_label", "high"),
            "description": row.get("description", "")
        }

    return schema


def describe_feature_value(feature_name: str, value: float, schema: dict) -> str:
    """
    Given a feature name and its average value in a cluster,
    returns a plain English description using the user's own
    defined labels — not hardcoded assumptions.

    This replaces the hardcoded if-else blocks in clustering.py.

    Example:
    feature_name = "income"
    value = 14000
    schema["income"] = {low_threshold: 20000, high_threshold: 60000,
                        low_label: "low income", high_label: "high income"}
    → returns "low income (avg 14000)"
    """
    if feature_name not in schema:
        # fallback if no schema defined for this feature
        return f"{feature_name}: {round(value, 1)}"

    f = schema[feature_name]
    unit = f.get("unit", "")
    low_t = f.get("low_threshold")
    high_t = f.get("high_threshold")
    low_label = f.get("low_label", "low")
    medium_label = f.get("medium_label", "medium")
    high_label = f.get("high_label", "high")

    # determine label based on thresholds
    if low_t is not None and value <= low_t:
        label = low_label
    elif high_t is not None and value >= high_t:
        label = high_label
    else:
        label = medium_label

    value_str = f"{round(value, 1)} {unit}".strip()
    return f"{label} (avg {value_str})"


def delete_feature_schema(model_id: str):
    """
    Deletes all feature schema entries for a model.
    Used when a user wants to redefine their schema.
    """
    result = supabase.table("feature_schemas")\
        .delete()\
        .eq("model_id", model_id)\
        .execute()

    return {"deleted": len(result.data)}