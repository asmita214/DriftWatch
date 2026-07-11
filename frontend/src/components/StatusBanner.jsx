import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const StatusBanner = ({ score = 0, drifted = false, message = '' }) => {
  let bg, border, color, Icon, label;
  if (score >= 75 || drifted) {
    bg = 'var(--red-dim)'; border = 'var(--red-border)';
    color = 'var(--red)'; Icon = AlertTriangle; label = 'Critical';
  } else if (score >= 40) {
    bg = 'var(--yellow-dim)'; border = 'var(--yellow-border)';
    color = 'var(--yellow)'; Icon = AlertCircle; label = 'Warning';
  } else {
    bg = 'var(--green-dim)'; border = 'var(--green-border)';
    color = 'var(--green)'; Icon = CheckCircle; label = 'Healthy';
  }

  return (
    <div className="fade-up" style={{
      background: bg, borderBottom: `1px solid ${border}`,
      padding: '12px var(--page-x)',
    }}>
      <div style={{ maxWidth: 'var(--page-w)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon size={16} color={color} />
        <span style={{ fontSize: 13, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ width: 1, height: 16, background: border }} />
        <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>{message || `Severity score: ${score}`}</span>
      </div>
    </div>
  );
};

export default StatusBanner;
