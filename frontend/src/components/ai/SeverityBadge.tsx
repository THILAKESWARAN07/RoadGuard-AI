import React from 'react';

interface SeverityBadgeProps {
  severity: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const getSeverityColor = () => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'rgba(83, 201, 138, 0.2)';
      case 'medium':
        return 'rgba(255, 156, 60, 0.2)';
      case 'high':
        return 'rgba(255, 82, 82, 0.2)';
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  };

  const getSeverityTextColor = () => {
    switch (severity.toLowerCase()) {
      case 'low':
        return '#73e19f';
      case 'medium':
        return '#ff9c3c';
      case 'high':
        return '#ff5252';
      default:
        return '#eaf2ff';
    }
  };

  const getSeverityBorderColor = () => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'rgba(83, 201, 138, 0.4)';
      case 'medium':
        return 'rgba(255, 156, 60, 0.4)';
      case 'high':
        return 'rgba(255, 82, 82, 0.4)';
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  return (
    <span
      className="severity-badge"
      style={{
        background: getSeverityColor(),
        color: getSeverityTextColor(),
        borderColor: getSeverityBorderColor(),
      }}
    >
      {severity}
    </span>
  );
};
