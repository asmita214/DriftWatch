import React from 'react';

const SeverityBadge = ({ score }) => {
  if (score === undefined || score === null) return null;

  let color, bg, label;
  if (score < 40) { color = '#22c55e'; bg = 'rgba(34,197,94,0.1)'; label = 'Healthy'; }
  else if (score < 60) { color = '#eab308'; bg = 'rgba(234,179,8,0.1)'; label = 'Warning'; }
  else if (score < 80) { color = '#f97316'; bg = 'rgba(249,115,22,0.1)'; label = 'Elevated'; }
  else { color = '#ef4444'; bg = 'rgba(239,68,68,0.1)'; label = 'Critical'; }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
      style={{ color, background: bg, border: `1px solid ${color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: color }} />
      {label} · {score}
    </span>
  );
};

export default SeverityBadge;
