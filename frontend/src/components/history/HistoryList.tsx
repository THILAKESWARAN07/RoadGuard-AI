import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../../services/historyService';
import { HistoryCard } from './HistoryCard';

interface HistoryListProps {
  items: HistoryItem[];
  selectedIds: Set<string>;
  onSelectChange: (id: string, checked: boolean) => void;
  onSelectAllChange: (checked: boolean) => void;
  onViewClick: (item: HistoryItem) => void;
  onDeleteClick: (id: string) => void;
  onBulkDeleteClick: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  selectedIds,
  onSelectChange,
  onSelectAllChange,
  onViewClick,
  onDeleteClick,
  onBulkDeleteClick,
}) => {
  const [visibleCount, setVisibleCount] = useState(12);

  // Reset pagination when items change (e.g. searching/filtering)
  useEffect(() => {
    setVisibleCount(12);
  }, [items]);

  // Infinite Scroll Handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 120
      ) {
        if (visibleCount < items.length) {
          setVisibleCount((prev) => Math.min(prev + 12, items.length));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, items.length]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 12, items.length));
  };

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  const displayedItems = items.slice(0, visibleCount);

  return (
    <div className="history-list-section">
      {items.length > 0 && (
        <div className="list-controls-bar">
          <div className="select-all-control">
            <label className="checkbox-label-wrapper">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAllChange(e.target.checked)}
                className="card-checkbox select-all-checkbox"
              />
              <span className="select-all-text">
                {selectedIds.size > 0
                  ? `Selected ${selectedIds.size} of ${items.length} items`
                  : 'Select All'}
              </span>
            </label>
          </div>

          {selectedIds.size > 0 && (
            <button
              className="bulk-delete-action-btn"
              onClick={onBulkDeleteClick}
              type="button"
              aria-label={`Delete ${selectedIds.size} selected reports`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          )}
        </div>
      )}

      {/* Grid of history cards */}
      <div className="history-cards-grid-layout">
        {displayedItems.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            isSelected={selectedIds.has(item.id)}
            onSelectChange={onSelectChange}
            onViewClick={onViewClick}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </div>

      {/* Load More Button for accessibility and manual expansion */}
      {visibleCount < items.length && (
        <div className="load-more-btn-container">
          <button
            className="load-more-action-btn"
            onClick={handleLoadMore}
            type="button"
            aria-label="Load more detection records"
          >
            Load More Records ({items.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};
