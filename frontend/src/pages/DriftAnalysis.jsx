import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useModel } from '../context/ModelContext';
import { getDriftAnalysis, getSHAPData, getClusters, getSimilarEvents } from '../api/client';
import ClusterCard from '../components/ClusterCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

const PSIBadge = ({ value }) => {
  if (value === undefined || value === null) return <span className="text-3">—</span>;
  let colorClass;
  if (value < 0.1) { colorClass = 'badge-green'; }
  else if (value < 0.2) { colorClass = 'badge-yellow'; }
  else { colorClass = 'badge-red'; }
  return (
    <span className={`badge ${colorClass}`}>
      {value < 0.1 ? 'Stable' : value < 0.2 ? 'Warning' : 'Drift'}
    </span>
  );
};

const SectionHeader = ({ number, title, subtitle }) => (
  <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 32 }}>
    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{String(number).padStart(2, '0')}</div>
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 15, color: 'var(--text-3)', marginTop: 6, fontWeight: 500 }}>{subtitle}</p>}
    </div>
  </div>
);

const DriftAnalysis = () => {
  const { modelId } = useModel();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [shap, setShap] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [similar, setSimilar] = useState(null);

  const load = async () => {
    if (!modelId) return;
    setLoading(true); setError(null);
    try {
      const [a, s, c, sim] = await Promise.allSettled([
        getDriftAnalysis(modelId), getSHAPData(modelId),
        getClusters(modelId), getSimilarEvents(modelId),
      ]);
      setAnalysis(a.status === 'fulfilled' ? a.value.data : null);
      setShap(s.status === 'fulfilled' ? s.value.data : null);
      setClusters(c.status === 'fulfilled' ? c.value.data : null);
      setSimilar(sim.status === 'fulfilled' ? sim.value.data : null);
    } catch { setError('Failed to load drift analysis.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [modelId]);

  if (!modelId) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 16, fontWeight: 600 }}>Select a model to view drift analysis.</div>
    </div>
  );

  const features = Array.isArray(analysis?.features) ? analysis.features : Array.isArray(analysis?.drift_results) ? analysis.drift_results : [];
  const shapFeatures = Array.isArray(shap?.features) ? shap.features : Array.isArray(shap) ? shap : [];
  const clusterList = Array.isArray(clusters?.clusters) ? clusters.clusters : Array.isArray(clusters) ? clusters : [];
  const similarList = Array.isArray(similar) ? similar : (similar?.similar_events || []);

  const shapChartData = shapFeatures.map(f => ({
    feature: f.feature || f.name,
    contribution: f.contribution || f.shap_value || 0,
    baseline: f.baseline_mean ?? f.baseline_avg,
    current: f.current_mean ?? f.current_avg,
  }));
  const shapExplanation = shap?.explanation || shap?.summary || '';

  return (
    <div className="page">
      <div className="container" style={{ padding: '48px var(--page-x)' }}>
        
        <div className="fade-up" style={{ marginBottom: 48 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Technical Investigation</div>
          <h1 className="page-title">Drift Analysis</h1>
          <div className="page-sub">Model ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-2)' }}>{modelId}</span></div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 12, border: '1px solid var(--red-border)', background: 'var(--red-dim)', marginBottom: 32, boxShadow: 'var(--shadow-sm)' }}>
            <AlertCircle size={16} color="var(--red)" />
            <span style={{ fontSize: 14, color: 'var(--red)', flex: 1, fontWeight: 500 }}>{error}</span>
            <button onClick={load} className="btn btn-secondary" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* 1. Feature Drift Report */}
        <section style={{ marginBottom: 80 }}>
          <SectionHeader number={1} title="Feature Drift Report" subtitle="Statistical drift detection results for all monitored features" />
          <div className="card fade-up d1" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
              </div>
            ) : features.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>PSI Score</th>
                    <th>Status</th>
                    <th>KS Statistic</th>
                    <th>KS p-value</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => {
                    const isDrift = f.drifted || f.is_drifted || (f.psi_score >= 0.2);
                    return (
                      <tr key={i} className={isDrift ? 'row-alert' : ''}>
                        <td style={{ color: 'var(--text-1)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isDrift && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />}
                          {f.feature || f.feature_name || `Feature ${i}`}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: f.psi_score >= 0.2 ? 'var(--red)' : f.psi_score >= 0.1 ? 'var(--yellow)' : 'var(--green)' }}>
                          {(f.psi_score ?? '—') !== '—' ? Number(f.psi_score).toFixed(4) : '—'}
                        </td>
                        <td><PSIBadge value={f.psi_score} /></td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-2)' }}>{f.ks_statistic !== undefined ? Number(f.ks_statistic).toFixed(4) : '—'}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-2)' }}>{f.ks_pvalue !== undefined ? Number(f.ks_pvalue).toFixed(4) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>No feature drift data available.</div>}
          </div>
        </section>

        {/* 2. SHAP Analysis */}
        <section style={{ marginBottom: 80 }}>
          <SectionHeader number={2} title="SHAP Root Cause Analysis" subtitle="Feature-level contribution to drift, ranked by impact" />
          {loading ? (
            <div className="skeleton fade-up d2" style={{ height: 400 }} />
          ) : shapChartData.length > 0 ? (
            <>
              <div className="card fade-up d2" style={{ padding: '32px 32px 24px', marginBottom: 32 }}>
                <ResponsiveContainer width="100%" height={Math.max(240, shapChartData.length * 40)}>
                  <BarChart data={shapChartData} layout="vertical" margin={{ top: 0, right: 64, left: 16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text-3)', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(1)}%`} />
                    <YAxis type="category" dataKey="feature" tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }} tickLine={false} axisLine={false} width={120} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)' }}
                      itemStyle={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}
                      labelStyle={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}
                      formatter={v => [`${v.toFixed(2)}%`, 'Contribution']}
                    />
                    <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                      {shapChartData.map((_, i) => <Cell key={i} fill={i === 0 ? 'var(--primary)' : 'var(--border-focus)'} />)}
                      <LabelList dataKey="contribution" position="right" formatter={v => `${v.toFixed(1)}%`} style={{ fill: 'var(--text-3)', fontSize: 12, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {shapExplanation && (
                <div className="card fade-up d3" style={{ padding: 24, marginBottom: 32, background: 'var(--bg-raised)', border: '1px solid var(--border-focus)' }}>
                  <div className="eyebrow" style={{ marginBottom: 12 }}>AI Analysis</div>
                  <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, fontWeight: 500 }}>{shapExplanation}</p>
                </div>
              )}

              {shapChartData.some(d => d.baseline !== undefined || d.current !== undefined) && (
                <div className="card fade-up d3" style={{ overflow: 'hidden' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>Baseline Avg</th>
                        <th>Current Avg</th>
                        <th>Change</th>
                        <th>Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shapChartData.map((f, i) => {
                        const change = f.baseline && f.current ? ((f.current - f.baseline) / Math.abs(f.baseline)) * 100 : null;
                        return (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-1)', fontWeight: 600 }}>{f.feature}</td>
                            <td style={{ fontFamily: 'monospace' }}>{f.baseline !== undefined ? Number(f.baseline).toFixed(4) : '—'}</td>
                            <td style={{ fontFamily: 'monospace' }}>{f.current !== undefined ? Number(f.current).toFixed(4) : '—'}</td>
                            <td>
                              {change !== null ? (
                                <span className={`badge ${change > 0 ? 'badge-red' : 'badge-green'}`} style={{ border: 'none', padding: '2px 8px' }}>
                                  {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                </span>
                              ) : '—'}
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: i === 0 ? 'var(--primary)' : 'var(--text-2)' }}>{f.contribution.toFixed(2)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-3)' }}>No SHAP data available.</div>}
        </section>

        {/* 3. Clusters */}
        <section style={{ marginBottom: 80 }}>
          <SectionHeader number={3} title="Segment Intelligence" subtitle="HDBSCAN-identified user segments in live production traffic" />
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
            </div>
          ) : clusterList.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {clusterList.map((c, i) => (
                <div className="fade-up" style={{ animationDelay: `${i * 100}ms` }} key={i}>
                  <ClusterCard cluster={c} index={i} />
                </div>
              ))}
            </div>
          ) : <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-3)' }}>No cluster data available.</div>}
        </section>

        {/* 4. Similar Events */}
        <section style={{ marginBottom: 80 }}>
          <SectionHeader number={4} title="Historical Pattern Match" subtitle="FAISS vector similarity search across historical drift events" />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
            </div>
          ) : similarList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {similarList.map((evt, i) => {
                const simPct = ((evt.similarity_score || evt.similarity || 0) * 100).toFixed(0);
                return (
                  <div key={i} className="card card-hoverable fade-up" style={{ padding: '24px 32px', display: 'flex', alignItems: 'flex-start', gap: 32, animationDelay: `${i * 100}ms` }}>
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: simPct >= 80 ? 'var(--red)' : simPct >= 60 ? 'var(--yellow)' : 'var(--primary)', letterSpacing: '-0.03em' }}>{simPct}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: 4 }}>match</div>
                    </div>
                    <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{evt.event_id || `Event ${i + 1}`}</span>
                        {evt.timestamp && <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{new Date(evt.timestamp).toLocaleDateString()}</span>}
                      </div>
                      {evt.affected_features && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {(evt.affected_features || []).map((f, j) => <span key={j} className="badge badge-neutral">{f}</span>)}
                        </div>
                      )}
                      {evt.recommendation && <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginTop: 8, fontWeight: 500 }}>{evt.recommendation}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ padding: 64, textAlign: 'center', color: 'var(--text-3)' }}>No historical pattern matches found.</div>}
        </section>

      </div>
    </div>
  );
};

export default DriftAnalysis;
