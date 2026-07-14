import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Activity, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { getModels, supabase } from '../api/client';
import { useModel } from '../context/ModelContext';

const NAV = [
  { to: '/',          label: 'Home'          },
  { to: '/dashboard', label: 'Dashboard'     },
  { to: '/drift',     label: 'Drift Analysis' },
  { to: '/forecast',  label: 'Forecast'      },
  { to: '/reports',   label: 'Reports'       },
  { to: '/models',    label: 'Models'        },
  { to: '/settings',  label: 'Settings'      },
  { to: '/quickstart', label: 'Setup' },
];

/* Live clock */
const Clock_ = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
      <Clock size={14} />
      
      <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-2)' }}>
        {t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
};

/* Model selector */
const ModelSelector = () => {
  const { models, modelId, setModelId, modelName, setModelName } = useModel();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const sel = models.find(m => m.id === modelId);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px', height: 36, borderRadius: 8,
          background: 'var(--bg-input)', border: '1px solid var(--border)',
          cursor: 'pointer', minWidth: 200, fontSize: 13, fontWeight: 600,
          color: 'var(--text-1)', fontFamily: 'inherit', transition: 'all 0.2s',
          boxShadow: 'var(--shadow-sm)'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sel ? sel.model_name : 'Select model'}
        </span>
        {open ? <ChevronUp size={14} color="var(--text-3)" /> : <ChevronDown size={14} color="var(--text-3)" />}
      </button>

      {open && (
        <div className="fade-up" style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 280, background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, boxShadow: 'var(--shadow-lg)',
          zIndex: 200, overflow: 'hidden', padding: 8
        }}>
          {models.length === 0
            ? <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-3)' }}>No models registered</div>
            : models.map(m => {
                const id = m.id;
                const name = m.model_name;
                const active = id === modelId;
                return (
                  <button key={id} onClick={() => { setModelId(id); setModelName(name); setOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', background: active ? 'var(--primary-dim)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderRadius: 8, transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-raised)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--primary)' : 'var(--border-focus)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: active ? 'var(--primary)' : 'var(--text-1)', fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: 11, color: active ? 'var(--primary)' : 'var(--text-3)', fontFamily: 'monospace', marginTop: 2, opacity: 0.8 }}>{id}</div>
                    </div>
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
};
const ProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, []);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials = email ? email[0].toUpperCase() : '?';
  const displayName = email ? email.split('@')[0] : 'User';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(p => !p)}
        style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
        {initials}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 240, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
              {initials}
            </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{displayName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, wordBreak: 'break-all' }}>{email}</div>
          </div>

          <div style={{ padding: 8 }}>
            <a href="/quickstart" onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              SDK Setup
            </a>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: 13, color: 'var(--red)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--red-dim)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* Navbar */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 'var(--nav-h)',
    background: scrolled
      ? 'rgba(255, 255, 255, 0.9)'
      : 'rgba(248, 250, 252, 0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: scrolled
      ? '1px solid var(--border)'
      : '1px solid transparent',
    transition: 'all 0.3s ease',

    // Added shadow only
    boxShadow: scrolled
  ? '0 12px 40px rgba(2, 6, 23, 0.14), 0 2px 8px rgba(2, 6, 23, 0.08)'
  : '0 8px 32px rgba(2, 6, 23, 0.10)',
  }}
>
      <div style={{
        maxWidth: 'var(--page-w)', margin: '0 auto', padding: '0 var(--page-x)',
        height: '100%', display: 'flex', alignItems: 'center', gap: 0,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 40, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)'
          }}>
            <Activity size={16} color="#ffffff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>DriftWatch</span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 4 }}>
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: isActive ? 'var(--primary)' : 'var(--text-3)',
                background: isActive ? 'var(--primary-dim)' : 'transparent',
                textDecoration: 'none', transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              })}
              onMouseEnter={e => { if (e.currentTarget.style.color !== 'var(--primary)') { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.background = 'var(--bg-raised)'; } }}
              onMouseLeave={e => { if (e.currentTarget.style.color !== 'var(--primary)') { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; } }}
            >{label}</NavLink>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ModelSelector />
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <Clock_ />
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
           <ProfileMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
