import React from 'react';

interface EmptyDashboardProps {
  hasFilters: boolean;
  onReset?: () => void;
}

export const EmptyDashboard: React.FC<EmptyDashboardProps> = ({ hasFilters, onReset }) => (
  <div className="gov-empty-state" role="status" aria-live="polite">
    <div className="gov-empty-icon" aria-hidden="true">
      {hasFilters ? '🔍' : '📂'}
    </div>
    <h3 className="gov-empty-title">
      {hasFilters ? 'No Records Match Your Filters' : 'No Detection Records Yet'}
    </h3>
    <p className="gov-empty-desc">
      {hasFilters
        ? 'Try adjusting your search terms or filter criteria to find records.'
        : 'Detection records captured via the live camera and AI upload modules will appear here.'}
    </p>
    {hasFilters && onReset && (
      <button type="button" className="gov-empty-reset-btn" onClick={onReset}>
        Clear Filters &amp; Search
      </button>
    )}
  </div>
);

export default EmptyDashboard;
