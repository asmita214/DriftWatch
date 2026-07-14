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
  const getGlow = v => v < 40 ? '0 0 32px rgba(92,140,106,0.35)' : v < 65 ? '0 0 32px rgba(196,132,58,0.35)' : '0 0 32px rgba(184,84,80,0.35)';

  const color = getColor(display);
  const cx = size / 2, cy = size / 2;
  const r = (size - 48) / 2;
  const totalAngle = 240;
  const startAngle = 150;
  const toRad = d => (d * Math.PI) / 180;
  const circ = (totalAngle / 360) * 2 * Math.PI * r;
  const offset = circ - (Math.min(display, 100) / 100) * circ;

  const arc = (sa, ea) => {
    const s = toRad(sa - 90), e = toRad(ea - 90);
    const la = ea - sa > 180 ? 1 : 0;
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 ${la} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`;
  };

  // tick marks at 0, 25, 50, 75, 100
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size * 0.92} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible', filter: display > 0 ? `drop-shadow(${getGlow(display)})` : 'none', transition: 'filter 0.5s' }}>

        {/* Outer decorative ring */}
        <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke="var(--border)" strokeWidth={1} strokeDasharray="4 6" opacity={0.4} />

        {/* Track */}
        <path d={arc(startAngle, startAngle + totalAngle)} fill="none" stroke="var(--bg-raised)" strokeWidth={14} strokeLinecap="round" />

        {/* Colored value arc */}
        <path d={arc(startAngle, startAngle + totalAngle)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.06s linear, stroke 0.3s' }} />

        {/* Tick marks */}
        {ticks.map(tick => {
          const angle = startAngle + (tick / 100) * totalAngle;
          const rad = toRad(angle - 90);
          const innerR = r - 12;
          const outerR = r + 4;
          const x1 = cx + innerR * Math.cos(rad);
          const y1 = cy + innerR * Math.sin(rad);
          const x2 = cx + outerR * Math.cos(rad);
          const y2 = cy + outerR * Math.sin(rad);
          const labelR = r + 22;
          const lx = cx + labelR * Math.cos(rad);
          const ly = cy + labelR * Math.sin(rad);
          return (
            <g key={tick}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-3)" strokeWidth={tick % 50 === 0 ? 2 : 1} opacity={0.6} />
              <text x={lx} y={ly + 4} textAnchor="middle" fill="var(--text-3)" fontSize={size * 0.045} fontWeight={600} fontFamily="Inter" opacity={0.7}>
                {tick}
              </text>
            </g>
          );
        })}

        {/* Center background circle */}
        <circle cx={cx} cy={cy} r={r - 20} fill="var(--bg-raised)" opacity={0.5} />

        {/* Main number */}
        <text x={cx} y={cy - size * 0.04} textAnchor="middle" fill={color}
          fontSize={size * 0.26} fontWeight={900} fontFamily="Inter" style={{ letterSpacing: '-0.05em' }}>
          {display}
        </text>

        {/* Percent sign next to number */}
        <text x={cx + size * 0.19} y={cy - size * 0.08} textAnchor="middle" fill={color}
          fontSize={size * 0.09} fontWeight={700} fontFamily="Inter" opacity={0.7}>
          %
        </text>

        {/* Label */}
        <text x={cx} y={cy + size * 0.1} textAnchor="middle" fill="var(--text-3)"
          fontSize={size * 0.065} fontWeight={700} fontFamily="Inter" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {getLabel(display)}
        </text>

        {/* Severity description */}
        <text x={cx} y={cy + size * 0.2} textAnchor="middle" fill="var(--text-3)"
          fontSize={size * 0.048} fontWeight={500} fontFamily="Inter" opacity={0.6}>
          {display < 40 ? 'No action needed' : display < 65 ? 'Monitor closely' : 'Retrain immediately'}
        </text>

      </svg>
    </div>
  );
};

export default SeverityGauge;