import React from 'react';

const ClusterCard = ({ cluster, index }) => {
  const pct = cluster.drift_percentage || cluster.drifted_percentage || 0;
  const statusColor = pct > 60 ? 'var(--red)' : pct > 30 ? 'var(--yellow)' : 'var(--green)';
  const id = cluster.cluster_id ?? index;
  const size = cluster.size ?? cluster.count ?? '—';
  const desc = cluster.description || cluster.summary || '';
  const features = cluster.top_features || cluster.dominant_features || [];

  return (
    <div className="card card-hoverable" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Cluster {id}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginTop: 4 }}>{size} <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>samples</span></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: statusColor, letterSpacing: '-0.03em' }}>{pct.toFixed(0)}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>drifted</div>
        </div>
      </div>

      {/* Drift bar */}
      <div style={{ height: 6, background: 'var(--bg-raised)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: statusColor, borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
      </div>

      {desc && <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{desc}</p>}

      {features.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {features.slice(0, 4).map((f, i) => (
            <span key={i} style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--bg-raised)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)', fontFamily: 'monospace', fontWeight: 500 }}>{f}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClusterCard;
