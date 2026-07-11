import React, { useEffect, useRef, useState } from 'react';

const SeverityGauge = ({ value = 0, size = 260 }) => {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    let start = null;
    const from = display;
    const to = value;
    const tick = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1600, 1);
      setDisplay(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  const getColor = v => v < 40 ? 'var(--green)' : v < 65 ? 'var(--yellow)' : 'var(--red)';
  const getLabel = v => v < 40 ? 'Healthy' : v < 65 ? 'Warning' : 'Critical';

  const color = getColor(display);
  const cx = size / 2, cy = size / 2;
  const r = (size - 40) / 2;
  const totalAngle = 220;
  const startAngle = 160;
  const toRad = d => (d * Math.PI) / 180;
  const circ = (totalAngle / 360) * 2 * Math.PI * r;
  const offset = circ - (Math.min(display, 100) / 100) * circ;

  const arc = (sa, ea) => {
    const s = toRad(sa - 90), e = toRad(ea - 90);
    const la = ea - sa > 180 ? 1 : 0;
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 ${la} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size * 0.72} style={{ overflow: 'visible' }}>
        {/* Track */}
        <path d={arc(startAngle, startAngle + totalAngle)} fill="none" stroke="var(--bg-raised)" strokeWidth={12} strokeLinecap="round" />
        {/* Value */}
        <path d={arc(startAngle, startAngle + totalAngle)} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.06s linear, stroke 0.3s' }} />
        {/* Value text */}
        <text x={cx} y={cy * 0.88} textAnchor="middle" fill={color}
          fontSize={size * 0.24} fontWeight={800} fontFamily="Inter" style={{ letterSpacing: '-0.04em' }}>
          {display}
        </text>
        <text x={cx} y={cy * 0.88 + size * 0.09} textAnchor="middle" fill="var(--text-3)"
          fontSize={size * 0.06} fontWeight={700} fontFamily="Inter" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {getLabel(display)}
        </text>
        <text x={cx - r - 8} y={cy * 0.88 + 16} fill="var(--text-4)" fontSize={11} fontWeight={600} textAnchor="middle" fontFamily="Inter">0</text>
        <text x={cx + r + 8} y={cy * 0.88 + 16} fill="var(--text-4)" fontSize={11} fontWeight={600} textAnchor="middle" fontFamily="Inter">100</text>
      </svg>
    </div>
  );
};

export default SeverityGauge;
