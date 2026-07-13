import React from 'react';
import type { HistoryItem } from '../../services/historyService';
import { StatusBadge } from './StatusBadge';
import { StatusSelector } from './StatusSelector';

const PAGE_SIZE = 15;

interface DetectionTableProps {
  items: HistoryItem[];
  onView: (item: HistoryItem) => void;
  onDelete: (item: HistoryItem) => void;
  onUpdated: (updated: HistoryItem) => void;
}

const getSeverityClass = (sev: string) => {
  switch (sev.toLowerCase()) {
    case 'high': return 'sev-high';
    case 'medium': return 'sev-medium';
    case 'low': return 'sev-low';
    default: return 'sev-none';
  }
};

const formatGPS = (gps: HistoryItem['gps']) => {
  if (!gps || gps === 'GPS Unavailable') return '—';
  return `${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`;
};

export const DetectionTable: React.FC<DetectionTableProps> = React.memo(({
  items, onView, onDelete, onUpdated,
}) => {
  const [page, setPage] = React.useState(0);
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to page 0 when items change (filter/search applied)
  React.useEffect(() => { setPage(0); }, [items.length]);

  return (
    <div className="gov-table-wrapper">
      <div className="gov-table-scroll" role="region" aria-label="Detection records table">
        <table className="gov-table" aria-label="Road damage detection records">
          <thead>
            <tr>
              <th scope="col">Thumbnail</th>
              <th scope="col">Detection ID</th>
              <th scope="col">Date &amp; Time</th>
              <th scope="col">GPS</th>
              <th scope="col">Damage Type</th>
              <th scope="col">Severity</th>
              <th scope="col">Confidence</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item) => {
              const damageType = item.summary.pothole_count > 0
                ? 'Pothole'
                : item.summary.manhole_count > 0
                ? 'Manhole'
                : 'Unknown';

              return (
                <tr key={item.id} className="gov-table-row">
                  {/* Thumbnail */}
                  <td className="gov-table-thumb-cell">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={`Thumbnail for ${item.imageName}`}
                        className="gov-table-thumbnail"
                        loading="lazy"
                      />
                    ) : (
                      <div className="gov-table-no-thumb" aria-label="No thumbnail">📷</div>
                    )}
                  </td>

                  {/* Detection ID */}
                  <td className="gov-table-id-cell">
                    <span className="gov-id-mono" title={item.id}>
                      {item.id.slice(0, 16)}…
                    </span>
                  </td>

                  {/* Date & Time */}
                  <td>
                    <span className="gov-datetime-primary">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <br />
                    <span className="gov-datetime-secondary">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </td>

                  {/* GPS */}
                  <td>
                    <span className="gov-gps-text">{formatGPS(item.gps)}</span>
                  </td>

                  {/* Damage Type */}
                  <td>
                    <span className="gov-damage-chip">{damageType}</span>
                  </td>

                  {/* Severity */}
                  <td>
                    <span className={`gov-severity-chip ${getSeverityClass(item.summary.highest_severity)}`}>
                      {item.summary.highest_severity || 'N/A'}
                    </span>
                  </td>

                  {/* Confidence */}
                  <td>
                    <span className="gov-conf-value">
                      {(item.summary.average_confidence * 100).toFixed(0)}%
                    </span>
                  </td>

                  {/* Status - inline selector */}
                  <td>
                    <StatusSelector item={item} onUpdated={onUpdated} />
                  </td>

                  {/* Actions */}
                  <td className="gov-actions-cell">
                    <button
                      type="button"
                      className="gov-action-btn gov-action-view"
                      onClick={() => onView(item)}
                      aria-label={`View details for ${item.imageName}`}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="gov-action-btn gov-action-delete"
                      onClick={() => onDelete(item)}
                      aria-label={`Delete detection ${item.id}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="gov-table-pagination" role="navigation" aria-label="Table pagination">
          <button
            type="button"
            className="gov-page-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Previous page"
          >
            ‹ Prev
          </button>
          <span className="gov-page-info">
            Page {page + 1} of {totalPages} &nbsp;·&nbsp; {items.length} records
          </span>
          <button
            type="button"
            className="gov-page-btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            aria-label="Next page"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
});

DetectionTable.displayName = 'DetectionTable';
export default DetectionTable;
