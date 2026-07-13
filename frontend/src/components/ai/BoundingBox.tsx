import React, { memo } from 'react';
import { SeverityBadge } from './SeverityBadge';

interface BoundingBoxProps {
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
  highlighted: boolean;
  onHover?: (index: number | null) => void;
  imageWidth: number;
  imageHeight: number;
  zoom: number;
  mirrored?: boolean;
}

export const BoundingBox = memo<BoundingBoxProps>(({
  detection,
  index,
  highlighted,
  onHover,
  imageWidth,
  imageHeight,
  zoom,
  mirrored = false,
}) => {
  const { class_name, confidence, severity, bbox, area } = detection;

  // Calculate position as percentage of image dimensions
  const left = (bbox.x1 / imageWidth) * 100;
  const top = (bbox.y1 / imageHeight) * 100;
  const width = (bbox.width / imageWidth) * 100;
  const height = (bbox.height / imageHeight) * 100;

  const isPothole = class_name.toLowerCase() === 'pothole';
  const colorClass = isPothole ? 'pothole' : 'manhole';
  
  // Dynamic inline styles based on severity requirements
  const getBorderStyle = () => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'solid';
      case 'medium':
        return 'dashed';
      case 'high':
        return 'solid';
      default:
        return 'solid';
    }
  };

  const getBorderWidth = () => {
    switch (severity.toLowerCase()) {
      case 'high':
        return '4px';
      default:
        return '2px';
    }
  };

  const getBorderColor = () => {
    return isPothole ? '#ff5252' : '#00b2ff';
  };

  const getBackgroundColor = () => {
    if (highlighted) {
      return isPothole ? 'rgba(255, 82, 82, 0.25)' : 'rgba(0, 178, 255, 0.25)';
    }
    return 'transparent';
  };

  const detectionNumber = index + 1;

  return (
    <div
      className={`bounding-box-overlay-item ${colorClass} ${highlighted ? 'highlighted' : ''}`}
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        border: `${getBorderWidth()} ${getBorderStyle()} ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        cursor: 'pointer',
        zIndex: highlighted ? 10 : 2,
        outline: highlighted ? `2px solid #f3b63f` : 'none',
        outlineOffset: '2px',
      }}
      onMouseEnter={() => onHover?.(index)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(index)}
      onBlur={() => onHover?.(null)}
      role="button"
      tabIndex={0}
      aria-label={`Detection #${detectionNumber}: ${class_name}, Confidence: ${(confidence * 100).toFixed(1)}%, Severity: ${severity}`}
    >
      {/* Label always visible at top-left of the box */}
      <div className={`bounding-box-label ${colorClass}`} style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}>
        <span className="label-number">#{detectionNumber}</span>
        <span className="label-class">
          {class_name.charAt(0).toUpperCase() + class_name.slice(1)}
        </span>
        <span className="label-confidence">
          {(confidence * 100).toFixed(0)}%
        </span>
        <SeverityBadge severity={severity} />
      </div>

      {/* Tooltip visible only when highlighted / focused */}
      {highlighted && (
        <div className="bounding-box-tooltip" role="tooltip" style={{ transform: mirrored ? 'translateX(50%) scaleX(-1)' : 'translateX(-50%)' }}>
          <div className="tooltip-header">
            <span className="tooltip-title">Detection #{detectionNumber}</span>
          </div>
          <div className="tooltip-body">
            <div className="tooltip-row">
              <span className="tooltip-label">Class:</span>
              <span className="tooltip-value font-semibold">
                {class_name.charAt(0).toUpperCase() + class_name.slice(1)}
              </span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Confidence:</span>
              <span className="tooltip-value">{(confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Severity:</span>
              <span className="tooltip-value capitalize">{severity}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">Area:</span>
              <span className="tooltip-value">{Math.round(area).toLocaleString()} px²</span>
            </div>
            <div className="tooltip-divider" />
            <div className="tooltip-row coordinates">
              <span className="tooltip-label">BBox (X1, Y1):</span>
              <span className="tooltip-value monospace">({Math.round(bbox.x1)}, {Math.round(bbox.y1)})</span>
            </div>
            <div className="tooltip-row coordinates">
              <span className="tooltip-label">Dimensions:</span>
              <span className="tooltip-value monospace">{Math.round(bbox.width)}w × {Math.round(bbox.height)}h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

BoundingBox.displayName = 'BoundingBox';
