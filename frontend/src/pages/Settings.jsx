import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, AlertCircle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { useModel } from '../context/ModelContext';
import { getSchema, defineSchema } from '../api/client';

const FEATURE_TYPES = ['numerical', 'categorical', 'boolean', 'text', 'datetime'];

const emptyFeature = () => ({
  name: '', type: 'numerical', unit: '', threshold_low: '', threshold_high: '', labels: ''
});

const SchemaSettings = () => {
  const { modelId } = useModel();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentSchema, setCurrentSchema] = useState(null);
  const [features, setFeatures] = useState([emptyFeature()]);

  const load = async () => {
    if (!modelId) return;
    setLoading(true); setError(null);
    try {
      const res = await getSchema(modelId);
      const schema = res.data;
      setCurrentSchema(schema);
      const schemaObj = schema?.schema || {};
      const feats = Object.entries(schemaObj).map(([name, v]) => ({
        name,
        type: v.feature_type || 'numerical',
        unit: v.unit || '',
        threshold_low: v.low_threshold ?? '',
        threshold_high: v.high_threshold ?? '',
        labels: v.low_label && v.medium_label && v.high_label
          ? `${v.low_label}, ${v.medium_label}, ${v.high_label}`
          : '',
      }));
      if (feats.length > 0) setFeatures(feats);
    } catch {
      setCurrentSchema(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [modelId]);

  const addFeature = () => setFeatures(prev => [...prev, emptyFeature()]);
  const removeFeature = (i) => setFeatures(prev => prev.filter((_, idx) => idx !== i));
  const updateFeature = (i, key, val) => setFeatures(prev => prev.map((f, idx) => idx === i ? { ...f, [key]: val } : f));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    try {
      const payload = {
        model_id: modelId,
        features: features
          .filter(f => f.name.trim())
          .map(f => ({
            feature_name: f.name,
            feature_type: f.type,
            unit: f.unit || '',
            low_threshold: f.threshold_low !== '' ? Number(f.threshold_low) : null,
            high_threshold: f.threshold_high !== '' ? Number(f.threshold_high) : null,
            low_label: f.labels ? f.labels.split(',')[0]?.trim() : 'low',
            medium_label: f.labels ? f.labels.split(',')[1]?.trim() : 'medium',
            high_label: f.labels ? f.labels.split(',')[2]?.trim() : 'high',
            description: '',
          })),
      };
      await defineSchema(payload);
      setSuccess(true);
      load();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save schema.');
    } finally {
      setSaving(false);
    }
  };

  if (!modelId) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 16, fontWeight: 600 }}>
        Select a model to manage schema settings.
      </div>
    </div>
  );

  const schemaObj = currentSchema?.schema || {};
  const schemaFeatures = Object.entries(schemaObj).map(([name, v]) => ({
    name,
    type: v.feature_type || 'numerical',
    unit: v.unit || '—',
    threshold_low: v.low_threshold ?? '—',
    threshold_high: v.high_threshold ?? '—',
    labels: v.low_label && v.high_label
      ? `${v.low_label}, ${v.medium_label || 'medium'}, ${v.high_label}`
      : '—',
  }));

  return (
    <div className="page">
      <div className="container" style={{ padding: '48px var(--page-x)' }}>

        <div className="fade-up" style={{ marginBottom: 48 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Configuration</div>
          <h1 className="page-title">Schema Settings</h1>
          <div className="page-sub">
            Define expected feature inputs and baselines for{' '}
            <span style={{ fontFamily: 'monospace', color: 'var(--text-2)', fontWeight: 600 }}>{modelId}</span>
          </div>
        </div>

        {/* Current schema table */}
        <div className="fade-up d1" style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 20 }}>Current Schema</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
              </div>
            ) : schemaFeatures.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Feature Name</th>
                    <th>Type</th>
                    <th>Unit</th>
                    <th>Threshold Low</th>
                    <th>Threshold High</th>
                    <th>Labels</th>
                  </tr>
                </thead>
                <tbody>
                  {schemaFeatures.map((f, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-1)', fontWeight: 600 }}>{f.name}</td>
                      <td><span className="badge badge-neutral">{f.type}</span></td>
                      <td style={{ color: 'var(--text-2)' }}>{f.unit}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-2)', fontWeight: 500 }}>{f.threshold_low}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-2)', fontWeight: 500 }}>{f.threshold_high}</td>
                      <td style={{ color: 'var(--text-2)' }}>{f.labels}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
                <Settings size={32} color="var(--primary)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
                <div style={{ fontSize: 15, fontWeight: 500 }}>No schema defined yet. Add features below.</div>
              </div>
            )}
          </div>
        </div>

        {/* Define schema form */}
        <div className="fade-up d2">
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>Define Feature Schema</div>
          <div style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 32, fontWeight: 500 }}>
            Update or define the features this model expects as inputs
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
              {features.map((feat, i) => (
                <div key={i} className="card" style={{ padding: '24px', position: 'relative' }}>
                  {features.length > 1 && (
                    <button type="button" onClick={() => removeFeature(i)}
                      style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-raised)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--red)', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--red-dim)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 20 }}>
                    <div>
                      <label className="field-label">Feature Name *</label>
                      <input className="input" placeholder="e.g. age" value={feat.name} onChange={e => updateFeature(i, 'name', e.target.value)} required />
                    </div>
                    <div>
                      <label className="field-label">Type</label>
                      <select className="input" value={feat.type} onChange={e => updateFeature(i, 'type', e.target.value)}>
                        {FEATURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Unit</label>
                      <input className="input" placeholder="e.g. USD" value={feat.unit} onChange={e => updateFeature(i, 'unit', e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Threshold Low</label>
                      <input className="input" type="number" placeholder="0" value={feat.threshold_low} onChange={e => updateFeature(i, 'threshold_low', e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Threshold High</label>
                      <input className="input" type="number" placeholder="100" value={feat.threshold_high} onChange={e => updateFeature(i, 'threshold_high', e.target.value)} />
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <label className="field-label">Labels (low, medium, high — comma separated)</label>
                    <input className="input" placeholder="e.g. low income, medium income, high income" value={feat.labels} onChange={e => updateFeature(i, 'labels', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addFeature} className="btn btn-secondary"
              style={{ width: '100%', height: 48, justifyContent: 'center', borderStyle: 'dashed', marginBottom: 32 }}>
              <Plus size={16} /> Add Feature
            </button>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 8, background: 'var(--red-dim)', border: '1px solid var(--red-border)', fontSize: 14, color: 'var(--red)', marginBottom: 24, fontWeight: 500 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 8, background: 'var(--green-dim)', border: '1px solid var(--green-border)', fontSize: 14, color: 'var(--green)', marginBottom: 24, fontWeight: 500 }}>
                <CheckCircle size={16} /> Schema saved successfully
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ height: 48, padding: '0 40px' }}>
                {saving ? <><RefreshCw size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Schema</>}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SchemaSettings;