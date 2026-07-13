import React from 'react';
import { HistoryFilters as FiltersType } from '../../services/historyService';

interface HistoryFiltersProps {
  filters: FiltersType;
  onChange: (filters: FiltersType) => void;
  onReset: () => void;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const handleTypeChange = (type: FiltersType['damageType']) => {
    onChange({ ...filters, damageType: type });
  };

  const handleSeverityChange = (severity: FiltersType['severity']) => {
    onChange({ ...filters, severity });
  };

  const handleTimeChange = (timeRange: FiltersType['timeRange']) => {
    onChange({ ...filters, timeRange });
  };

  const handleConfidenceChange = (minConfidence: number) => {
    onChange({ ...filters, minConfidence });
  };

  return (
    <div className="history-filters-panel" aria-label="Filters bar">
      {/* Damage Type Filter Group */}
      <div className="filter-group">
        <span className="filter-group-label">Damage Type</span>
        <div className="filter-options-row">
          {(['all', 'potholes', 'manholes', 'none'] as const).map((type) => (
            <button
              key={type}
              className={`filter-btn ${filters.damageType === type ? 'active' : ''}`}
              onClick={() => handleTypeChange(type)}
              type="button"
            >
              {type === 'all' && 'All Detections'}
              {type === 'potholes' && 'Potholes'}
              {type === 'manholes' && 'Manholes'}
              {type === 'none' && 'No Damage'}
            </button>
          ))}
        </div>
      </div>

      {/* Severity Filter Group */}
      <div className="filter-group">
        <span className="filter-group-label">Severity</span>
        <div className="filter-options-row">
          {(['all', 'high', 'medium', 'low'] as const).map((severity) => (
            <button
              key={severity}
              className={`filter-btn ${filters.severity === severity ? 'active' : ''}`}
              onClick={() => handleSeverityChange(severity)}
              type="button"
            >
              {severity === 'all' && 'All Severities'}
              {severity === 'high' && '🔴 High'}
              {severity === 'medium' && '🟡 Medium'}
              {severity === 'low' && '🟢 Low'}
            </button>
          ))}
        </div>
      </div>

      {/* Time Range Filter Group */}
      <div className="filter-group">
        <span className="filter-group-label">Time Range</span>
        <div className="filter-options-row">
          {(['all', 'today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              className={`filter-btn ${filters.timeRange === range ? 'active' : ''}`}
              onClick={() => handleTimeChange(range)}
              type="button"
            >
              {range === 'all' && 'All Time'}
              {range === 'today' && 'Today'}
              {range === 'week' && 'This Week'}
              {range === 'month' && 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Confidence Slider Filter Group */}
      <div className="filter-group confidence-filter-group">
        <div className="slider-label-header">
          <span className="filter-group-label">Detections Above Confidence</span>
          <span className="slider-value-badge">{Math.round(filters.minConfidence * 100)}%</span>
        </div>
        <div className="slider-controls-row">
          <span className="slider-limit-label">20%</span>
          <input
            type="range"
            min="0.20"
            max="0.95"
            step="0.01"
            value={filters.minConfidence}
            onChange={(e) => handleConfidenceChange(parseFloat(e.target.value))}
            className="confidence-slider"
            aria-label="Filter history items by detection confidence threshold"
          />
          <span className="slider-limit-label">95%</span>
        </div>
      </div>

      {/* Reset Filter Group */}
      <div className="filters-actions-group">
        <button
          className="filters-reset-btn"
          onClick={onReset}
          type="button"
          aria-label="Reset all search filters"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};
