import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { HistoryItem } from '../../services/historyService';
import { historyService, searchDetections } from '../../services/historyService';
import { toGovStatus } from './StatusBadge';
import { DashboardFilters, DEFAULT_GOV_FILTERS, type GovFilters } from './DashboardFilters';
import { DashboardSearch } from './DashboardSearch';
import { DetectionMarker } from './DetectionMarker';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { NoMapData } from './NoMapData';
import { DetectionDetailsModal } from './DetectionDetailsModal';

// Fix default leaflet marker icon resolution in Vite bundling
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
});

// Re‑use the same filter logic as GovernmentDashboard (copied here for simplicity)
function applyGovFilters(items: HistoryItem[], filters: GovFilters): HistoryItem[] {
  const now = Date.now();
  const todayMs = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  const weekMs = now - 7 * 24 * 60 * 60 * 1000;
  const monthMs = now - 30 * 24 * 60 * 60 * 1000;

  return items.filter(item => {
    // Damage type
    if (filters.damageType === 'pothole' && item.summary.pothole_count === 0) return false;
    if (filters.damageType === 'manhole' && item.summary.manhole_count === 0) return false;
    // Severity
    if (filters.severity !== 'all' && item.summary.highest_severity.toLowerCase() !== filters.severity) return false;
    // Repair status (gov ↔ internal)
    if (filters.status !== 'all' && toGovStatus(item.status) !== filters.status) return false;
    // Time range
    if (filters.timeRange === 'today' && item.timestamp < todayMs) return false;
    if (filters.timeRange === 'week' && item.timestamp < weekMs) return false;
    if (filters.timeRange === 'month' && item.timestamp < monthMs) return false;
    // Source filter
    if (filters.source !== 'All') {
      if (filters.source === 'AI' && item.reportType !== 'ai') return false;
      if (filters.source === 'Citizen' && item.reportType !== 'citizen') return false;
    }
    return true;
  });
}

/** Small statistics cards used on the map page */
const MapStatsCard: React.FC<{ label: string; value: number | string; icon: string }> = ({ label, value, icon }) => (
  <div className="gov-kpi-card gov-kpi-card--subtle" aria-label={label}>
    <div className="gov-kpi-icon" aria-hidden="true">{icon}</div>
    <div className="gov-kpi-body">
      <span className="gov-kpi-value gov-kpi-value--sm">{value}</span>
      <span className="gov-kpi-label">{label}</span>
    </div>
  </div>
);

export const GovernmentMap: React.FC = () => {
  const [allItems, setAllItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<GovFilters>(DEFAULT_GOV_FILTERS);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await historyService.getAllDetections();
      setAllItems(data);
    } catch (e) {
      console.error('Failed to load detections', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // Filtered items that have valid GPS coordinates
  const filteredItems = useMemo(() => {
    const afterFilters = applyGovFilters(allItems, filters);
    const withGps = afterFilters.filter(i => i.gps && typeof (i.gps as any).latitude === 'number' && typeof (i.gps as any).longitude === 'number');
    return searchDetections(withGps, search);
  }, [allItems, filters, search]);

  const visibleCount = filteredItems.length;
  const highCount = filteredItems.filter(i => i.summary.highest_severity.toLowerCase() === 'high').length;
  const pendingCount = filteredItems.filter(i => toGovStatus(i.status) === 'pending').length;
  const completedCount = filteredItems.filter(i => toGovStatus(i.status) === 'completed').length;

  return (
    <div className="gov-map-page animate-fadeIn">
      {/* Header */}
      <div className="gov-page-header">
        <div>
          <h1 className="gov-page-title">Road Damage Detection Map</h1>
          <p className="gov-page-subtitle">
            Visualise all detections with GPS coordinates. Use filters to narrow the view.
          </p>
        </div>
        {/* Refresh button similar to dashboard */}
        <button
          type="button"
          className="gov-refresh-btn"
          onClick={fetchAll}
          disabled={loading}
          aria-label="Refresh detection records"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Statistics floating cards */}
      <div className="gov-map-stats">
        <MapStatsCard label="Visible Reports" value={visibleCount} icon="📍" />
        <MapStatsCard label="High Severity" value={highCount} icon="🔴" />
        <MapStatsCard label="Pending Repairs" value={pendingCount} icon="⏳" />
        <MapStatsCard label="Completed Repairs" value={completedCount} icon="✅" />
      </div>

      {/* Filters toolbar */}
      <div className="gov-toolbar">
        <DashboardSearch value={search} onChange={setSearch} />
        <DashboardFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Map container */}
      <div className="gov-map-wrapper">
        {loading && (
          <div className="gov-loading-spinner" role="status" aria-live="polite">
            <div className="gov-spinner" aria-hidden="true" />
            <span>Loading map data…</span>
          </div>
        )}
        {!loading && filteredItems.length === 0 && <NoMapData />}
        {!loading && filteredItems.length > 0 && (
          <MapContainer
            center={[0, 0] as any}
            zoom={2}
            scrollWheelZoom={true}
            style={{ height: '70vh', width: '100%' }}
            className="gov-leaflet-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredItems.map(item => (
              <DetectionMarker key={item.id} item={item} onViewDetails={setSelectedItem} />
            ))}
            <MapControls markers={filteredItems} />
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <MapLegend />

      {/* Details Modal */}
      {selectedItem && (
        <DetectionDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdated={() => fetchAll()}
        />
      )}
    </div>
  );
};

export default GovernmentMap;
