import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, AlertTriangle, BarChart2, Brain, Database, Cpu, FileText, Layers, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

/* Animated counter */
const useCounter = (target, dur = 1400) => {
  const [v, setV] = useState(0);
  const r = useRef(null);
  useEffect(() => {
    let s = null;
    const tick = ts => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) r.current = requestAnimationFrame(tick);
    };
    r.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(r.current);
  }, [target]);
  return v;
};

/* Premium Equalizer Bar Chart - Live Line */
/* Premium Equalizer Bar Chart - Live Line */
const LiveLine = () => {
  return (
    <div style={{ width: '100%', height: 48, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
      {[...Array(24)].map((_, i) => (
        <div 
          key={i} 
          style={{ 
            flex: 1, 
            background: 'var(--primary)', 
            borderRadius: '3px 3px 0 0',
            opacity: 1 - (i * 0.02),
            height: '100%',
            animation: `eqPulse ${0.8 + (i % 4) * 0.3}s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate`,
            animationDelay: `${(i * 0.08)}s`,
            transformOrigin: 'bottom'
          }} 
        />
      ))}
    </div>
  );
};

/* Premium Custom SVG Line Chart - Alert Line */
const AlertLine = () => {
  return (
    <div style={{ width: '100%', height: 64, position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 200 64" preserveAspectRatio="none">
        <defs>
          <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--red)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--red)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Fill */}
        <path d="M0,64 L0,45 C40,40 60,35 100,30 C140,25 160,10 200,5 L200,64 Z" 
          fill="url(#alertGradient)" 
          style={{ animation: 'fillFade 1.5s ease-out forwards 0.5s', opacity: 0 }} 
        />
        {/* Line */}
        <path d="M0,45 C40,40 60,35 100,30 C140,25 160,10 200,5" 
          fill="none" stroke="var(--red)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="1000" strokeDashoffset="1000"
          style={{ animation: 'drawLine 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.3s' }} 
        />
        {/* End Dot */}
        <circle cx="200" cy="5" r="4" fill="var(--red)" style={{ animation: 'fillFade 0.5s ease-out forwards 2.5s', opacity: 0 }} />
      </svg>
    </div>
  );
};

/* SHAP preview - Light Theme */
const SHAPPreview = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 300); }, []);

  const rows = [
    { name: 'age',     pct: 38 },
    { name: 'income',  pct: 27 },
    { name: 'tenure',  pct: 18 },
    { name: 'balance', pct: 11 },
    { name: 'region',  pct:  6 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'monospace', fontWeight: 500 }}>{r.name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{r.pct}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-raised)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: mounted ? `${(r.pct / 38) * 100}%` : '0%', background: i === 0 ? 'var(--primary)' : 'var(--border-focus)', borderRadius: 3, transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

/* Capabilities */
const CAPS = [
  { icon: BarChart2, title: 'Statistical Drift Detection',  desc: 'PSI and Kolmogorov-Smirnov tests compare live input distributions against your training baseline continuously.' },
  { icon: Brain,     title: 'SHAP Root Cause Analysis',     desc: 'Quantifies each feature\'s exact contribution to drift — giving your team a ranked, actionable breakdown.' },
  { icon: Layers,    title: 'HDBSCAN Segment Clustering',   desc: 'Reveals hidden user segments in live traffic and identifies which groups are behaving anomalously.' },
  { icon: Database,  title: 'FAISS Pattern Memory',         desc: 'Vector similarity search across historical drift events surfaces past incidents that match current behavior.' },
  { icon: Cpu,       title: 'XGBoost Severity Scoring',    desc: 'A 0–100 urgency score enables objective, automated triage of every drift event in your pipeline.' },
  { icon: FileText,  title: 'Gemini Investigation Reports', desc: 'AI-generated investigation reports synthesize all drift signals into clear, structured recommendations.' },
];

