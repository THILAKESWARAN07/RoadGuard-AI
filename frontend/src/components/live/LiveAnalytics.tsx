import React from 'react';
import { AnalyticsCards, SessionMetricsData, calculateHealthScore, getPerformanceGrade } from './AnalyticsCards';
import { AnalyticsCharts } from './AnalyticsCharts';
import { SessionSummary } from './SessionSummary';
import { PerformancePanel, SessionEvent } from './PerformancePanel';

interface Sample {
  timestamp: number;
  fps: number;
  latency: number;
  detections: number;
  hasCapture: boolean;
}

interface LiveAnalyticsProps {
  metrics: SessionMetricsData;
  samples: Sample[];
  events: SessionEvent[];
  durationSec: number;
  averageFps: number;
  skippedFrames: number;
  gpsStatus: string;
  gpsLoggingEnabled: boolean;
  cameraName: string;
  cameraResolution: string;
  cameraFps: number;
  isMirrored: boolean;
  sessionId: string;
}

export const LiveAnalytics: React.FC<LiveAnalyticsProps> = ({
  metrics,
  samples,
  events,
  durationSec,
  averageFps,
  skippedFrames,
  gpsStatus,
  gpsLoggingEnabled,
  cameraName,
  cameraResolution,
  cameraFps,
  isMirrored,
  sessionId,
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

  const avgConfidence = metrics.successfulRequests > 0
    ? metrics.averageConfidenceSum / metrics.successfulRequests
    : 0;

  // JSON exporter handler
  const handleExportJSON = () => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    let os = 'Unknown';
    let browser = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';

    const screenRes = typeof window !== 'undefined'
      ? `${window.screen.width} × ${window.screen.height}`
      : 'Unknown';

    const exportData = {
      schemaVersion: '1.0',
      roadGuardVersion: '1.0',
      sessionId,
      startTime: new Date(metrics.startTime).toLocaleString(),
      durationSeconds: durationSec,
      averageFps: parseFloat(averageFps.toFixed(1)),
      averageLatencyMs: avgLatency,
      averageInferenceTimeMs: avgInference,
      totalProcessedFrames: metrics.framesProcessed,
      totalSkippedFrames: skippedFrames,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      sessionHealthScore: healthScore,
      aiPerformanceGrade: perfGrade.label,
      totalDetections: metrics.totalDetections,
      potholesCount: metrics.potholesCount,
      manholesCount: metrics.manholesCount,
      autoCapturesCount: metrics.autoCaptures,
      manualCapturesCount: metrics.manualCaptures,
      gpsCapturesCount: metrics.gpsCapturesCount,
      voiceAnnouncementsCount: metrics.voiceAnnouncements,
      visualAlertsCount: metrics.driverAlerts,
      averageConfidence: parseFloat(avgConfidence.toFixed(2)),
      maxConfidence: metrics.maxConfidence,
      minConfidence: metrics.minConfidence === 1 ? 0 : metrics.minConfidence,
      deviceMetadata: {
        browser,
        os,
        screenResolution: screenRes,
        cameraDevice: cameraName || 'Default Camera',
        cameraResolution: cameraResolution || 'Unknown',
        targetFrameRate: cameraFps || 30,
        mirroringEnabled: isMirrored,
        gpsLoggingEnabled,
        gpsLockStatus: gpsStatus,
      },
      samples,
      events,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `roadguard_session_${sessionId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="live-analytics-dashboard animate-fadeIn">
      {/* Header controls */}
      <div className="analytics-dashboard-header">
        <div>
          <h2 className="dashboard-title">Live Session Analytics</h2>
          <p className="dashboard-subtitle">Real-time performance grids, spatial trends, and export logs.</p>
        </div>

        <button
          type="button"
          onClick={handleExportJSON}
          className="export-analytics-json-btn"
          aria-label="Export session summary statistics as JSON file"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export Summary JSON</span>
        </button>
      </div>

      <div className="analytics-grid-layout">
        {/* Left Side: KPIs and Charts */}
        <div className="analytics-dashboard-main-area">
          <AnalyticsCards
            metrics={metrics}
            durationSec={durationSec}
            averageFps={averageFps}
            skippedFrames={skippedFrames}
            gpsLoggingEnabled={gpsLoggingEnabled}
            gpsStatus={gpsStatus}
          />

          <AnalyticsCharts
            samples={samples}
            highCount={metrics.highSeverityCount}
            mediumCount={metrics.mediumSeverityCount}
            lowCount={metrics.lowSeverityCount}
            potholes={metrics.potholesCount}
            manholes={metrics.manholesCount}
          />
        </div>

        {/* Right Side: Diagnostics and Metadata */}
        <div className="analytics-dashboard-sidebar-area">
          <SessionSummary
            sessionId={sessionId}
            startTimeMs={metrics.startTime}
            durationSec={durationSec}
            modelName="YOLOv8s Road Guard"
            avgConfidence={avgConfidence}
            captureCount={metrics.autoCaptures + metrics.manualCaptures}
            gpsStatus={gpsStatus}
            gpsLoggingEnabled={gpsLoggingEnabled}
            cameraName={cameraName}
            cameraResolution={cameraResolution}
            cameraFps={cameraFps}
            isMirrored={isMirrored}
          />

          <PerformancePanel
            metrics={metrics}
            events={events}
          />
        </div>
      </div>
    </div>
  );
};
export default LiveAnalytics;
