import React, { useState } from 'react';
import { supabase } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '40px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 8 }}>DriftWatch</div>
          <div style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>Sign in to your account</div>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="field-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 500 }}>{error}</div>}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: 44, marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-3)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;