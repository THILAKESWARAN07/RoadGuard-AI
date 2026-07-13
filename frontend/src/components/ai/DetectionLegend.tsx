import React from 'react';

interface DetectionLegendProps {
  show?: boolean;
}

export const DetectionLegend: React.FC<DetectionLegendProps> = ({ show = true }) => {
  if (!show) return null;

  return (
    <div className="detection-legend" aria-label="Detection Legend">
      <span className="legend-title">Legend:</span>
      <div className="legend-items">
        <div className="legend-item" title="Red border indicate potholes">
          <span className="legend-color pothole" aria-hidden="true">🟥</span>
          <span className="legend-label">Pothole</span>
        </div>
        <div className="legend-item" title="Blue border indicate manholes">
          <span className="legend-color manhole" aria-hidden="true">🟦</span>
          <span className="legend-label">Manhole</span>
        </div>
      </div>
    </div>
  );
};
