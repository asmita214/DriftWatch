import React from 'react';

const StatCard = ({ label, value, sub, loading = false, color }) => {
  if (loading) {
    return (
      <div className="card" style={{ padding: '24px 20px' }}>
        <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 32, width: '70%' }} />
      </div>
    );
  }

  const statusColor = color || 'var(--text-1)';

  return (
    <div className="card card-hoverable" style={{ padding: '24px 20px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: statusColor, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
};

export default StatCard;
