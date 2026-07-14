import React, { useState } from 'react';
import { supabase } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '40px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 8 }}>DriftWatch</div>
          <div style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>Create your account</div>
        </div>
        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', marginBottom: 12 }}>Check your email</div>
            <div style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account then sign in.</div>
            <Link to="/login" style={{ display: 'inline-block', marginTop: 24, color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>Go to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="field-label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 500 }}>{error}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: 44, marginTop: 8 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;