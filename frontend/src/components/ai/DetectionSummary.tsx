import React from 'react';

interface DetectionSummaryProps {
  summary: {
    total_detections: number;
    pothole_count: number;
    manhole_count: number;
    highest_severity: string;
    average_confidence: number;
    processing_time_ms: number;
  };
}

export const DetectionSummary: React.FC<DetectionSummaryProps> = ({ summary }) => {
  const summaryCards = [
    {
      label: 'Total Detections',
      value: summary.total_detections,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      color: '#f3b63f',
    },
    {
      label: 'Potholes',
      value: summary.pothole_count,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
      ),
      color: '#ff5252',
    },
    {
      label: 'Manholes',
      value: summary.manhole_count,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ),
      color: '#73e19f',
    },
    {
      label: 'Highest Severity',
      value: summary.highest_severity,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      color: summary.highest_severity === 'High' ? '#ff5252' : summary.highest_severity === 'Medium' ? '#ff9c3c' : '#73e19f',
    },
    {
      label: 'Avg Confidence',
      value: `${(summary.average_confidence * 100).toFixed(1)}%`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      color: '#f3b63f',
    },
    {
      label: 'Processing Time',
      value: `${summary.processing_time_ms.toFixed(0)}ms`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: '#00b2ff',
    },
  ];

  return (
    <div className="detection-summary">
      <h2 className="summary-title">Detection Summary</h2>
      
      <div className="summary-cards">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className="summary-card"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className="summary-icon"
              style={{ color: card.color }}
            >
              {card.icon}
            </div>
            
            <div className="summary-content">
              <p className="summary-label">{card.label}</p>
              <p
                className="summary-value"
                style={{ color: card.color }}
              >
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
