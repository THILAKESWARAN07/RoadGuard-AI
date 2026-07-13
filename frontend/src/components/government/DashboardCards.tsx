import React from 'react';
import type { HistoryItem } from '../../services/historyService';
import { toGovStatus } from './StatusBadge';

interface DashboardCardsProps {
  items: HistoryItem[];
}

export const DashboardCards: React.FC<DashboardCardsProps> = React.memo(({ items }) => {
  const total = items.length;

  const highCount = items.filter(
    (i) => i.summary.highest_severity.toLowerCase() === 'high'
  ).length;
  const medCount = items.filter(
    (i) => i.summary.highest_severity.toLowerCase() === 'medium'
  ).length;
  const lowCount = items.filter(
    (i) => i.summary.highest_severity.toLowerCase() === 'low'
  ).length;

  const pending = items.filter((i) => toGovStatus(i.status) === 'pending').length;
  const inProgress = items.filter((i) => toGovStatus(i.status) === 'in_progress').length;
  const completed = items.filter((i) => toGovStatus(i.status) === 'completed').length;

  const avgConf =
    total > 0
      ? (items.reduce((s, i) => s + i.summary.average_confidence, 0) / total) * 100
      : 0;

  const lastTs = total > 0 ? Math.max(...items.map((i) => i.timestamp)) : null;
  const lastDetection = lastTs
    ? new Date(lastTs).toLocaleString()
    : 'No records yet';

  const cards = [
    { label: 'Total Reports', value: total, icon: '📋', accent: 'blue' },
    { label: 'High Severity', value: highCount, icon: '🔴', accent: 'red' },
    { label: 'Medium Severity', value: medCount, icon: '🟠', accent: 'orange' },
    { label: 'Low Severity', value: lowCount, icon: '🟡', accent: 'yellow' },
    { label: 'Pending Repairs', value: pending, icon: '⏳', accent: 'yellow' },
    { label: 'In Progress', value: inProgress, icon: '🔧', accent: 'blue' },
    { label: 'Completed', value: completed, icon: '✅', accent: 'green' },
    { label: 'Avg Confidence', value: `${avgConf.toFixed(0)}%`, icon: '🎯', accent: 'green' },
  ];

  return (
    <div className="gov-cards-grid">
      {cards.map((c) => (
        <div key={c.label} className={`gov-kpi-card gov-kpi-card--${c.accent}`}>
          <div className="gov-kpi-icon" aria-hidden="true">{c.icon}</div>
          <div className="gov-kpi-body">
            <span className="gov-kpi-value">{c.value}</span>
            <span className="gov-kpi-label">{c.label}</span>
          </div>
        </div>
      ))}
      <div className="gov-kpi-card gov-kpi-card--subtle gov-kpi-card--wide">
        <div className="gov-kpi-icon" aria-hidden="true">🕐</div>
        <div className="gov-kpi-body">
          <span className="gov-kpi-value gov-kpi-value--sm">{lastDetection}</span>
          <span className="gov-kpi-label">Last Detection</span>
        </div>
      </div>
    </div>
  );
});

DashboardCards.displayName = 'DashboardCards';
export default DashboardCards;
