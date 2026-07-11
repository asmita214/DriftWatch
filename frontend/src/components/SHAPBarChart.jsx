import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

const SHAPBarChart = ({ data = [] }) => {
  if (!data.length) return <div style={{ padding: '24px 0', color: 'var(--text-3)', fontSize: 14, textAlign: 'center' }}>No SHAP data available.</div>;

  const chart = data.map(f => ({
    feature: f.feature || f.name || '?',
    value: Math.abs(f.contribution || f.shap_value || 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, chart.length * 40)}>
      <BarChart data={chart} layout="vertical" margin={{ top: 0, right: 64, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'var(--text-3)', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false}
          tickFormatter={v => `${v.toFixed(1)}%`} />
        <YAxis type="category" dataKey="feature" tick={{ fill: 'var(--text-2)', fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}
          tickLine={false} axisLine={false} width={100} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)' }}
          itemStyle={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}
          labelStyle={{ color: 'var(--text-1)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}
          formatter={v => [`${v.toFixed(2)}%`, 'Contribution']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chart.map((_, i) => (
            <Cell key={i} fill={i === 0 ? 'var(--primary)' : 'var(--border-focus)'} />
          ))}
          <LabelList dataKey="value" position="right"
            formatter={v => `${v.toFixed(1)}%`}
            style={{ fill: 'var(--text-3)', fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SHAPBarChart;
