import React, { useEffect, useState } from 'react';

interface InferenceStatusProps {
  inferenceStatus: 'idle' | 'detecting' | 'error' | 'waiting';
  consecutiveFailures: number;
  latency: number;
  detectionCount: number;
  lastUpdateTime: number;
  onRetryConnection: () => void;
}

export const InferenceStatus: React.FC<InferenceStatusProps> = ({
  inferenceStatus,
  consecutiveFailures,
  latency,
  detectionCount,
  lastUpdateTime,
  onRetryConnection,
}) => {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('Never');

  useEffect(() => {
    if (lastUpdateTime === 0) {
      setTimeSinceUpdate('Never');
      return;
    }
    const updateTime = () => {
      const diffSec = (performance.now() - lastUpdateTime) / 1000;
      if (diffSec < 1) {
        setTimeSinceUpdate('Just now');
      } else {
        setTimeSinceUpdate(`${diffSec.toFixed(1)} sec ago`);
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 250);
    return () => clearInterval(timer);
  }, [lastUpdateTime]);

  const isServerOffline = consecutiveFailures >= 3;

  const getBadgeDetails = () => {
    if (isServerOffline) {
      return { label: 'Server Offline', classSuffix: 'error' };
    }
    switch (inferenceStatus) {
      case 'detecting':
        return { label: 'Detecting...', classSuffix: 'detecting' };
      case 'idle':
        return { label: 'Idle / Pacing', classSuffix: 'idle' };
      case 'waiting':
        return { label: 'Waiting...', classSuffix: 'waiting' };
      default:
        return { label: 'Idle', classSuffix: 'idle' };
    }
  };

  const badge = getBadgeDetails();

  return (
    <div className="inference-status-panel-card">
      <div className="panel-card-header">
        <h4 className="panel-card-title">Telemetry Status</h4>
        <div className={`status-badge-indicator badge-${badge.classSuffix}`}>
          {inferenceStatus === 'detecting' && <span className="pulsing-radar-ring" />}
          <span>{badge.label}</span>
        </div>
      </div>

      {isServerOffline ? (
        <div className="server-offline-warning-block">
          <svg className="warning-shield-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="warning-title">AI Server Unavailable</span>
          <p className="warning-desc">
            Failed to connect to the AI backend after multiple attempts. The camera feed continues, but live damage overlay is paused.
          </p>
          <button
            onClick={onRetryConnection}
            className="retry-connection-btn-action"
            type="button"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="telemetry-info-lines">
          <div className="info-line">
            <span className="line-label">Active Model</span>
            <span className="line-value font-mono">YOLOv8s (Medium)</span>
          </div>
          <div className="info-line">
            <span className="line-label">Inference Latency</span>
            <span className="line-value">
              {latency > 0 ? `${latency.toFixed(0)} ms` : 'N/A'}
            </span>
          </div>
          <div className="info-line">
            <span className="line-label">Detections</span>
            <span className="line-value">{detectionCount} objects</span>
          </div>
          <div className="info-line">
            <span className="line-label">Last Updated</span>
            <span className="line-value text-amber">{timeSinceUpdate}</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default InferenceStatus;
