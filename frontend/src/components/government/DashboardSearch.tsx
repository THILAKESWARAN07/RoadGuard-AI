import React from 'react';

interface DashboardSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export const DashboardSearch: React.FC<DashboardSearchProps> = ({ value, onChange }) => {
  return (
    <div className="gov-search-wrapper" role="search">
      <svg className="gov-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        id="gov-dashboard-search"
        type="search"
        className="gov-search-input"
        placeholder="Search by ID, filename, damage type, status…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search detections"
      />
      {value && (
        <button
          type="button"
          className="gov-search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default DashboardSearch;
