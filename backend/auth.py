from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import hashlib
import os
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()
SUPABASE_URL = os.getenv("SUPABASE_URL")

_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    response = httpx.get(url)
    _jwks_cache = response.json()
    return _jwks_cache


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def verify_api_key(key: str) -> str:
    """
    Checks if the API key exists in Supabase.
    Returns user_id if valid, raises 401 if not.
    Uses service role key to bypass RLS for key lookup.
    """
    from db.supabase_client import supabase
    key_hash = hash_key(key)
    result = supabase.table("api_keys")\
        .select("user_id")\
        .eq("key_hash", key_hash)\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # update last used timestamp
    supabase.table("api_keys")\
        .update({"last_used_at": "now()"})\
        .eq("key_hash", key_hash)\
        .execute()
    
    return result.data[0]["user_id"]


def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Accepts either:
    1. JWT token from browser session
    2. DW_ prefixed API key for SDK usage
    """
    token = credentials.credentials

    # if it starts with DW_ it's an API key
    if token.startswith("DW_"):
        return verify_api_key(token)

    # otherwise treat as JWT
    try:
        jwks = get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["ES256"],
            options={"verify_aud": False}
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")