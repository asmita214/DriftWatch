import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 240000,
  headers: { 'Content-Type': 'application/json' },
});

// attach JWT token to every request automatically
client.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default client;

// ── Models ────────────────────────────────────────────────────────────────────
export const getModels = () => client.get('/api/ingest/models');
export const registerModel = (data) => client.post('/api/ingest/register-model', data);
export const getPredictionLogs = (modelId) => client.get(`/api/ingest/logs/${modelId}`);
export const deleteModel = (modelId) => client.delete(`/api/ingest/models/${modelId}`);

// ── Drift ─────────────────────────────────────────────────────────────────────
export const getDriftAnalysis = (modelId) => client.get(`/api/drift/analyze/${modelId}`);
export const getDriftSummary = (modelId) => client.get(`/api/drift/summary/${modelId}`);
export const getSHAPData = (modelId) => client.get(`/api/drift/shap/${modelId}`);
export const getClusters = (modelId) => client.get(`/api/drift/clusters/${modelId}`);
export const getSeverity = (modelId) => client.get(`/api/drift/severity/${modelId}`);
export const getSimilarEvents = (modelId) => client.get(`/api/drift/similar/${modelId}`);

// ── Reports ───────────────────────────────────────────────────────────────────
export const generateReport = (modelId, modelName) =>
  client.get(`/api/reports/generate/${modelId}`, { params: modelName ? { model_name: modelName } : {} });
export const getReportHistory = (modelId) => client.get(`/api/reports/history/${modelId}`);

// ── Forecast ──────────────────────────────────────────────────────────────────
export const getForecast = (modelId) => client.get(`/api/forecast/predict/${modelId}`);
export const generateDriftHistory = (modelId) => client.post(`/api/forecast/generate-history/${modelId}`);

// ── Schema ────────────────────────────────────────────────────────────────────
export const defineSchema = (data) => client.post('/api/schema/define', data);
export const getSchema = (modelId) => client.get(`/api/schema/${modelId}`);