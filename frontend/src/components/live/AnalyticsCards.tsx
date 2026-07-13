import React from 'react';

export interface SessionMetricsData {
  startTime: number;
  framesProcessed: number;
  successfulRequests: number;
  failedRequests: number;
  totalLatency: number;
  totalInferenceTime: number;
  totalDetections: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  potholesCount: number;
  manholesCount: number;
  autoCaptures: number;
  manualCaptures: number;
  voiceAnnouncements: number;
  driverAlerts: number;
  gpsCapturesCount: number;
  averageConfidenceSum: number;
  maxConfidence: number;
  minConfidence: number;
}

interface AnalyticsCardsProps {
  metrics: SessionMetricsData;
  durationSec: number;
  averageFps: number;
  skippedFrames: number;
  gpsLoggingEnabled: boolean;
  gpsStatus: string;
}

export const calculateHealthScore = (
  avgLatency: number,
  failedRequests: number,
  skippedFrames: number,
  processedFrames: number,
  gpsLogging: boolean,
  gpsStatus: string
): number => {
  let score = 100;

  // 1. Latency Deductions: deduct 1 point for every 40ms over 300ms (max 12 pts)
  if (avgLatency > 300) {
    const excess = avgLatency - 300;
    score -= Math.min(12, Math.floor(excess / 40));
  }

  // 2. Failed Request Deductions: deduct 5 points per error (max 25 pts)
  score -= Math.min(25, failedRequests * 5);

  // 3. Geolocation Signal loss: deduct 10 points
  if (gpsLogging && gpsStatus !== 'found') {
    score -= 10;
  }

  // 4. Frames Skipped/Dropped Rate: deduct 1 point for every 5% drop rate (max 10 pts)
  if (processedFrames > 0) {
    const totalTicks = processedFrames + skippedFrames;
    const skipRate = skippedFrames / totalTicks;
    score -= Math.min(10, Math.floor(skipRate * 20));
  }

  return Math.max(0, score);
};

export const getPerformanceGrade = (latency: number): { label: string; colorClass: string } => {
  if (latency <= 0) return { label: 'Waiting...', colorClass: 'text-blue' };
  if (latency < 300) return { label: 'Excellent', colorClass: 'text-green' };
  if (latency <= 500) return { label: 'Good', colorClass: 'text-green' };
  if (latency <= 700) return { label: 'Fair', colorClass: 'text-orange' };
  return { label: 'Poor', colorClass: 'text-red' };
};

