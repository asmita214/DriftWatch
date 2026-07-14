import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { useModel } from '../context/ModelContext';
import { getSeverity, getDriftSummary, getSHAPData, getClusters, getSimilarEvents, getForecast, getDriftAnalysis } from '../api/client';

import SeverityGauge from '../components/SeverityGauge';
import SHAPBarChart from '../components/SHAPBarChart';
import StatCard from '../components/StatCard';
import StatusBanner from '../components/StatusBanner';

const Dashboard = () => {
  const { modelId, modelName, models } = useModel();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [d, setD] = useState({ sev: null, sum: null, shap: null, clusters: null, similar: null, forecast: null });

  const load = async () => {
    if (!modelId) return;
    setLoading(true); setError(null);
    const [sev, sum, shap, clust, sim, fore,drift] = await Promise.allSettled([
      getSeverity(modelId), getDriftSummary(modelId), getSHAPData(modelId),
      getClusters(modelId), getSimilarEvents(modelId), getForecast(modelId),getDriftAnalysis(modelId),
    ]);
    setD({
      sev:      sev.status   === 'fulfilled' ? sev.value.data   : null,
      sum:      sum.status   === 'fulfilled' ? sum.value.data   : null,
      shap:     shap.status  === 'fulfilled' ? shap.value.data  : null,
      clusters: clust.status === 'fulfilled' ? clust.value.data : null,
      similar:  sim.status   === 'fulfilled' ? sim.value.data   : null,
      forecast: fore.status  === 'fulfilled' ? fore.value.data  : null,
      drift:    drift.status === 'fulfilled' ? drift.value.data : null,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [modelId]);

  if (!modelId) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Select a model to view the dashboard</div>
        <div style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 8 }}>Use the model selector in the navbar</div>
      </div>
    </div>
  );

  const score     = d.sev?.severity_score ?? d.sev?.score ?? 0;
  const summary = d.sum?.message || d.sum?.summary || '';
  const shaps = d.shap?.feature_importance_ranking || d.shap?.features || [];
  const clusters  = Array.isArray(d.clusters?.clusters) ? d.clusters.clusters : Array.isArray(d.clusters) ? d.clusters : [];
  const simList   = Array.isArray(d.similar) ? d.similar : (d.similar?.similar_events || []);
  const foreArr   = Array.isArray(d.forecast?.forecast) ? d.forecast.forecast : Array.isArray(d.forecast) ? d.forecast : [];
  const critDay   = foreArr.find(x => x.severity >= 75);
  const topFeature = shaps[0]?.feature || shaps[0]?.name || '—';
  const drifted = d.drift?.drifted_features?.length ?? shaps.filter(f => f.drifted).length;
  const isDrift   = score >= 40;

  return (
    <div className="page">
      <StatusBanner score={score} drifted={isDrift} message={summary.slice(0, 160) || `Monitoring ${modelId}`} />

      <div className="container" style={{ padding: '32px var(--page-x)' }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 12, border: '1px solid var(--red-border)', background: 'var(--red-dim)', marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
            <AlertCircle size={16} color="var(--red)" />
            <span style={{ fontSize: 14, color: 'var(--red)', flex: 1, fontWeight: 500 }}>{error}</span>
            <button onClick={load} className="btn btn-secondary" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Gauge card */}
            <div className="card fade-up d1" style={{ padding: '40px 32px', minHeight: 430, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 32 }}>
  
  {/* Left side info */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>Model</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{modelName || 'Unknown Model'}</div>
<div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
  {models?.find(m => m.id === modelId)?.model_version ? `v${models.find(m => m.id === modelId).model_version} · Production` : 'Production'}
</div>
    </div>

    <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />

    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 12 }}>Drift Breakdown</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(d.drift?.drifted_features || []).slice(0, 4).map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, fontFamily: 'monospace' }}>{f}</span>
          </div>
        ))}
        {(d.drift?.drifted_features || []).length > 4 && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>+{(d.drift?.drifted_features || []).length - 4} more features</div>
        )}
      </div>
    </div>

    <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />

    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>Detected</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  </div>

  {/* Center gauge */}
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 24 }}>Current Severity</div>
    <SeverityGauge value={score} size={270} />
  </div>

  {/* Right side info */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>Severity Level</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: score >= 75 ? 'var(--red)' : score >= 40 ? 'var(--yellow)' : 'var(--green)' }}>
        {score >= 75 ? 'CRITICAL' : score >= 40 ? 'WARNING' : 'HEALTHY'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
        {score >= 75 ? 'Immediate action required' : score >= 40 ? 'Monitor closely' : 'All systems normal'}
      </div>
    </div>

    <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />

    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 12 }}>Score Breakdown</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Features Drifted', value: `${drifted}/7`, color: 'var(--red)' },
          { label: 'New Segments', value: clusters.length, color: 'var(--yellow)' },
          { label: 'Top Culprit', value: topFeature, color: 'var(--text-1)' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{item.label}</span>
            <span style={{ fontSize: 13, color: item.color, fontWeight: 700, fontFamily: 'monospace' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />

    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>Recommendation</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, fontWeight: 500 }}>
        {score >= 75 ? 'Retrain model immediately using recent data. Focus on drifted features.' : score >= 40 ? 'Schedule retraining within 2 weeks.' : 'No action required. Continue monitoring.'}
      </div>
    </div>
  </div>

</div>

            {/* 4 stats */}
            <div className="fade-up d2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              <StatCard loading={loading} label="Status"
                value={isDrift ? 'Drifting' : 'Stable'}
                color={isDrift ? 'var(--red)' : 'var(--green)'} />
              <StatCard loading={loading} label="Features Drifted"
                value={`${drifted} / ${shaps.length || '?'}`}
                color={drifted > 0 ? 'var(--yellow)' : 'var(--green)'} />
              <StatCard loading={loading} label="Top Culprit"
                value={topFeature} sub="Highest SHAP impact" />
              <StatCard loading={loading} label="Segments"
                value={clusters.length} sub="HDBSCAN clusters" />
            </div>

            {/* SHAP */}
            <div className="card fade-up d3" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>SHAP Feature Contributions</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Top contributors ranked by drift impact</div>
              </div>
              <div style={{ padding: '24px' }}>
                {loading
                  ? [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 16, marginBottom: 16, opacity: 1 - i * 0.15 }} />)
                  : <SHAPBarChart data={shaps.slice(0, 8)} />}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Summary */}
            <div className="card fade-up d2" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12 }}>Drift Summary</div>
              {loading
                ? [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 12, marginBottom: 10, width: i % 2 ? '85%' : '100%' }} />)
                : <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, fontWeight: 500 }}>{summary || 'No summary available.'}</p>}
            </div>

            {/* Forecast alert */}
            {!loading && critDay && (
              <div className="fade-up d3" style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid var(--red-border)', background: 'var(--red-dim)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <TrendingUp size={16} color="var(--red)" />
                  <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Forecast Alert</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.6, fontWeight: 500 }}>
                  Critical threshold predicted on <span style={{ fontWeight: 700 }}>Day {critDay.day}</span> — score{' '}
                  <span style={{ color: 'var(--red)', fontWeight: 800 }}>{critDay.severity?.toFixed(0)}</span>.
                </p>
              </div>
            )}

            {/* Closest match */}
            <div className="card fade-up d3" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>Closest Historical Match</div>
              {loading
                ? <div className="skeleton" style={{ height: 48 }} />
                : simList[0]
                  ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{simList[0].event_id || 'Past Event'}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>
                          {(simList[0].similarity_percentage || simList[0].similarity_score || 0).toFixed(0)}%
                        </span>
                      </div>
                      {simList[0].recommendation && (
                        <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7, fontWeight: 500 }}>{simList[0].recommendation}</p>
                      )}
                    </div>
                  )
                  : <p style={{ fontSize: 14, color: 'var(--text-3)' }}>No matches found.</p>}
            </div>

            {/* Clusters */}
            <div className="card fade-up d4" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Segments</div>
              </div>
              {loading
                ? <div style={{ padding: '16px 24px' }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 32, marginBottom: 12 }} />)}</div>
                : clusters.length
                  ? clusters.slice(0, 5).map((c, i) => {
                      const pct = c.percentage_of_drifted_data || c.drift_percentage || 0;
                      const pctColor = pct > 50 ? 'var(--red)' : pct > 25 ? 'var(--yellow)' : 'var(--green)';
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: i < clusters.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Cluster {c.cluster_id ?? i}</span>
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace', fontWeight: 500 }}>{c.size ?? '?'} samples</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: pctColor }}>{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })
                  : <div style={{ padding: '20px 24px', fontSize: 14, color: 'var(--text-3)' }}>No cluster data.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
