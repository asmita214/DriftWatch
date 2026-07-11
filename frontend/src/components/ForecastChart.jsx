import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';

const ForecastChart = ({ data = [], loading = false }) => {
  if (loading) return <div className="skeleton" style={{ height: 280 }} />;
  if (!data.length) return <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 14 }}>No forecast data.</div>;

  const chart = data.map(d => ({
    day:   `D${d.day}`,
    sev:   d.severity ?? d.predicted_severity ?? 0,
    upper: d.upper ?? d.upper_bound ?? null,
    lower: d.lower ?? d.lower_bound ?? null,
  }));

  const getColor = v => v >= 75 ? 'var(--red)' : v >= 50 ? 'var(--yellow)' : 'var(--green)';
  const peak = Math.max(...chart.map(d => d.sev));
  const mainColor = getColor(peak);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chart} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--border-focus)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--border-focus)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" />
        <XAxis dataKey="day" tick={{ fill: 'var(--text-3)', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)' }}
          labelStyle={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}
          itemStyle={{ fontSize: 13, fontWeight: 500 }}
        />
        <ReferenceLine y={75} stroke="var(--red)" strokeDasharray="4 4" strokeWidth={2}
          label={{ value: 'Critical', fill: 'var(--red)', fontSize: 11, fontWeight: 700, position: 'insideTopRight', textAnchor: 'end', dx: -8, dy: -4 }} />
        <ReferenceLine y={50} stroke="var(--yellow)" strokeDasharray="4 4" strokeWidth={2}
          label={{ value: 'Warning', fill: 'var(--yellow)', fontSize: 11, fontWeight: 700, position: 'insideTopRight', textAnchor: 'end', dx: -8, dy: -4 }} />
        {chart[0]?.upper !== null && (
          <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confBand)" />
        )}
        {chart[0]?.lower !== null && (
          <Area type="monotone" dataKey="lower" stroke="none" fill="var(--bg-card)" />
        )}
        <Area type="monotone" dataKey="sev" stroke={mainColor} strokeWidth={3}
          fill="none" dot={{ r: 3, fill: mainColor, strokeWidth: 0 }} activeDot={{ r: 6, fill: mainColor, stroke: 'var(--bg-card)', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ForecastChart;
