import React, { useState } from 'react';
import { Cpu, Plus, RefreshCw, AlertCircle, CheckCircle, Calendar, Trash2 } from 'lucide-react';
import { useModel } from '../context/ModelContext';
import { registerModel, deleteModel } from '../api/client';
import { useNavigate } from 'react-router-dom';
const Models = () => {
  const { setModelId, setModelName, models, modelsLoading: loading, modelsError: error, refreshModels } = useModel();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [fName, setFName] = useState('');
  const [fVersion, setFVersion] = useState('1.0');
  const [fDesc, setFDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState(null);
  const [formSucc, setFormSucc] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormErr(null); setFormSucc(false);
    try {
      await registerModel({
        user_id: 'asmita_test',
        model_name: fName,
        model_version: fVersion,
        description: fDesc,
      });
      setFormSucc(true);
      setTimeout(() => {
        setFormSucc(false);
        setShowForm(false);
        setFName(''); setFVersion('1.0'); setFDesc('');
        refreshModels();
        navigate('/quickstart');
      }, 1500);
    } catch (err) {
      setFormErr(err.response?.data?.detail || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectModel = (id, name) => {
    setModelId(id);
    setModelName(name);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete model "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteModel(id);
      refreshModels();
    } catch {
      alert('Failed to delete model.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ padding: '48px var(--page-x)' }}>

        <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Registry</div>
            <h1 className="page-title">Registered Models</h1>
            <div className="page-sub">Manage and monitor ML models across your infrastructure</div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn btn-secondary' : 'btn btn-primary'} style={{ height: 44, padding: '0 24px' }}>
            <Plus size={16} /> {showForm ? 'Cancel' : 'Register Model'}
          </button>
        </div>

        {error && (
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 12, border: '1px solid var(--red-border)', background: 'var(--red-dim)', marginBottom: 32 }}>
            <AlertCircle size={16} color="var(--red)" />
            <span style={{ fontSize: 14, color: 'var(--red)', flex: 1, fontWeight: 500 }}>{error}</span>
            <button onClick={refreshModels} className="btn btn-secondary" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {showForm && (
          <div className="card fade-up" style={{ padding: '32px', marginBottom: 48, border: '2px solid var(--border-focus)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 24 }}>Register New Model</div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="field-label">Model Name *</label>
                <input className="input" placeholder="e.g. fraud_detection_v2" value={fName} onChange={e => setFName(e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Model Version</label>
                <input className="input" placeholder="1.0" value={fVersion} onChange={e => setFVersion(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Description</label>
                <textarea className="input" style={{ minHeight: 80, resize: 'vertical', padding: '12px 16px' }} placeholder="Brief description of what this model does..." value={fDesc} onChange={e => setFDesc(e.target.value)} />
              </div>
              <div style={{ marginTop: 8 }}>
                {formErr && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
                    <AlertCircle size={14} /> {formErr}
                  </div>
                )}
                {formSucc && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)', fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
                    <CheckCircle size={14} /> Successfully registered
                  </div>
                )}
                <button type="submit" disabled={submitting || formSucc} className="btn btn-primary" style={{ height: 44, padding: '0 32px' }}>
                  {submitting ? <><RefreshCw size={14} className="animate-spin" /> Registering...</> : 'Register'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 220 }} />)}
          </div>
        ) : models.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {models.map((m, i) => {
              const id = m.id;
              const name = m.model_name || 'Unknown Model';
              const version = m.model_version || '1.0';
              const desc = m.description || 'No description provided.';
              const isDeleting = deletingId === id;
              return (
                <div key={id} className="card card-hoverable fade-up" style={{ padding: '24px', animationDelay: `${i * 50}ms`, display: 'flex', flexDirection: 'column', gap: 20, opacity: isDeleting ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                      <Cpu size={24} color="var(--primary)" />
                    </div>
                    <span className="badge badge-neutral">v{version}</span>
                  </div>

                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>{name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                      <Calendar size={14} color="var(--text-3)" />
                      <span style={{ fontWeight: 600 }}>Created:</span>
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => selectModel(id, name)} className="btn btn-secondary" style={{ flex: 1 }}>
                      Select Model
                    </button>
                    <button
                      onClick={() => handleDelete(id, name)}
                      disabled={isDeleting}
                      style={{ width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--red)', transition: 'all 0.2s', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card fade-up" style={{ padding: '80px 20px', textAlign: 'center' }}>
            <Cpu size={48} color="var(--primary)" style={{ margin: '0 auto 24px', opacity: 0.8 }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12 }}>No models registered</div>
            <div style={{ fontSize: 15, color: 'var(--text-3)', marginBottom: 32, fontWeight: 500 }}>Register your first ML model to start monitoring for drift.</div>
            <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ height: 44, padding: '0 32px' }}>
              <Plus size={16} /> Register Model
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Models;