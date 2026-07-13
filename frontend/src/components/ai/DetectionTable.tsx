import React from 'react';
import { SeverityBadge } from './SeverityBadge';

interface DetectionTableProps {
  detections: Array<{
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
  }>;
}

export const DetectionTable: React.FC<DetectionTableProps> = ({ detections }) => {
  if (detections.length === 0) {
    return null;
  }

  return (
    <div className="detection-table-container">
      <h3 className="table-title">Detection Details</h3>
      
      <div className="table-wrapper">
        <table className="detection-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Confidence</th>
              <th>Severity</th>
              <th>Area</th>
              <th>Bounding Box</th>
            </tr>
          </thead>
          
          <tbody>
            {detections.map((detection, index) => (
              <tr key={index}>
                <td className="table-cell-class">
                  <div className="class-cell-content">
                    <span className="class-name">
                      {detection.class_name.charAt(0).toUpperCase() + detection.class_name.slice(1)}
                    </span>
                    <span className="class-id">#{detection.class_id}</span>
                  </div>
                </td>
                
                <td className="table-cell-confidence">
                  <div className="confidence-cell">
                    <div className="confidence-bar-mini">
                      <div
                        className="confidence-bar-mini-fill"
                        style={{
                          width: `${(detection.confidence * 100).toFixed(0)}%`,
                          backgroundColor: detection.confidence >= 0.9 ? '#73e19f' : detection.confidence >= 0.7 ? '#f3b63f' : '#ff5252',
                        }}
                      />
                    </div>
                    <span className="confidence-value">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
                
                <td className="table-cell-severity">
                  <SeverityBadge severity={detection.severity} />
                </td>
                
                <td className="table-cell-area">
                  {detection.area.toLocaleString()} px²
                </td>
                
                <td className="table-cell-bbox">
                  <div className="bbox-cell">
                    <span>X: {detection.bbox.x1}, Y: {detection.bbox.y1}</span>
                    <span>W: {detection.bbox.width}, H: {detection.bbox.height}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
