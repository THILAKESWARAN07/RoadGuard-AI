import React, { useEffect, useState } from 'react';
import { SessionMetricsData } from './AnalyticsCards';
import { historyService } from '../../services/historyService';

export interface SessionEvent {
  timestamp: string; // HH:MM:SS
  type: 'session_start' | 'alert' | 'speech' | 'capture' | 'gps_lock';
  message: string;
}

interface PerformancePanelProps {
  metrics: SessionMetricsData;
  events: SessionEvent[];
}

const getLocalStorageSize = (): string => {
  try {
    const raw = JSON.stringify(localStorage);
    const bytes = raw.length * 2;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  } catch (e) {
    return 'Unknown';
  }
};

export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  metrics,
  events,
}) => {
  const [historyCount, setHistoryCount] = useState<number>(0);
  const storageSize = getLocalStorageSize();

  useEffect(() => {
    const fetchHistoryCount = async () => {
      try {
        const items = await historyService.getAllDetections();
        setHistoryCount(items.length);
      } catch (err) {
        console.error('Failed to retrieve history size:', err);
      }
    };
    void fetchHistoryCount();
  }, [metrics.autoCaptures, metrics.manualCaptures]); // refetch when captures occur

  const avgConfidence = metrics.successfulRequests > 0
    ? metrics.averageConfidenceSum / metrics.successfulRequests
    : 0;

  return (
    <div className="analytics-performance-grid">
      {/* Detection Accuracy Widget */}
      <div className="performance-card">
        <h4 className="chart-card-heading">AI Confidence Stats</h4>
        <div className="accuracy-stats-flex">
          <div className="accuracy-stat-box">
            <span className="accuracy-lbl">Avg Confidence</span>
            <span className="accuracy-val text-green">{(avgConfidence * 100).toFixed(0)}%</span>
          </div>
          <div className="accuracy-stat-box">
            <span className="accuracy-lbl">Highest Score</span>
            <span className="accuracy-val text-blue">{(metrics.maxConfidence * 100).toFixed(0)}%</span>
          </div>
          <div className="accuracy-stat-box">
            <span className="accuracy-lbl">Lowest Score</span>
            <span className="accuracy-val text-orange">
              {metrics.minConfidence === 1 ? '0%' : `${(metrics.minConfidence * 100).toFixed(0)}%`}
            </span>
          </div>
        </div>
        <p className="tile-desc" style={{ marginTop: '0.65rem' }}>Confidence score range of AI inference detections.</p>
      </div>

      {/* Diagnostic Memory & Storage */}
      <div className="performance-card">
        <h4 className="chart-card-heading">Diagnostic Storage Usage</h4>
        <div className="sidebar-metadata-list" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
          <div className="info-row">
            <span className="info-label">LocalStorage Size</span>
            <span className="info-value font-mono font-semibold">{storageSize}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Evidence Items Count</span>
            <span className="info-value font-mono">{historyCount} reports</span>
          </div>
          <div className="info-row">
            <span className="info-label">Average Item Size</span>
            <span className="info-value font-mono">~ 35 KB</span>
          </div>
        </div>
        <p className="tile-desc" style={{ marginTop: '0.65rem' }}>Footprint of captured evidence snapshots inside browser DB cache.</p>
      </div>

      {/* Session Event Timeline */}
      <div className="performance-card timeline-card" style={{ gridColumn: 'span 2' }}>
        <h4 className="chart-card-heading" style={{ marginBottom: '0.75rem' }}>Session Event Log</h4>
        <div className="timeline-events-container">
          {events.length === 0 ? (
            <div className="empty-timeline-message">
              <p>Awaiting session events...</p>
            </div>
          ) : (
            <div className="timeline-tracks">
              {events.map((ev, idx) => {
                let badgeColor = '';
                if (ev.type === 'session_start') badgeColor = 'timeline-blue';
                else if (ev.type === 'alert') badgeColor = 'timeline-orange';
                else if (ev.type === 'speech') badgeColor = 'timeline-green';
                else if (ev.type === 'capture') badgeColor = 'timeline-yellow';
                else badgeColor = 'timeline-cyan';

                return (
                  <div key={idx} className="timeline-event-item">
                    <div className="event-meta">
                      <span className="event-time monospace">{ev.timestamp}</span>
                      <span className={`event-badge-dot ${badgeColor}`} />
                    </div>
                    <div className="event-content">
                      <p className="event-msg">{ev.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PerformancePanel;
