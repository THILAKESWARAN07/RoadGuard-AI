import React from 'react';

export const MapLegend: React.FC = () => (
  <div className="gov-map-legend" style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(255,255,255,0.8)', padding: '8px', borderRadius: '4px', fontSize: '0.9rem' }}>
    <div><span style={{ marginRight: '4px' }}>📍</span> Visible Reports</div>
    <div><span style={{ marginRight: '4px' }}>🔴</span> High Severity</div>
    <div><span style={{ marginRight: '4px' }}>⏳</span> Pending Repairs</div>
    <div><span style={{ marginRight: '4px' }}>✅</span> Completed Repairs</div>
  </div>
);
