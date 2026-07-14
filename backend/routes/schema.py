from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.schema_service import save_feature_schema, get_feature_schema, delete_feature_schema

router = APIRouter()


class FeatureDefinition(BaseModel):
    feature_name: str
    feature_type: str = "numerical"
    unit: Optional[str] = ""
    low_threshold: Optional[float] = None
    high_threshold: Optional[float] = None
    low_label: Optional[str] = "low"
    medium_label: Optional[str] = "medium"
    high_label: Optional[str] = "high"
    description: Optional[str] = ""


class SchemaInput(BaseModel):
    model_id: str
    features: list[FeatureDefinition]


@router.post("/define")
def define_schema(data: SchemaInput, user_id: str = Depends(get_current_user)):
    """
    User defines what each feature means for their model.
    They provide thresholds and labels in their own domain language.
    """
    try:
        features = [f.dict() for f in data.features]
        result = save_feature_schema(data.model_id, features)
        return {"message": "Schema saved successfully", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{model_id}")
def get_schema(model_id: str, user_id: str = Depends(get_current_user)):
    """
    Returns the feature schema for a model.
    """
    try:
        schema = get_feature_schema(model_id)
        if not schema:
            return {"message": "No schema defined for this model.", "schema": {}}
        return {"schema": schema}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{model_id}")
def remove_schema(model_id: str, user_id: str = Depends(get_current_user)):
    """
    Deletes the schema for a model so user can redefine it.
    """
    try:
        result = delete_feature_schema(model_id)
        return {"message": "Schema deleted", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))