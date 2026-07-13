import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HistoryItem,
  HistoryStats,
  HistoryFilters as FiltersType,
  SortOption,
  historyService,
  searchDetections,
  filterDetections,
  sortDetections,
} from '../../services/historyService';
import { HistoryStatistics } from './HistoryStatistics';
import { HistorySearch } from './HistorySearch';
import { HistoryFilters } from './HistoryFilters';
import { HistoryList } from './HistoryList';
import { HistoryViewer } from './HistoryViewer';
import { ExportMenu } from './ExportMenu';
import { DeleteDialog } from './DeleteDialog';
import { EmptyHistory } from './EmptyHistory';

const initialFilters: FiltersType = {
  damageType: 'all',
  severity: 'all',
  timeRange: 'all',
  minConfidence: 0.20,
};

export const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FiltersType>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Interactive View States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);
  
  // Delete Dialog States
  const [deleteDialogOpen, setDeleteDialogOpenOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'bulk' | 'clear'>('single');
  const [deleteTargetId, setDeleteTargetId] = useState<string>('');

  // Fetch data on mount
  const loadHistory = useCallback(async () => {
    try {
      const items = await historyService.getAllDetections();
      const statistics = await historyService.getStatistics();
      setHistoryItems(items);
      setStats(statistics);
    } catch (err) {
      console.error('Failed to load history items:', err);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Handle Search & Filter & Sort Pipeline
  const filteredAndSortedItems = useMemo(() => {
    let result = historyItems;
    result = searchDetections(result, searchQuery);
    result = filterDetections(result, filters);
    result = sortDetections(result, sortBy);
    return result;
  }, [historyItems, searchQuery, filters, sortBy]);

  // Selection handlers
  const handleSelectChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAllChange = useCallback((checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return new Set(filteredAndSortedItems.map((item) => item.id));
      } else {
        return new Set();
      }
    });
  }, [filteredAndSortedItems]);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchQuery('');
  }, []);

  // Modal handlers
  const handleViewClick = useCallback((item: HistoryItem) => {
    setActiveItem(item);
  }, []);

  const handleViewerUpdate = useCallback((updatedItem: HistoryItem) => {
    setHistoryItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    setActiveItem(updatedItem);
    // Reload stats in background
    void historyService.getStatistics().then(setStats);
  }, []);

  // Delete modal triggers
  const handleDeleteClick = useCallback((id: string) => {
    setDeleteTargetId(id);
    setDeleteType('single');
    setDeleteDialogOpenOpen(true);
  }, []);

  const handleBulkDeleteClick = useCallback(() => {
    setDeleteType('bulk');
    setDeleteDialogOpenOpen(true);
  }, []);

  const handleClearHistoryClick = useCallback(() => {
    setDeleteType('clear');
    setDeleteDialogOpenOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    try {
      if (deleteType === 'single') {
        await historyService.deleteDetection(deleteTargetId);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTargetId);
          return next;
        });
      } else if (deleteType === 'bulk') {
        // Delete selected items
        const promises = Array.from(selectedIds).map((id) =>
          historyService.deleteDetection(id)
        );
        await Promise.all(promises);
        setSelectedIds(new Set());
      } else if (deleteType === 'clear') {
        await historyService.clearHistory();
        setSelectedIds(new Set());
      }
      
      setDeleteDialogOpenOpen(false);
      setDeleteTargetId('');
      await loadHistory();
    } catch (err) {
      console.error('Delete operation failed:', err);
    }
  };

  // CSV/JSON Export logic
  const getExportData = () => {
    // If user has select items, export those. Otherwise, export filtered ones.
    if (selectedIds.size > 0) {
      return historyItems.filter((item) => selectedIds.has(item.id));
    }
    return filteredAndSortedItems;
  };

  const handleExportJSON = () => {
    const dataToExport = getExportData();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `roadguard_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const dataToExport = getExportData();
    
    const escapeCSV = (str: string | number) => {
      const stringified = String(str);
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const headers = [
      'Report ID',
      'Timestamp',
      'Date',
      'Image Filename',
      'Repair Status',
      'Detections Count',
      'Potholes Count',
      'Manholes Count',
      'Highest Severity',
      'Average Confidence (%)',
      'Latency (ms)',
      'Detections Details',
      'Official Notes'
    ];

    const rows = dataToExport.map((item) => {
      const date = new Date(item.timestamp).toISOString();
      const details = item.detections
        .map((d) => `${d.class_name} (${(d.confidence * 100).toFixed(0)}%, ${d.severity})`)
        .join('; ');

      return [
        item.id,
        item.timestamp,
        date,
        item.imageName,
        item.status,
        item.summary.total_detections,
        item.summary.pothole_count,
        item.summary.manhole_count,
        item.summary.highest_severity,
        (item.summary.average_confidence * 100).toFixed(1),
        item.summary.processing_time_ms.toFixed(0),
        details,
        item.notes
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `roadguard_history_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const getDeleteDialogMessages = () => {
    if (deleteType === 'single') {
      return {
        title: 'Delete Detection Record?',
        message: 'This will permanently remove the record and its thumbnail. This action cannot be undone.',
      };
    } else if (deleteType === 'bulk') {
      return {
        title: `Delete ${selectedIds.size} Selected Records?`,
        message: `This will permanently delete the ${selectedIds.size} selected reports. This action cannot be undone.`,
      };
    } else {
      return {
        title: 'Clear Entire Detection History?',
        message: 'Are you sure you want to completely clear all detection history and records? This will delete everything.',
      };
    }
  };

  const deleteDialogInfo = getDeleteDialogMessages();

  return (
    <div className="history-page-wrapper">
      {/* Page Header */}
      <div className="history-page-header">
        <div>
          <h2>Road Damage Detection History</h2>
          <p className="history-page-subtitle">Inspect historical AI reports, manage repair workflows, and export spreadsheet summaries.</p>
        </div>
        
        {/* Export and clear actions */}
        <div className="history-header-actions-row">
          <ExportMenu
            onExportJSON={handleExportJSON}
            onExportCSV={handleExportCSV}
            disabled={filteredAndSortedItems.length === 0}
          />
          {historyItems.length > 0 && (
            <button
              className="clear-all-history-btn"
              onClick={handleClearHistoryClick}
              type="button"
              aria-label="Clear all detection history"
            >
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* Statistics Dashboard Panel */}
      {stats && stats.totalImages > 0 && <HistoryStatistics stats={stats} />}

      {/* Filter and Search controls */}
      {historyItems.length > 0 && (
        <div className="history-search-filter-card">
          <div className="search-filter-header">
            <h3>Search & Filters</h3>
            <div className="sort-by-select-container">
              <label htmlFor="sort-select" className="sort-label">Sort By:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="sort-select-dropdown"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_confidence">Highest Confidence</option>
                <option value="lowest_confidence">Lowest Confidence</option>
                <option value="most_detections">Most Detections</option>
                <option value="least_detections">Least Detections</option>
                <option value="fastest_processing">Fastest Processing</option>
                <option value="slowest_processing">Slowest Processing</option>
              </select>
            </div>
          </div>
          <HistorySearch value={searchQuery} onChange={setSearchQuery} />
          <HistoryFilters
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>
      )}

      {/* List results */}
      {historyItems.length === 0 ? (
        <EmptyHistory isFiltered={false} />
      ) : filteredAndSortedItems.length === 0 ? (
        <EmptyHistory isFiltered={true} onClearFilters={handleResetFilters} />
      ) : (
        <HistoryList
          items={filteredAndSortedItems}
          selectedIds={selectedIds}
          onSelectChange={handleSelectChange}
          onSelectAllChange={handleSelectAllChange}
          onViewClick={handleViewClick}
          onDeleteClick={handleDeleteClick}
          onBulkDeleteClick={handleBulkDeleteClick}
        />
      )}

      {/* Detail viewer modal */}
      {activeItem && (
        <HistoryViewer
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onUpdate={handleViewerUpdate}
        />
      )}

      {/* Delete confirmation modal */}
      <DeleteDialog
        isOpen={deleteDialogOpen}
        title={deleteDialogInfo.title}
        message={deleteDialogInfo.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpenOpen(false)}
      />
    </div>
  );
};
