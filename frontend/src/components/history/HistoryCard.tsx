import React, { memo } from 'react';
import { HistoryItem } from '../../services/historyService';
import { SeverityBadge } from '../ai/SeverityBadge';

interface HistoryCardProps {
  item: HistoryItem;
  isSelected: boolean;
  onSelectChange: (id: string, checked: boolean) => void;
  onViewClick: (item: HistoryItem) => void;
  onDeleteClick: (id: string) => void;
}

export const HistoryCard = memo<HistoryCardProps>(({
  item,
  isSelected,
  onSelectChange,
  onViewClick,
  onDeleteClick,
}) => {
  const { id, timestamp, imageName, thumbnail, status, notes, summary } = item;

  // Format date and time
  const dateObj = new Date(timestamp);
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  const formattedTime = dateObj.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getStatusColorClass = () => {
    switch (status) {
      case 'repaired':
        return 'status-repaired';
      case 'ignored':
        return 'status-ignored';
      default:
        return 'status-active';
    }
  };

  return (
    <article
      className={`history-card-item ${isSelected ? 'selected' : ''}`}
      aria-label={`Detection report for ${imageName}`}
    >
      {/* Checkbox for batch selection */}
      <div className="card-selection-overlay">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange(id, e.target.checked)}
          className="card-checkbox"
          aria-label={`Select detection report ${imageName}`}
        />
      </div>

      {/* Thumbnail container */}
      <div className="card-thumbnail-container" onClick={() => onViewClick(item)}>
        <img
          src={thumbnail}
          alt={`Thumbnail preview of ${imageName}`}
          className="card-thumbnail-image"
          loading="lazy"
        />
        {summary.total_detections > 0 && (
          <span className="card-badge-count" title={`${summary.total_detections} damage detections`}>
            {summary.total_detections}
          </span>
        )}
      </div>

      {/* Body content */}
      <div className="card-body-content">
        <div className="card-meta-row">
          <time className="card-date-time" dateTime={dateObj.toISOString()}>
            {formattedDate} · {formattedTime}
          </time>
          <span className={`card-status-pill ${getStatusColorClass()}`}>
            {status}
          </span>
        </div>

        <h3 className="card-filename" title={imageName} onClick={() => onViewClick(item)}>
          {imageName}
        </h3>

        {/* Metrics Grid */}
        <div className="card-metrics-grid">
          <div className="card-metric-block">
            <span className="card-metric-label">Severity</span>
            <SeverityBadge severity={summary.highest_severity} />
          </div>
          <div className="card-metric-block">
            <span className="card-metric-label">Accuracy</span>
            <span className="card-metric-value">
              {summary.total_detections > 0 ? `${(summary.average_confidence * 100).toFixed(0)}%` : 'N/A'}
            </span>
          </div>
          <div className="card-metric-block">
            <span className="card-metric-label">Latency</span>
            <span className="card-metric-value">{Math.round(summary.processing_time_ms)}ms</span>
          </div>
        </div>

        {/* Notes Preview if available */}
        {notes && (
          <div className="card-notes-preview" title={notes}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="card-notes-text">{notes}</span>
          </div>
        )}

        {/* Actions Row */}
        <div className="card-actions-row">
          <button
            className="card-action-btn view-btn"
            onClick={() => onViewClick(item)}
            type="button"
          >
            Open Details
          </button>
          <button
            className="card-action-btn delete-btn"
            onClick={() => onDeleteClick(id)}
            type="button"
            aria-label={`Delete report for ${imageName}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
});

HistoryCard.displayName = 'HistoryCard';
