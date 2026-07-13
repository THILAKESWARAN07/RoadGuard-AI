import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { historyService, HistoryItem, searchDetections, compressImage } from '../../services/historyService';
import { toGovStatus } from './StatusBadge';
import type { GovFilters } from './DashboardFilters';
import { DEFAULT_GOV_FILTERS, DashboardFilters } from './DashboardFilters';
import { DashboardSearch } from './DashboardSearch';
import { DashboardCards } from './DashboardCards';
import { DetectionTable } from './DetectionTable';
import { DetectionDetailsModal } from './DetectionDetailsModal';
import { EmptyDashboard } from './EmptyDashboard';
import { InlineDetectionPanel } from '../ai/InlineDetectionPanel';

// Apply government-specific filters on top of the historyService items
function applyGovFilters(items: HistoryItem[], filters: GovFilters): HistoryItem[] {
  const now = Date.now();
  const todayMs = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  const weekMs = now - 7 * 24 * 60 * 60 * 1000;
  const monthMs = now - 30 * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    // Damage Type
    if (filters.damageType === 'pothole' && item.summary.pothole_count === 0) return false;
    if (filters.damageType === 'manhole' && item.summary.manhole_count === 0) return false;

    // Severity
    if (filters.severity !== 'all') {
      if (item.summary.highest_severity.toLowerCase() !== filters.severity) return false;
    }

    // Repair Status
    if (filters.status !== 'all') {
      if (toGovStatus(item.status) !== filters.status) return false;
    }

    // Time Range
    // Time Range
    if (filters.timeRange === 'today' && item.timestamp < todayMs) return false;
    if (filters.timeRange === 'week'  && item.timestamp < weekMs)  return false;
    if (filters.timeRange === 'month' && item.timestamp < monthMs) return false;

    // Source
    if (filters.source !== 'All') {
      if (filters.source === 'AI' && item.reportType !== 'ai') return false;
      if (filters.source === 'Citizen' && item.reportType !== 'citizen') return false;
    }

    return true;
  });
}

export const GovernmentDashboard: React.FC = () => {
  const [allItems, setAllItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<GovFilters>(DEFAULT_GOV_FILTERS);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await historyService.getAllDetections();
      setAllItems(data);
    } catch (err) {
      console.error('Failed to load detections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // Memoized filtering + searching pipeline
  const filteredItems = useMemo(() => {
    const afterFilters = applyGovFilters(allItems, filters);
    return searchDetections(afterFilters, search);
  }, [allItems, filters, search]);

  const hasActiveFilters = search.trim() !== '' ||
    filters.damageType !== 'all' ||
    filters.severity !== 'all' ||
    filters.status !== 'all' ||
    filters.timeRange !== 'all';

  const handleReset = useCallback(() => {
    setSearch('');
    setFilters(DEFAULT_GOV_FILTERS);
  }, []);

  const handleUpdated = useCallback((updated: HistoryItem) => {
    setAllItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
    if (selectedItem?.id === updated.id) setSelectedItem(updated);
  }, [selectedItem]);

  const handleDelete = useCallback(async (item: HistoryItem) => {
    if (deleteConfirmId !== item.id) {
      setDeleteConfirmId(item.id);
      return;
    }
    try {
      await historyService.deleteDetection(item.id);
      setAllItems((prev) => prev.filter((i) => i.id !== item.id));
      if (selectedItem?.id === item.id) setSelectedItem(null);
    } catch (err) {
      console.error('Failed to delete detection:', err);
    } finally {
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, selectedItem]);

  const handleSaveReport = useCallback(async (file: File, result: any) => {
    try {
      const thumbnailBase64 = await compressImage(file);
      await historyService.saveDetection({
        imageName: file.name,
        thumbnail: thumbnailBase64,
        summary: result.summary,
        detections: result.detections,
      });
      await fetchAll();
    } catch (err) {
      console.error('Failed to create government report from result:', err);
    }
  }, [fetchAll]);

  return (
    <div className="gov-dashboard-page animate-fadeIn">
      {/* Page Header */}
      <div className="gov-page-header">
        <div>
          <h1 className="gov-page-title">Government Road Damage Dashboard</h1>
          <p className="gov-page-subtitle">
            Monitor, search, filter, and manage pavement damage reports captured by RoadGuard AI.
          </p>
        </div>
        <button
          type="button"
          className="gov-refresh-btn"
          onClick={fetchAll}
          aria-label="Refresh detection records"
          disabled={loading}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* KPI Summary Cards — based on ALL items (unfiltered) */}
      <DashboardCards items={allItems} />

      {/* Government AI Analysis Utility — collapsible */}
      <div className="gov-inline-detection-wrapper">
        <InlineDetectionPanel
          title="🔍 Analyze New Road Image"
          detectLabel="Run AI Detection"
          defaultCollapsed={true}
          onSaveReport={handleSaveReport}
          saveReportLabel="Create Government Report"
        />
      </div>

      {/* Search + Filters toolbar */}
      <div className="gov-toolbar">
        <DashboardSearch value={search} onChange={setSearch} />
        <DashboardFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Results count row */}
      {!loading && (
        <p className="gov-results-count">
          Showing <strong>{filteredItems.length}</strong> of <strong>{allItems.length}</strong> records
          {hasActiveFilters && ' (filtered)'}
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="gov-loading-spinner" role="status" aria-live="polite">
          <div className="gov-spinner" aria-hidden="true" />
          <span>Loading detection records…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredItems.length === 0 && (
        <EmptyDashboard hasFilters={hasActiveFilters} onReset={handleReset} />
      )}

      {/* Detection Table */}
      {!loading && filteredItems.length > 0 && (
        <DetectionTable
          items={filteredItems}
          onView={setSelectedItem}
          onDelete={handleDelete}
          onUpdated={handleUpdated}
        />
      )}

      {/* Delete confirmation notice */}
      {deleteConfirmId && (
        <div className="gov-delete-toast" role="alert" aria-live="assertive">
          <span>⚠️ Click Delete again to confirm permanent deletion.</span>
          <button type="button" onClick={() => setDeleteConfirmId(null)} className="gov-toast-dismiss">
            Cancel
          </button>
        </div>
      )}

      {/* Details Modal */}
      {selectedItem && (
        <DetectionDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
};

export default GovernmentDashboard;