const formatDuration = (totalSecs: number): string => {
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
};

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({
  metrics,
  durationSec,
  averageFps,
  skippedFrames,
  gpsLoggingEnabled,
  gpsStatus,
}) => {
  const avgLatency = metrics.successfulRequests > 0
    ? Math.round(metrics.totalLatency / metrics.successfulRequests)
    : 0;

  const avgInference = metrics.successfulRequests > 0
    ? Math.round(metrics.totalInferenceTime / metrics.successfulRequests)
    : 0;

  const healthScore = calculateHealthScore(
    avgLatency,
    metrics.failedRequests,
    skippedFrames,
    metrics.framesProcessed,
    gpsLoggingEnabled,
    gpsStatus
  );

  const perfGrade = getPerformanceGrade(avgLatency);

  return (
    <div className="analytics-metrics-grid">
      {/* Session Health Card */}
      <div className="metric-tile card-health" style={{ gridColumn: 'span 2' }}>
        <span className="tile-label">Session Health Rating</span>
        <div className="tile-value-group">
          <span className="tile-value font-mono">{healthScore}</span>
          <span className="tile-unit">/ 100</span>
        </div>
        <p className="tile-desc">Calculated dynamically from dropped frames, Latency, and API errors.</p>
      </div>

      {/* AI Latency Badge Card */}
      <div className="metric-tile">
        <span className="tile-label">AI Status Grade</span>
        <span className={`tile-value ${perfGrade.colorClass}`} style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>
          {perfGrade.label}
        </span>
        <p className="tile-desc">Based on Average Network Round-Trip latency.</p>
      </div>

      {/* Session Duration */}
      <div className="metric-tile">
        <span className="tile-label">Session Duration</span>
        <span className="tile-value font-mono" style={{ fontSize: '1.55rem' }}>
          {formatDuration(durationSec)}
        </span>
        <p className="tile-desc">Running elapsed time of active camera feed.</p>
      </div>

      {/* Frames Processed vs Skipped */}
      <div className="metric-tile">
        <span className="tile-label">Frames Processed / Dropped</span>
        <div className="tile-value-group" style={{ fontSize: '1.25rem' }}>
          <span className="tile-value text-green">{metrics.framesProcessed}</span>
          <span className="tile-unit" style={{ margin: '0 4px' }}>/</span>
          <span className="tile-value text-red">{skippedFrames}</span>
        </div>
        <p className="tile-desc">Total frame ticks processed vs skipped (concurrency overlaps).</p>
      </div>

      {/* Successful vs Failed Requests */}
      <div className="metric-tile">
        <span className="tile-label">AI Requests Success / Failure</span>
        <div className="tile-value-group" style={{ fontSize: '1.25rem' }}>
          <span className="tile-value text-green">{metrics.successfulRequests}</span>
          <span className="tile-unit" style={{ margin: '0 4px' }}>/</span>
          <span className="tile-value text-red">{metrics.failedRequests}</span>
        </div>
        <p className="tile-desc">Number of successful inference API uploads vs network drops.</p>
      </div>

      {/* Average Latency */}
      <div className="metric-tile">
        <span className="tile-label">Avg Network Latency</span>
        <div className="tile-value-group">
          <span className="tile-value font-mono">{avgLatency}</span>
          <span className="tile-unit">ms</span>
        </div>
        <p className="tile-desc">Average frame round-trip time (upload + backend YOLO + response).</p>
      </div>

      {/* Average Inference Time */}
      <div className="metric-tile">
        <span className="tile-label">Avg GPU Inference</span>
        <div className="tile-value-group">
          <span className="tile-value font-mono">{avgInference}</span>
          <span className="tile-unit">ms</span>
        </div>
        <p className="tile-desc">Average execution speed of the YOLOv8 model on the host.</p>
      </div>

      {/* Average FPS */}
      <div className="metric-tile">
        <span className="tile-label">Average Session FPS</span>
        <div className="tile-value-group">
          <span className="tile-value font-mono">{averageFps.toFixed(1)}</span>
          <span className="tile-unit">FPS</span>
        </div>
        <p className="tile-desc">Inference frame rate since the camera started streaming.</p>
      </div>

      {/* Total Detections */}
      <div className="metric-tile">
        <span className="tile-label">Total Detections Count</span>
        <span className="tile-value font-mono">{metrics.totalDetections}</span>
        <p className="tile-desc">Aggregate number of pavement distresses flagged in this run.</p>
      </div>

      {/* Potholes vs Manholes */}
      <div className="metric-tile">
        <span className="tile-label">Potholes / Manholes</span>
        <div className="tile-value-group" style={{ fontSize: '1.25rem' }}>
          <span className="tile-value text-red">{metrics.potholesCount}</span>
          <span className="tile-unit" style={{ margin: '0 4px' }}>/</span>
          <span className="tile-value text-blue">{metrics.manholesCount}</span>
        </div>
        <p className="tile-desc">Count of potholes detected vs normal circular manholes.</p>
      </div>

      {/* Auto vs Manual Captures */}
      <div className="metric-tile">
        <span className="tile-label">Auto / Manual Evidence</span>
        <div className="tile-value-group" style={{ fontSize: '1.25rem' }}>
          <span className="tile-value text-orange">{metrics.autoCaptures}</span>
          <span className="tile-unit" style={{ margin: '0 4px' }}>/</span>
          <span className="tile-value text-blue">{metrics.manualCaptures}</span>
        </div>
        <p className="tile-desc">Snapshots triggered automatically vs driver's manually captured clicks.</p>
      </div>

      {/* Voice Alerts and Driver Alerts count */}
      <div className="metric-tile">
        <span className="tile-label">HUD Alerts / Speech Cues</span>
        <div className="tile-value-group" style={{ fontSize: '1.25rem' }}>
          <span className="tile-value text-amber">{metrics.driverAlerts}</span>
          <span className="tile-unit" style={{ margin: '0 4px' }}>/</span>
          <span className="tile-value text-green">{metrics.voiceAnnouncements}</span>
        </div>
        <p className="tile-desc">Count of visual HUD alert frames vs processed text-to-speech cues.</p>
      </div>

      {/* GPS Captures */}
      <div className="metric-tile">
        <span className="tile-label">Geotagged GPS Records</span>
        <span className="tile-value font-mono">{metrics.gpsCapturesCount}</span>
        <p className="tile-desc">Geotagged entries logged in history with active satellite locks.</p>
      </div>
    </div>
  );
};
export default AnalyticsCards;
