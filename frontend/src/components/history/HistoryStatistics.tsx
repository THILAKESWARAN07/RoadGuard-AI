import React from 'react';
import { HistoryStats } from '../../services/historyService';

interface HistoryStatisticsProps {
  stats: HistoryStats;
}

export const HistoryStatistics: React.FC<HistoryStatisticsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Analyzed Images',
      value: stats.totalImages,
      desc: 'Cumulative uploaded files',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      color: '#f3b63f',
    },
    {
      title: 'Potholes Detected',
      value: stats.totalPotholes,
      desc: 'Pothole damage instances',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
      ),
      color: '#ff5252',
    },
    {
      title: 'Manholes Detected',
      value: stats.totalManholes,
      desc: 'Manhole structure instances',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ),
      color: '#00b2ff',
    },
    {
      title: 'Average Confidence',
      value: `${(stats.averageConfidence * 100).toFixed(1)}%`,
      desc: 'AI classification probability',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      color: '#73e19f',
    },
    {
      title: 'Average Latency',
      value: `${stats.averageProcessingTime.toFixed(0)}ms`,
      desc: 'AI compute processing speed',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: '#e5f4ff',
    },
    {
      title: 'Repair Verification Rate',
      value: `${stats.repairRate.toFixed(1)}%`,
      desc: 'Status marked as repaired',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      color: '#73e19f',
    },
  ];

  return (
    <div className="history-statistics-dashboard">
      <div className="stats-dashboard-grid">
        {statCards.map((card, i) => (
          <div key={i} className="dashboard-stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">{card.title}</span>
              <div className="stat-card-icon" style={{ color: card.color }}>{card.icon}</div>
            </div>
            <div className="stat-card-value" style={{ color: card.color }}>{card.value}</div>
            <span className="stat-card-desc">{card.desc}</span>
          </div>
        ))}
      </div>

      <div className="stats-breakdowns-grid">
        {/* Severity breakdown */}
        <div className="breakdown-panel">
          <h4 className="breakdown-panel-title">Highest Severity Distribution</h4>
          <div className="severity-bar-list">
            <div className="severity-bar-row">
              <span className="severity-label red">High Risk</span>
              <div className="severity-bar-track">
                <div
                  className="severity-bar-fill high-fill"
                  style={{
                    width: stats.totalImages > 0 ? `${(stats.severityBreakdown.high / stats.totalImages) * 100}%` : '0%'
                  }}
                />
              </div>
              <span className="severity-count">{stats.severityBreakdown.high}</span>
            </div>
            <div className="severity-bar-row">
              <span className="severity-label orange">Medium Risk</span>
              <div className="severity-bar-track">
                <div
                  className="severity-bar-fill medium-fill"
                  style={{
                    width: stats.totalImages > 0 ? `${(stats.severityBreakdown.medium / stats.totalImages) * 100}%` : '0%'
                  }}
                />
              </div>
              <span className="severity-count">{stats.severityBreakdown.medium}</span>
            </div>
            <div className="severity-bar-row">
              <span className="severity-label green">Low Risk</span>
              <div className="severity-bar-track">
                <div
                  className="severity-bar-fill low-fill"
                  style={{
                    width: stats.totalImages > 0 ? `${(stats.severityBreakdown.low / stats.totalImages) * 100}%` : '0%'
                  }}
                />
              </div>
              <span className="severity-count">{stats.severityBreakdown.low}</span>
            </div>
            <div className="severity-bar-row">
              <span className="severity-label gray">No Damage</span>
              <div className="severity-bar-track">
                <div
                  className="severity-bar-fill none-fill"
                  style={{
                    width: stats.totalImages > 0 ? `${(stats.severityBreakdown.none / stats.totalImages) * 100}%` : '0%'
                  }}
                />
              </div>
              <span className="severity-count">{stats.severityBreakdown.none}</span>
            </div>
          </div>
        </div>

        {/* Activity tracking */}
        <div className="breakdown-panel">
          <h4 className="breakdown-panel-title">Detection Recency</h4>
          <div className="recency-metrics">
            <div className="recency-metric-item">
              <span className="recency-metric-label">Detections Today</span>
              <span className="recency-metric-value">{stats.detectionsToday}</span>
            </div>
            <div className="recency-divider" />
            <div className="recency-metric-item">
              <span className="recency-metric-label">Detections This Week</span>
              <span className="recency-metric-value">{stats.detectionsThisWeek}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
