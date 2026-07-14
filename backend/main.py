from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routes.ingest import router as ingest_router
from routes.drift import router as drift_router
from routes.reports import router as reports_router
from routes.schema import router as schema_router
from routes.forecast import router as forecast_router
from routes.apikeys import router as apikeys_router

load_dotenv()

app = FastAPI(title="DriftWatch API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router, prefix="/api/ingest", tags=["Ingest"])
app.include_router(drift_router, prefix="/api/drift", tags=["Drift"])
app.include_router(reports_router, prefix="/api/reports", tags=["Reports"])
app.include_router(schema_router, prefix="/api/schema", tags=["Schema"])
app.include_router(forecast_router, prefix="/api/forecast", tags=["Forecast"])
app.include_router(apikeys_router, prefix="/api/keys", tags=["API Keys"])
@app.get("/")
def health_check():
    return {"status": "DriftWatch is running"}