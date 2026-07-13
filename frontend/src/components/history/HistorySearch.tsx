import React from 'react';

interface HistorySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const HistorySearch: React.FC<HistorySearchProps> = ({
  value,
  onChange,
  placeholder = 'Search detections by file name, class, severity, date, or status...',
}) => {
  return (
    <div className="history-search-bar-container">
      <div className="search-icon-wrapper" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      
      <input
        type="search"
        className="history-search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search history records"
      />

      {value && (
        <button
          className="search-clear-btn"
          onClick={() => onChange('')}
          type="button"
          aria-label="Clear search input"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};
