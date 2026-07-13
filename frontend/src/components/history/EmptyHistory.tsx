import React from 'react';

interface EmptyHistoryProps {
  isFiltered: boolean;
  onClearFilters?: () => void;
}

export const EmptyHistory: React.FC<EmptyHistoryProps> = ({ isFiltered, onClearFilters }) => {
  return (
    <div className="empty-history" role="status">
      <div className="empty-history-icon" aria-hidden="true">
        {isFiltered ? (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        )}
      </div>
      <h3 className="empty-history-title">
        {isFiltered ? 'No Detections Match Your Filters' : 'No Detection History Yet'}
      </h3>
      <p className="empty-history-message">
        {isFiltered
          ? 'Try adjusting your search query, changing the confidence threshold slider, or clearing active filters.'
          : 'Once you upload road images and analyze them, your records will be displayed here automatically.'}
      </p>
      {isFiltered && onClearFilters && (
        <button className="clear-filters-btn" onClick={onClearFilters} type="button">
          Reset All Filters
        </button>
      )}
    </div>
  );
};
