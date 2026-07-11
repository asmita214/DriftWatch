import React, { useEffect, useState } from 'react';
import { RefreshCw, Play, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { useModel } from '../context/ModelContext';
import { getReportHistory, generateReport } from '../api/client';
import ReportViewer from '../components/ReportViewer';

const Reports = () => {
  const { modelId } = useModel();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [genSuccess, setGenSuccess] = useState(false);

  const load = async () => {
    if (!modelId) return;
    setLoading(true); setError(null);
    try {
      const res = await getReportHistory(modelId);
      setReports(Array.isArray(res.data) ? res.data : (res.data?.reports || []));
    } catch {
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [modelId]);

  const handleGenerate = async () => {
    setGenerating(true); setGenError(null); setGenSuccess(false);
    try {
      await generateReport(modelId);
      setGenSuccess(true);
      load();
      setTimeout(() => setGenSuccess(false), 3000);
    } catch (e) {
      setGenError(e.response?.data?.detail || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  if (!modelId) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 16, fontWeight: 600 }}>Select a model to view reports.</div>
    </div>
  );

  return (
    <div className="page">
      <div className="container" style={{ padding: '48px var(--page-x)' }}>
        
        <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>AI Investigation</div>
            <h1 className="page-title">Synthesized Reports</h1>
            <div className="page-sub">Gemini-generated incident summaries and action plans</div>
          </div>
          <button onClick={handleGenerate} disabled={generating} className="btn btn-primary" style={{ height: 44, padding: '0 24px' }}>
            {generating ? <><RefreshCw size={14} className="animate-spin" /> Generating...</> : <><Play size={14} /> Generate Report</>}
          </button>
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

        {genError && (
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 12, border: '1px solid var(--red-border)', background: 'var(--red-dim)', marginBottom: 32, boxShadow: 'var(--shadow-sm)' }}>
            <AlertCircle size={16} color="var(--red)" />
            <span style={{ fontSize: 14, color: 'var(--red)', fontWeight: 500 }}>{genError}</span>
          </div>
        )}
        
        {genSuccess && (
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 12, border: '1px solid var(--green-border)', background: 'var(--green-dim)', marginBottom: 32, boxShadow: 'var(--shadow-sm)' }}>
            <CheckCircle size={16} color="var(--green)" />
            <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 500 }}>Report generated successfully.</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {[...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 400 }} />)}
          </div>
        ) : reports.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {reports.map((r, i) => (
              <div key={i} className="fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <ReportViewer report={r} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card fade-up" style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
            <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 24px', opacity: 0.8 }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12 }}>No reports available</div>
            <div style={{ fontSize: 15, maxWidth: 480, margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>Generate an AI investigation report to synthesize current drift signals into an actionable summary.</div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
