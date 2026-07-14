from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user, hash_key
import secrets
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.supabase_client import supabase

router = APIRouter()


@router.post("/generate")
def generate_api_key(name: str = "Default Key", user_id: str = Depends(get_current_user)):
    """
    Generates a new permanent API key for the user.
    The full key is shown only once — we store only the hash.
    """
    # generate a secure random key with DW_ prefix
    raw_key = f"DW_{secrets.token_urlsafe(32)}"
    key_hash = hash_key(raw_key)
    key_prefix = raw_key[:12]  # store first 12 chars for display

    supabase.table("api_keys").insert({
        "user_id": user_id,
        "key_hash": key_hash,
        "key_prefix": key_prefix,
        "name": name
    }).execute()

    return {
        "api_key": raw_key,
        "key_prefix": key_prefix,
        "message": "Save this key now. It will never be shown again."
    }


@router.get("/list")
def list_api_keys(user_id: str = Depends(get_current_user)):
    """
    Returns all API keys for the user (prefix only, not full key).
    """
    result = supabase.table("api_keys")\
        .select("id, name, key_prefix, created_at, last_used_at")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .execute()
    return {"api_keys": result.data}


@router.delete("/{key_id}")
def delete_api_key(key_id: str, user_id: str = Depends(get_current_user)):
    """
    Deletes an API key permanently.
    """
    supabase.table("api_keys")\
        .delete()\
        .eq("id", key_id)\
        .eq("user_id", user_id)\
        .execute()
    return {"message": "API key deleted"}