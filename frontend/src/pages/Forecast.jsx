import React, { useEffect, useState } from 'react';
import { AlertTriangle, CloudLightning, RefreshCw, AlertCircle, TrendingUp, Play, CheckCircle } from 'lucide-react';
import { useModel } from '../context/ModelContext';
import { getForecast, generateDriftHistory } from '../api/client';
import ForecastChart from '../components/ForecastChart';

const Forecast = () => {
  const { modelId } = useModel();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genSuccess, setGenSuccess] = useState(false);
  const [noHistory, setNoHistory] = useState(false);

  const load = async () => {
    if (!modelId) return;
    setLoading(true); setError(null); setNoHistory(false);
    try {
      const res = await getForecast(modelId);
      setData(res.data);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || '';
      if (msg.toLowerCase().includes('no data') || msg.toLowerCase().includes('history') || e.response?.status === 404) {
        setNoHistory(true);
      } else {
        setError('Failed to load forecast data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [modelId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateDriftHistory(modelId);
      setGenSuccess(true);
      setTimeout(() => { setGenSuccess(false); load(); }, 1500);
    } catch {
      setError('Failed to generate history.');
    } finally {
      setGenerating(false);
    }
  };

  if (!modelId) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 16, fontWeight: 600 }}>Select a model to view forecast.</div>
    </div>
  );

  const forecast = Array.isArray(data?.forecast) ? data.forecast : Array.isArray(data) ? data : [];
  const trend = data?.trend || data?.trend_message || '';
  const criticalDay = forecast.find(d => d.severity >= 75);
  const startSev = forecast[0]?.severity ?? 0;
  const endSev = forecast[forecast.length - 1]?.severity ?? 0;
  const rising = endSev > startSev;

  return (
    <div className="page">
      <div className="container" style={{ padding: '48px var(--page-x)' }}>
        
        <div className="fade-up" style={{ marginBottom: 48 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Predictive Intelligence</div>
          <h1 className="page-title">14-Day Severity Forecast</h1>
          <div className="page-sub">Prophet-powered time series projections with confidence intervals</div>
        </div>

        {error && (
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 12, border: '1px solid var(--red-border)', background: 'var(--red-dim)', marginBottom: 32, boxShadow: 'var(--shadow-sm)' }}>
            <AlertCircle size={16} color="var(--red)" />
            <span style={{ fontSize: 14, color: 'var(--red)', flex: 1, fontWeight: 500 }}>{error}</span>
            <button onClick={load} className="btn btn-secondary" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* No history */}
        {!loading && noHistory && (
          <div className="card fade-up" style={{ padding: '64px', textAlign: 'center', marginBottom: 48 }}>
            <CloudLightning size={48} color="var(--primary)" style={{ margin: '0 auto 24px' }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12 }}>No Drift History Found</div>
            <div style={{ fontSize: 15, color: 'var(--text-3)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Forecast requires historical drift data. Generate synthetic history to enable predictions for this model.
            </div>
            <button onClick={handleGenerate} disabled={generating || genSuccess} className="btn btn-primary" style={{ margin: '0 auto', height: 48, padding: '0 32px' }}>
              {generating ? <><RefreshCw size={16} className="animate-spin" /> Generating...</> : genSuccess ? <><CheckCircle size={16} /> Generated</> : <><Play size={16} /> Generate History</>}
            </button>
          </div>
        )}

        {/* Trend alert */}
        {!loading && !noHistory && forecast.length > 0 && (
          <div className="fade-up d1" style={{
            padding: '24px 32px', borderRadius: 12, marginBottom: 40, boxShadow: 'var(--shadow-sm)',
            border: rising && endSev >= 75 ? '1px solid var(--red-border)' : rising ? '1px solid var(--yellow-border)' : '1px solid var(--green-border)',
            background: rising && endSev >= 75 ? 'var(--red-dim)' : rising ? 'var(--yellow-dim)' : 'var(--green-dim)',
            display: 'flex', alignItems: 'flex-start', gap: 16
          }}>
            <div style={{ marginTop: 2 }}>
              {rising && endSev >= 75 ? <AlertTriangle size={24} color="var(--red)" /> : rising ? <TrendingUp size={24} color="var(--yellow)" /> : <CheckCircle size={24} color="var(--green)" />}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: rising && endSev >= 75 ? 'var(--red)' : rising ? 'var(--yellow)' : 'var(--green)', marginBottom: 6 }}>
                {rising && endSev >= 75 ? 'Critical Trajectory Detected' : rising ? 'Severity Rising' : 'Severity Stable or Declining'}
              </div>
              {trend && <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 6, fontWeight: 500 }}>{trend}</div>}
              {criticalDay && (
                <div style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>
                  Predicted to reach <span style={{ color: 'var(--red)', fontWeight: 700 }}>critical severity</span> on <span style={{ color: 'var(--text-1)', fontWeight: 800 }}>Day {criticalDay.day}</span> with score <span style={{ color: 'var(--red)', fontWeight: 800 }}>{criticalDay.severity?.toFixed(1)}</span>.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="card fade-up d2" style={{ padding: '32px', marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Severity Projection</div>
              <div style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>Shaded area represents 80% confidence interval</div>
            </div>
          </div>
          <ForecastChart data={forecast} loading={loading} />
        </div>

        {/* Table */}
        {!loading && forecast.length > 0 && (
          <div className="card fade-up d3" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Day-by-Day Predictions</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Predicted Severity</th>
                  <th>Lower Bound</th>
                  <th>Upper Bound</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((r, i) => {
                  const sev = r.severity ?? r.predicted_severity ?? 0;
                  const isCrit = sev >= 75;
                  const isWarn = sev >= 50;
                  return (
                    <tr key={i} className={isCrit ? 'row-alert' : ''}>
                      <td style={{ color: 'var(--text-1)', fontWeight: 700 }}>Day {r.day}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: isCrit ? 'var(--red)' : isWarn ? 'var(--yellow)' : 'var(--text-1)' }}>
                        {sev.toFixed(1)}
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-3)', fontWeight: 500 }}>{(r.lower ?? r.lower_bound)?.toFixed(1) ?? '—'}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-3)', fontWeight: 500 }}>{(r.upper ?? r.upper_bound)?.toFixed(1) ?? '—'}</td>
                      <td>
                        <span className={`badge badge-${isCrit ? 'red' : isWarn ? 'yellow' : 'green'}`}>
                          {isCrit ? 'Critical' : isWarn ? 'Warning' : 'Elevated'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default Forecast;
