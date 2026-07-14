import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Section = ({ title, content }) => {
  const [open, setOpen] = useState(true);
  if (!content) return null;
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(p => !p)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {open ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
      </button>
      {open && <div className="fade-up" style={{ padding: '0 24px 20px', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{content}</div>}
    </div>
  );
};

const ReportViewer = ({ report, minimal = false }) => {
  if (!report) return null;

  // safely extract report text from all possible locations
  let raw = '';
  try {
  if (typeof report.report_text === 'string' && report.report_text) {
    raw = report.report_text;
  } else if (report.report && typeof report.report === 'object') {
    raw = report.report.report_text || report.report.text || '';
  } else if (typeof report.report === 'string' && report.report) {
    raw = report.report;
  } else if (report.remediation_recipes && report.remediation_recipes.length > 0) {
    raw = report.remediation_recipes[0].report_text || '';
  } else if (typeof report.content === 'string') {
    raw = report.content;
  } else if (typeof report.text === 'string') {
    raw = report.text;
  }
} catch {
  raw = '';
}

  const meta = report.metadata || report.meta || {};
  const date = report.detected_at || report.generated_at || report.timestamp || meta.generated_at;
  const score = report.severity_score ?? meta.severity_score;
  const features = report.affected_features || meta.drifted_features || [];
  const scoreColor = !score ? 'var(--text-3)' : score >= 75 ? 'var(--red)' : score >= 50 ? 'var(--yellow)' : 'var(--green)';

  // parse sections from markdown-style headings
  const sectionMap = {};
  let cur = 'Overview';
  (raw || '').split('\n').forEach(l => {
    const h = l.match(/^#{1,3}\s+(.+)/);
    if (h) {
      cur = h[1].trim();
      sectionMap[cur] = '';
    } else {
      sectionMap[cur] = (sectionMap[cur] || '') + l + '\n';
    }
  });

  const sections = Object.entries(sectionMap).filter(([, v]) => v.trim());

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {!minimal && (
        <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--border)', background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {date && (
            <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>
              {new Date(date).toLocaleString()}
            </span>
          )}
          {score !== undefined && score !== null && (
            <span className="badge" style={{ color: scoreColor, border: `1px solid ${scoreColor}`, background: 'var(--bg-card)', fontSize: 13, padding: '4px 12px' }}>
              Severity: {typeof score === 'number' ? score.toFixed(1) : score}
            </span>
          )}
          {features.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {features.slice(0, 5).map((f, i) => (
                <span key={i} style={{ padding: '3px 10px', borderRadius: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)', fontFamily: 'monospace', fontWeight: 500 }}>
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {sections.length > 0
        ? sections.map(([t, c]) => <Section key={t} title={t} content={c.trim()} />)
        : (
          <div style={{ padding: '24px', fontSize: 14, color: 'var(--text-3)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {raw || 'Report content unavailable.'}
          </div>
        )}
    </div>
  );
};

export default ReportViewer;