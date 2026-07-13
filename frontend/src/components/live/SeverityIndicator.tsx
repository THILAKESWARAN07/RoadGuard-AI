import React from 'react';

interface SeverityIndicatorProps {
  severity: string;
  confidence: number;
}

export const SeverityIndicator: React.FC<SeverityIndicatorProps> = ({
  severity,
  confidence,
}) => {
  const getSeverityDetails = () => {
    switch (severity.toLowerCase()) {
      case 'high':
        return {
          bar: '█████████',
          label: 'HIGH',
          colorClass: 'text-red',
        };
      case 'medium':
        return {
          bar: '██████',
          label: 'MEDIUM',
          colorClass: 'text-orange',
        };
      case 'low':
        return {
          bar: '███',
          label: 'LOW',
          colorClass: 'text-green',
        };
      default:
        return {
          bar: '█',
          label: 'NORMAL',
          colorClass: 'text-blue',
        };
    }
  };

  const details = getSeverityDetails();

  return (
    <div className="severity-indicator-container">
      <div className={`severity-ascii-meter ${details.colorClass}`}>
        <span className="ascii-blocks" aria-hidden="true">{details.bar}</span>
        <span className="severity-text-label">{details.label}</span>
      </div>
      <div className="severity-confidence-value">
        <span className="confidence-label">Confidence:</span>
        <span className="confidence-number">{(confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};
export default SeverityIndicator;
