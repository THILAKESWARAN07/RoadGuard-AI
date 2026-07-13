import React from 'react';

interface SessionSummaryProps {
  sessionId: string;
  startTimeMs: number;
  durationSec: number;
  modelName: string;
  avgConfidence: number;
  captureCount: number;
  gpsStatus: string;
  gpsLoggingEnabled: boolean;
  cameraName: string;
  cameraResolution: string;
  cameraFps: number;
  isMirrored: boolean;
}

const getBrowserOSInfo = (): { browser: string; os: string } => {
  if (typeof window === 'undefined') return { browser: 'Unknown', os: 'Unknown' };
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  // Basic OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Basic Browser detection
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome') && !ua.includes('Chromium')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  return { browser, os };
};

const formatTime = (timestampMs: number): string => {
  return new Date(timestampMs).toLocaleTimeString();
};

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  sessionId,
  startTimeMs,
  durationSec,
  modelName,
  avgConfidence,
  captureCount,
  gpsStatus,
  gpsLoggingEnabled,
  cameraName,
  cameraResolution,
  cameraFps,
  isMirrored,
}) => {
  const sysInfo = getBrowserOSInfo();
  const screenResolution = typeof window !== 'undefined'
    ? `${window.screen.width} × ${window.screen.height}`
    : 'Unknown';

  return (
    <div className="analytics-summary-card sidebar-card">
      <h3 className="sidebar-card-title">Session Profile Summary</h3>
      <p className="sidebar-desc" style={{ marginBottom: '1rem' }}>
        Inspection telemetry metadata logs captured in this run.
      </p>

      <div className="sidebar-metadata-list font-medium">
        <div className="info-row">
          <span className="info-label">Session ID</span>
          <span className="info-value monospace font-bold text-amber">{sessionId || 'N/A'}</span>
        </div>

        <div className="info-row">
          <span className="info-label">Start Time</span>
          <span className="info-value">{formatTime(startTimeMs)}</span>
        </div>

        <div className="info-row">
          <span className="info-label">AI Model</span>
          <span className="info-value font-mono">{modelName}</span>
        </div>

        <div className="info-row">
          <span className="info-label">Avg Confidence</span>
          <span className="info-value font-semibold">{(avgConfidence * 100).toFixed(0)}%</span>
        </div>

        <div className="info-row">
          <span className="info-label">Total Captures</span>
          <span className="info-value">{captureCount} saves</span>
        </div>

        <div className="info-row">
          <span className="info-label">GPS Geotag Status</span>
          <span className={`info-value font-semibold ${gpsLoggingEnabled && gpsStatus === 'found' ? 'text-green' : 'text-red'}`}>
            {!gpsLoggingEnabled ? 'Logging Disabled' : gpsStatus === 'found' ? 'Acquired Lock' : 'No Signal'}
          </span>
        </div>

        <div className="tooltip-divider" style={{ margin: '0.85rem 0' }} />

        <div className="info-row">
          <span className="info-label">Camera Specs</span>
          <span className="info-value truncate-val" style={{ maxWidth: '160px' }} title={cameraName || 'Default webcam'}>
            {cameraName || 'N/A'}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">Cam Resolution</span>
          <span className="info-value">{cameraResolution || 'N/A'}</span>
        </div>

        <div className="info-row">
          <span className="info-label">Target Rate</span>
          <span className="info-value">{cameraFps ? `${cameraFps} FPS` : 'N/A'}</span>
        </div>

        <div className="info-row">
          <span className="info-label">Mirror Toggle</span>
          <span className="info-value">{isMirrored ? 'Enabled' : 'Disabled'}</span>
        </div>

        <div className="tooltip-divider" style={{ margin: '0.85rem 0' }} />

        <div className="info-row">
          <span className="info-label">Operating System</span>
          <span className="info-value">{sysInfo.os}</span>
        </div>

        <div className="info-row">
          <span className="info-label">Web Browser</span>
          <span className="info-value">{sysInfo.browser}</span>
        </div>

        <div className="info-row">
          <span className="info-label">Screen Size</span>
          <span className="info-value">{screenResolution}</span>
        </div>
      </div>
    </div>
  );
};
export default SessionSummary;