const Landing = () => {
  const n1 = useCounter(85, 2000);
  const n2 = useCounter(1200, 1800);
  const n3 = useCounter(47, 1600);

  return (
    <div style={{ background: 'var(--bg)', overflowX: 'hidden' }}>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative' }}>
        {/* Modern dot grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: 'radial-gradient(var(--border-focus) 1px, transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }} />

        {/* Ambient animated glow blobs (Mesh Gradient) */}
        <div className="mesh-anim" style={{ position: 'absolute', top: '5%', left: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(255,255,255,0) 60%)', pointerEvents: 'none', filter: 'blur(80px)' }} />
        <div className="mesh-anim" style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(147,51,234,0.12) 0%, rgba(255,255,255,0) 60%)', pointerEvents: 'none', filter: 'blur(80px)', animationDelay: '-5s' }} />
        <div className="mesh-anim" style={{ position: 'absolute', top: '30%', right: '20%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, rgba(255,255,255,0) 60%)', pointerEvents: 'none', filter: 'blur(60px)', animationDelay: '-10s' }} />

        <div className="container" style={{ width: '100%', padding: '100px var(--page-x)', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

            {/* Left */}
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '6px 16px', borderRadius: 24, border: '1px solid rgba(79, 70, 229, 0.25)',
                background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.08), rgba(79, 70, 229, 0.02))',
                width: 'fit-content', backdropFilter: 'blur(12px)',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} className="pulse-glow" />
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>ML Model Surveillance</span>
              </div>

              <h1 style={{ fontSize: 'clamp(48px, 6vw, 76px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
                Your models fail<br />silently in production.<br />
                <span className="text-gradient pulse-glow" style={{ display: 'inline-block' }}>We catch it.</span>
              </h1>

              <p style={{ fontSize: 18, color: 'var(--text-3)', lineHeight: 1.7, maxWidth: 520, fontWeight: 400 }}>
                DriftWatch detects data drift, identifies root causes through SHAP analysis, forecasts severity trajectories, and delivers AI-powered investigation reports.
              </p>

              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <Link to="/signup" className="btn btn-primary" style={{ height: 52, padding: '0 32px', fontSize: 16, borderRadius: 10 }}>
                  Get Started Free <ArrowRight className="arrow-icon" size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary" style={{ height: 52, padding: '0 32px', fontSize: 16, borderRadius: 10 }}>
                  Sign In
                </Link>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 40, paddingTop: 24, borderTop: '1px solid var(--border)', marginTop: 12 }}>
                {[
                  { v: `${n1}%`,  l: 'Models fail silently', c: 'var(--red)' },
                  { v: `${n2}+`,  l: 'Models monitored',     c: 'var(--text-1)' },
                  { v: `${n3}ms`, l: 'Avg. detection time',  c: 'var(--green)' },
                ].map((s, i) => (
                  <div key={i} className="fade-up" style={{ animationDelay: `${400 + i * 100}ms` }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: s.c, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — dashboard preview */}
            <div className="slide-in-right d2 float-anim" style={{ perspective: 1200 }}>
              <div className="card card-hoverable" style={{ overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.02)', transformStyle: 'preserve-3d', transform: 'rotateY(-6deg) rotateX(4deg)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)' }}>
                {/* Card header */}
                <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(0,0,0,0.04)', background: 'linear-gradient(180deg, rgba(248,250,252,0.9), rgba(255,255,255,0))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>fraud_detection_v2</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', padding: '4px 10px', borderRadius: 12, border: '1px solid var(--red-border)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} className="pulse-glow" />
                    <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Drift Detected</span>
                  </div>
                </div>

                {/* Severity */}
                <div style={{ padding: '28px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: 32, alignItems: 'center' }}>
                  <div style={{ minWidth: 100 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8 }}>Severity Score</div>
                    <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--red)', lineHeight: 1, letterSpacing: '-0.04em' }}>73</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12 }}>Live Trend</div>
                    <LiveLine />
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  {[
                    { l: 'Features Drifted', v: '4 / 9',  c: 'var(--red)' },
                    { l: 'Top Culprit',      v: 'age',    c: 'var(--yellow)' },
                    { l: 'Segments',         v: '3',      c: 'var(--text-1)' },
                    { l: 'Hist. Matches',    v: '2',      c: 'var(--text-1)' },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>{s.l}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* SHAP mini */}
                <div style={{ padding: '24px 28px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>SHAP Contributions</div>
                  <SHAPPreview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE BLOCKS ── */}
      <section style={{ padding: '120px 0', background: '#ffffff' }}>
        <div className="container">

          {/* Block 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', marginBottom: 140 }}>
            <div className="card card-hoverable fade-up" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Live Drift Signal</span>
              </div>
              <div style={{ padding: '24px' }}>
                <LiveLine />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 24 }}>
                  {[['PSI Score', '0.34', 'var(--red)', 'var(--red-dim)'], ['KS Stat', '0.21', 'var(--yellow)', 'var(--yellow-dim)'], ['p-value', '<0.001', 'var(--red)', 'var(--red-dim)']].map(([k, v, c, bg], i) => (
                    <div key={i} style={{ padding: '12px 14px', background: bg, borderRadius: 8, border: `1px solid ${c}`, textAlign: 'center', opacity: 0.8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                      <div style={{ fontSize: 15, fontFamily: 'monospace', color: c, fontWeight: 800 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="fade-up d1">
              <div style={{ fontSize: 13, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 16 }}>Drift Detection</div>
              <h2 style={{ fontSize: 'clamp(28px,3vw,38px)', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: 20 }}>
                Know the moment your model loses its grip.
              </h2>
              <p style={{ fontSize: 16, color: 'var(--text-3)', lineHeight: 1.8 }}>
                Continuous monitoring using PSI and Kolmogorov-Smirnov tests. The moment your live input distribution diverges from training, DriftWatch flags it with statistical confidence — not guesses.
              </p>
            </div>
          </div>

          {/* Block 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', marginBottom: 140 }}>
            <div className="fade-up d1">
              <div style={{ fontSize: 13, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 16 }}>Root Cause Analysis</div>
              <h2 style={{ fontSize: 'clamp(28px,3vw,38px)', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: 20 }}>
                Not just what broke — exactly which feature and by how much.
              </h2>
              <p style={{ fontSize: 16, color: 'var(--text-3)', lineHeight: 1.8 }}>
                SHAP values give a quantified, ranked breakdown of every feature contributing to drift. Your team skips the investigation phase and goes straight to resolution.
              </p>
            </div>
            <div className="card card-hoverable fade-up" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Feature Contributions</span>
              </div>
              <div style={{ padding: '24px' }}>
                <SHAPPreview />
              </div>
            </div>
          </div>

          {/* Block 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div className="card card-hoverable fade-up" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>14-Day Forecast</span>
                <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={14} /> Critical on Day 6
                </span>
              </div>
              <div style={{ padding: '24px' }}>
                <AlertLine />
                <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, borderTop: '2px dashed var(--red)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>Critical (75)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, borderTop: '2px dashed var(--yellow)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>Warning (50)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="fade-up d1">
              <div style={{ fontSize: 13, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 16 }}>Predictive Forecasting</div>
              <h2 style={{ fontSize: 'clamp(28px,3vw,38px)', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2, letterSpacing: '-0.025em', marginBottom: 20 }}>
                See the storm before it arrives.
              </h2>
              <p style={{ fontSize: 16, color: 'var(--text-3)', lineHeight: 1.8 }}>
                Prophet-powered time series forecasting predicts your model's severity trajectory 14 days ahead with confidence bounds. Know exactly which day you'll hit critical — and act before it happens.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section style={{ padding: '100px 0', background: 'var(--bg-raised)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ marginBottom: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 12 }}>What DriftWatch does</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.025em' }}>Every signal. Every cause. Every prediction.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {CAPS.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="card card-hoverable fade-up" style={{
                  padding: '32px',
                  animationDelay: `${i * 100}ms`,
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={24} color="var(--primary)" />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>{c.title}</div>
                  <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.7 }}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── URGENCY ── */}
      <section style={{ padding: '120px 0', background: 'var(--bg-raised)' }}>
        <div className="container" style={{ maxWidth: 800, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 32 }}>
            {[...Array(5)].map((_, i) => <div key={i} style={{ width: 40, height: 4, background: i < 4 ? 'var(--red)' : 'var(--border-focus)', borderRadius: 2 }} />)}
          </div>
          <h2 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            <span style={{ color: 'var(--red)' }}>85%</span> of ML models in production are failing silently right now.
          </h2>
          <p style={{ fontSize: 18, color: 'var(--text-3)', lineHeight: 1.7, marginBottom: 40, padding: '0 20px' }}>
            No alert. No dashboard warning. Just quietly degraded predictions until a customer complains or an audit surfaces the problem. The average team takes 4–6 weeks to diagnose what DriftWatch surfaces in minutes.
          </p>
          <Link to="/signup" className="btn btn-primary pulse-glow" style={{ height: 56, fontSize: 16, padding: '0 32px', borderRadius: 12 }}>
            Start Monitoring Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 0', background: 'var(--bg-card)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(79,70,229,0.3)' }}>
              <Activity size={14} color="#ffffff" strokeWidth={3} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>DriftWatch</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>ML surveillance for teams that can't afford silent failures.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
