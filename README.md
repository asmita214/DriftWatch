# DriftWatch — ML Model Behavior Surveillance Platform

> **The first drift intelligence platform that doesn't just tell you your model is broken — it investigates why, predicts when it will break next, explains it in plain English, and tells you exactly how to fix it.**

![DriftWatch Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green) ![Python](https://img.shields.io/badge/Python-3.11-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.139-blue) ![React](https://img.shields.io/badge/React-18-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## What is DriftWatch?

Most ML models fail silently in production. They degrade over time as real-world data shifts away from what the model was trained on — and nobody notices until customers complain or an audit surfaces the problem.

DriftWatch monitors your deployed ML model's predictions in real time. It detects when input data starts drifting, identifies exactly which features caused it using SHAP analysis, discovers new user segments using HDBSCAN clustering, matches current drift patterns to historical events using FAISS vector search, scores severity using a trained XGBoost model, forecasts when things will get critical using Prophet, and generates a full plain-English investigation report using Gemini AI.

---

## Features

- **Statistical Drift Detection** — PSI, KS Test, Chi-Squared, and Wasserstein distance across all features simultaneously
- **SHAP Root Cause Analysis** — ranks which features caused the drift and by what percentage
- **HDBSCAN Segment Clustering** — automatically discovers new user segments in drifted traffic
- **FAISS Pattern Memory** — semantic similarity search across all historical drift events
- **XGBoost Severity Scoring** — 0-100 urgency score trained on 4,200 synthetic drift events across 6 real-world drift patterns
- **Prophet Drift Forecasting** — 14-day severity trajectory with confidence intervals and threshold alerts
- **Gemini Investigation Reports** — AI-generated plain-English reports with strict data grounding (no hallucination)
- **Dynamic Feature Schema** — works for any ML domain without hardcoded assumptions
- **Permanent API Keys** — non-expiring keys for SDK usage, no JWT refreshing needed
- **Full Auth System** — Supabase email authentication with per-user data isolation
- **React Dashboard** — severity gauge, SHAP charts, cluster cards, forecast visualization, report viewer

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, Uvicorn |
| ML / NLP | SHAP, HDBSCAN, FAISS, sentence-transformers, XGBoost, Prophet, scikit-learn |
| GenAI | Google Gemini 2.0 Flash |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (ES256 JWT + API Keys) |
| Frontend | React, Tailwind CSS, Recharts, React Router |
| Deployment | Render (backend), Vercel (frontend) |

---

## Project Structure

```
driftwatch/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── auth.py                    # JWT + API key verification
│   ├── Procfile                   # Render deployment config
│   ├── requirements.txt           # Python dependencies
│   ├── db/
│   │   └── supabase_client.py     # Supabase connection
│   ├── routes/
│   │   ├── ingest.py              # Prediction ingestion endpoints
│   │   ├── drift.py               # Drift analysis endpoints
│   │   ├── reports.py             # Gemini report endpoints
│   │   ├── forecast.py            # Prophet forecast endpoints
│   │   ├── schema.py              # Feature schema endpoints
│   │   └── apikeys.py             # API key management
│   └── services/
│       ├── drift_detector.py      # PSI, KS, Chi-squared detection
│       ├── shap_analyzer.py       # SHAP root cause analysis
│       ├── clustering.py          # HDBSCAN segment discovery
│       ├── faiss_search.py        # Vector similarity search
│       ├── severity_scorer.py     # XGBoost severity model
│       ├── forecaster.py          # Prophet forecasting
│       ├── gemini_reporter.py     # AI report generation
│       └── schema_service.py      # Feature schema system
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx        # Public landing page
        │   ├── Login.jsx          # Authentication
        │   ├── Signup.jsx         # Registration
        │   ├── Dashboard.jsx      # Main command center
        │   ├── DriftAnalysis.jsx  # Full technical analysis
        │   ├── Forecast.jsx       # 14-day prediction
        │   ├── Reports.jsx        # AI investigation reports
        │   ├── Models.jsx         # Model management
        │   ├── Settings.jsx       # Feature schema config
        │   └── Quickstart.jsx     # SDK setup guide
        └── components/
            ├── SeverityGauge.jsx
            ├── SHAPBarChart.jsx
            ├── ForecastChart.jsx
            └── ...
```

---

## Prerequisites

Before you begin make sure you have:

- Python 3.11 installed
- Node.js 18+ installed
- A Supabase account (free at supabase.com)
- A Google AI Studio account for Gemini API key (free at aistudio.google.com)
- Git installed

---

## Local Setup — Step by Step

### Step 1 — Clone the repository

```bash
git clone https://github.com/asmita214/DriftWatch.git
cd DriftWatch
```

### Step 2 — Set up Supabase

1. Go to supabase.com and create a new project named `driftwatch`
2. Go to SQL Editor and run the following to create all tables:

```sql
create table models (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  model_name text not null,
  model_version text default '1.0',
  description text,
  created_at timestamp default now()
);

create table prediction_logs (
  id uuid default gen_random_uuid() primary key,
  model_id uuid references models(id) on delete cascade,
  input_features jsonb not null,
  prediction_output text not null,
  confidence_score float,
  timestamp timestamp default now(),
  metadata jsonb
);

create table drift_events (
  id uuid default gen_random_uuid() primary key,
  model_id uuid references models(id) on delete cascade,
  drift_type text not null,
  severity_score float,
  affected_features jsonb,
  started_at timestamp,
  detected_at timestamp default now(),
  status text default 'active'
);

create table shap_records (
  id uuid default gen_random_uuid() primary key,
  drift_event_id uuid references drift_events(id) on delete cascade,
  feature_name text not null,
  shap_value float,
  direction text,
  rank integer
);

create table cluster_snapshots (
  id uuid default gen_random_uuid() primary key,
  drift_event_id uuid references drift_events(id) on delete cascade,
  cluster_id integer,
  cluster_size integer,
  representative_features jsonb,
  description text
);

create table remediation_recipes (
  id uuid default gen_random_uuid() primary key,
  drift_event_id uuid references drift_events(id) on delete cascade,
  report_text text,
  retraining_recommendation text,
  data_window_suggestion text,
  created_at timestamp default now()
);

create table feature_schemas (
  id uuid default gen_random_uuid() primary key,
  model_id uuid references models(id) on delete cascade,
  feature_name text not null,
  feature_type text not null,
  unit text,
  low_threshold float,
  high_threshold float,
  low_label text,
  medium_label text,
  high_label text,
  description text,
  created_at timestamp default now()
);

create table api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  key_hash text not null unique,
  key_prefix text not null,
  name text default 'Default Key',
  created_at timestamp default now(),
  last_used_at timestamp
);
```

3. Enable Row Level Security on all tables:

```sql
alter table models enable row level security;
alter table prediction_logs enable row level security;
alter table drift_events enable row level security;
alter table shap_records enable row level security;
alter table cluster_snapshots enable row level security;
alter table remediation_recipes enable row level security;
alter table feature_schemas enable row level security;
alter table api_keys enable row level security;
```

4. Go to Authentication → Providers → enable Email provider
5. Go to Settings → API → copy your Project URL, anon key, and service role key
6. Go to Settings → JWT Keys → copy the JWT secret

### Step 3 — Set up the backend

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` with your values:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
```

Get your Gemini API key free at: https://aistudio.google.com/app/apikey

Start the backend:

```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Step 4 — Set up the frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

### Step 5 — First time setup

1. Open `http://localhost:5173`
2. Click **Get Started Free** and create your account
3. Go to **Models** page and register your first model
4. Go to **Setup** page — copy your Model ID and generate an API key
5. Use the SDK snippet shown to connect your existing Python model

---

## Connecting Your Existing Model

After registering your model and generating an API key, add this to your Python project:

```python
import requests
from functools import wraps

DRIFTWATCH_URL = "http://localhost:8000"  # or your deployed URL
MODEL_ID = "your-model-id-from-setup-page"
API_KEY = "DW_your-api-key-from-setup-page"

def monitor(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        try:
            requests.post(
                f"{DRIFTWATCH_URL}/api/ingest/log-prediction",
                json={
                    "model_id": MODEL_ID,
                    "input_features": kwargs if kwargs else {},
                    "prediction_output": str(result),
                    "confidence_score": None
                },
                headers={"Authorization": f"Bearer {API_KEY}"},
                timeout=2
            )
        except:
            pass  # never breaks your model
        return result
    return wrapper

# wrap your existing model — this is all you need
model.predict = monitor(model.predict)
```

---

## Testing with Simulated Data

To test the system with realistic drift data without a real model:

1. Open `backend/simulate_data.py`
2. Replace `MODEL_ID` with your model's UUID from the Models page
3. Run:

```bash
python simulate_data.py
```

This sends 50 normal predictions followed by 50 drifted predictions — simulating a new user segment appearing in production. After running, go to your Dashboard to see drift detected, SHAP analysis, clusters, and severity score.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ingest/register-model` | Register a new model |
| POST | `/api/ingest/log-prediction` | Log a single prediction |
| POST | `/api/ingest/log-batch` | Log predictions in bulk |
| GET | `/api/ingest/models` | Get all models for current user |
| GET | `/api/drift/analyze/{model_id}` | Full statistical drift report |
| GET | `/api/drift/summary/{model_id}` | Plain English drift summary |
| GET | `/api/drift/shap/{model_id}` | SHAP feature importance |
| GET | `/api/drift/clusters/{model_id}` | HDBSCAN cluster analysis |
| GET | `/api/drift/severity/{model_id}` | XGBoost severity score |
| GET | `/api/drift/similar/{model_id}` | FAISS historical pattern match |
| GET | `/api/reports/generate/{model_id}` | Generate Gemini report |
| GET | `/api/reports/history/{model_id}` | Past reports |
| GET | `/api/forecast/predict/{model_id}` | 14-day Prophet forecast |
| POST | `/api/forecast/generate-history/{model_id}` | Generate synthetic history |
| POST | `/api/schema/define` | Define feature schema |
| GET | `/api/schema/{model_id}` | Get feature schema |
| POST | `/api/keys/generate` | Generate permanent API key |
| GET | `/api/keys/list` | List API keys |
| DELETE | `/api/keys/{key_id}` | Revoke API key |

All endpoints except auth require Bearer token (JWT or API key) in Authorization header.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (never expose publicly) |
| `SUPABASE_JWT_SECRET` | JWT secret for token verification |
| `GEMINI_API_KEY` | Google Gemini API key |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (safe for frontend) |
| `VITE_API_URL` | Backend URL (localhost or deployed) |

---

## Deployment

### Backend — Render

1. Push code to GitHub
2. Go to render.com → New Web Service → connect your repo
3. Set Root Directory to `backend`
4. Set Build Command to `pip install -r requirements.txt`
5. Set Start Command to `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables from `backend/.env`
7. Add `PYTHON_VERSION = 3.11.0` as environment variable
8. Deploy

To prevent free tier spin-down: set up a free monitor at uptimerobot.com to ping your backend URL every 14 minutes.

### Frontend — Vercel

1. Go to vercel.com → New Project → import your repo
2. Set Root Directory to `frontend`
3. Add environment variables from `frontend/.env` with your deployed backend URL
4. Deploy

After deploying update `backend/main.py` CORS to include your Vercel URL.

---

## How It Works

```
User's Model → predict() called
      ↓
DriftWatch SDK wraps predict()
      ↓
Prediction logged to Supabase via API
      ↓
Drift Detector runs PSI + KS + Chi-squared
      ↓
If drift detected:
  SHAP Analyzer → which features caused it
  HDBSCAN → what new user segments appeared
  FAISS → similar past events
  XGBoost → severity score 0-100
  Prophet → when will it get critical
  Gemini → plain English investigation report
      ↓
Dashboard shows everything in real time
```

---

## Why DriftWatch is Different

Every existing tool (Evidently, WhyLabs, Arize) tells you **that** something went wrong. DriftWatch tells you **why**, **which segment** is affected, **when** it will become critical, and **what to do** — all in one system, automatically, in plain English.

---

## Built By

**Asmita Gupta** — B.Tech CSE student at BPIT Delhi (2024-2028)

Built as a production-grade portfolio project targeting Data Science and ML internships.

---

## License

MIT License — free to use, modify, and distribute.
