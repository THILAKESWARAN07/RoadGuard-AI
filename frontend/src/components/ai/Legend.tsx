import React from 'react';

interface LegendProps {
  show?: boolean;
}

export const Legend: React.FC<LegendProps> = ({ show = true }) => {
  if (!show) return null;

  return (
    <div className="detection-legend">
      <div className="legend-title">Legend</div>
      
      <div className="legend-items">
        <div className="legend-item">
          <div className="legend-color pothole" />
          <span className="legend-label">Pothole</span>
        </div>
        
        <div className="legend-item">
          <div className="legend-color manhole" />
          <span className="legend-label">Manhole</span>
        </div>
      </div>
    </div>
  );
};
