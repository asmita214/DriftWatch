import React, { useState, useEffect } from 'react';
import { Copy, Check, Key, Cpu, ArrowRight, Plus, Trash2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useModel } from '../context/ModelContext';
import { supabase } from '../api/client';
import client from '../api/client';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-raised)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: copied ? 'var(--green)' : 'var(--text-2)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

const Step = ({ number, title, children }) => (
  <div className="card" style={{ padding: '32px', marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>{number}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{title}</div>
    </div>
    {children}
  </div>
);

const Quickstart = () => {
  const { modelId, modelName } = useModel();
  const [apiKeys, setApiKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const loadKeys = async () => {
    try {
      const res = await client.get('/api/keys/list');
      setApiKeys(res.data.api_keys || []);
    } catch {}
  };

  useEffect(() => { loadKeys(); }, []);

  const generateKey = async () => {
    setGenerating(true); setError(null); setNewKey(null);
    try {
      const res = await client.post('/api/keys/generate?name=SDK Key');
      setNewKey(res.data.api_key);
      loadKeys();
    } catch (e) {
      setError('Failed to generate key.');
    } finally {
      setGenerating(false);
    }
  };

  const deleteKey = async (keyId) => {
    if (!window.confirm('Delete this API key? Any SDK using it will stop working.')) return;
    await client.delete(`/api/keys/${keyId}`);
    loadKeys();
  };

  const sdkSnippet = `import requests
from functools import wraps

DRIFTWATCH_URL = "${API_URL}"
MODEL_ID = "${modelId || 'select-your-model-first'}"
API_KEY = "${newKey || (apiKeys[0] ? apiKeys[0].key_prefix + '...' : 'generate-your-api-key-below')}"

def monitor(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        try:
            input_data = kwargs if kwargs else {}
            if args and not kwargs:
                input_data = {"input": str(args[0])}
            requests.post(
                f"{DRIFTWATCH_URL}/api/ingest/log-prediction",
                json={
                    "model_id": MODEL_ID,
                    "input_features": input_data,
                    "prediction_output": str(result),
                    "confidence_score": None
                },
                headers={"Authorization": f"Bearer {API_KEY}"},
                timeout=2
            )
        except:
            pass
        return result
    return wrapper

model.predict = monitor(model.predict)`;

  if (!modelId) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Cpu size={48} color="var(--primary)" style={{ margin: '0 auto 24px', opacity: 0.6 }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12 }}>Select a model first</div>
        <div style={{ fontSize: 14, color: 'var(--text-3)' }}>Choose your model from the navbar dropdown.</div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="container" style={{ padding: '48px var(--page-x)', maxWidth: 800 }}>

        <div className="fade-up" style={{ marginBottom: 48 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Quick Setup</div>
          <h1 className="page-title">Connect Your Model</h1>
          <div className="page-sub">3 steps to start monitoring <strong>{modelName}</strong></div>
        </div>

        <Step number="1" title="Your Model ID">
          <div style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 16, fontWeight: 500 }}>
            This uniquely identifies your model in DriftWatch.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 10, background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
            <Cpu size={16} color="var(--primary)" />
            <code style={{ flex: 1, fontSize: 14, color: 'var(--text-1)', fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>{modelId}</code>
            <CopyButton text={modelId} />
          </div>
        </Step>

        <Step number="2" title="Generate Your API Key">
          <div style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 20, fontWeight: 500 }}>
            API keys never expire. Generate one and use it in your SDK. You can create multiple keys and revoke them anytime.
          </div>

          {newKey && (
            <div style={{ padding: '16px 20px', borderRadius: 10, background: 'rgba(92,140,106,0.1)', border: '1px solid var(--green)', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>✓ Key generated — save it now, it won't be shown again</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <code style={{ flex: 1, fontSize: 12, color: 'var(--text-1)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{newKey}</code>
                <CopyButton text={newKey} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button onClick={generateKey} disabled={generating} className="btn btn-primary" style={{ height: 44, padding: '0 24px', marginBottom: 24 }}>
            <Plus size={16} /> {generating ? 'Generating...' : 'Generate New API Key'}
          </button>

          {apiKeys.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Keys</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {apiKeys.map((k, i) => (
                  <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                    <Key size={14} color="var(--text-3)" />
                    <code style={{ flex: 1, fontSize: 13, color: 'var(--text-2)', fontFamily: 'monospace' }}>{k.key_prefix}••••••••••••</code>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}` : 'Never used'}</span>
                    <button onClick={() => deleteKey(k.id)} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--red)' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Step>

        <Step number="3" title="Add to Your Python Project">
          <div style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 16, fontWeight: 500, lineHeight: 1.8 }}>
  <strong style={{ color: 'var(--text-1)' }}>Step 3a</strong> — In your terminal, install the requests library if you haven't already.<br />
  <strong style={{ color: 'var(--text-1)' }}>Step 3b</strong> — Open your main Python file where your model makes predictions.<br />
  <strong style={{ color: 'var(--text-1)' }}>Step 3c</strong> — Paste the snippet below at the top of that file and add the last line right after where you define your model. That's it — every prediction will now be logged to DriftWatch automatically.
</div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
              <CopyButton text={sdkSnippet} />
            </div>
            <pre style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '24px', fontSize: 12, color: 'var(--text-2)', fontFamily: 'monospace', overflowX: 'auto', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {sdkSnippet}
            </pre>
          </div>
          <div style={{ marginTop: 16, padding: '16px 20px', borderRadius: 10, background: 'var(--bg-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <code style={{ fontSize: 13, color: 'var(--primary)', fontFamily: 'monospace' }}>pip install requests</code>
            <CopyButton text="pip install requests" />
          </div>
        </Step>

        <div className="card fade-up" style={{ padding: '24px 32px', background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Done setting up?</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Once predictions start flowing in, your dashboard will come alive.</div>
          </div>
          <a href="/dashboard" className="btn btn-primary" style={{ height: 44, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            Go to Dashboard <ArrowRight size={16} />
          </a>
        </div>

      </div>
    </div>
  );
};

export default Quickstart;