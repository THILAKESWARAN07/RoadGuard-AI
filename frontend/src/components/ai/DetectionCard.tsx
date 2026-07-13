import React from 'react';
import { SeverityBadge } from './SeverityBadge';
import { ConfidenceBar } from './ConfidenceBar';

interface DetectionCardProps {
  detection: {
    class_id: number;
    class_name: string;
    confidence: number;
    severity: string;
    bbox: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    };
    area: number;
  };
  index: number;
}

export const DetectionCard: React.FC<DetectionCardProps> = ({ detection, index }) => {
  const getClassIcon = () => {
    if (detection.class_name === 'pothole') {
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
      );
    }
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    );
  };

  const getClassColor = () => {
    return detection.class_name === 'pothole' ? '#ff5252' : '#73e19f';
  };

  return (
    <div
      className="detection-card"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="detection-card-header">
        <div
          className="detection-class-icon"
          style={{ color: getClassColor() }}
        >
          {getClassIcon()}
        </div>
        
        <div className="detection-class-info">
          <h3 className="detection-class-name">
            {detection.class_name.charAt(0).toUpperCase() + detection.class_name.slice(1)}
          </h3>
          <span className="detection-class-id">ID: {detection.class_id}</span>
        </div>
        
        <SeverityBadge severity={detection.severity} />
      </div>

      <div className="detection-card-body">
        <div className="detection-metric">
          <span className="metric-label">Confidence</span>
          <ConfidenceBar confidence={detection.confidence} />
        </div>

        <div className="detection-metrics-grid">
          <div className="detection-metric-small">
            <span className="metric-label">Area</span>
            <span className="metric-value">{detection.area.toLocaleString()} px²</span>
          </div>

          <div className="detection-metric-small">
            <span className="metric-label">Width</span>
            <span className="metric-value">{detection.bbox.width}px</span>
          </div>

          <div className="detection-metric-small">
            <span className="metric-label">Height</span>
            <span className="metric-value">{detection.bbox.height}px</span>
          </div>
        </div>

        <div className="detection-bbox">
          <span className="metric-label">Bounding Box</span>
          <div className="bbox-coordinates">
            <span>X: {detection.bbox.x1}, Y: {detection.bbox.y1}</span>
            <span>W: {detection.bbox.width}, H: {detection.bbox.height}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
