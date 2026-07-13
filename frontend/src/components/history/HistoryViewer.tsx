import React, { useState, useEffect } from 'react';
import { HistoryItem, historyService } from '../../services/historyService';
import { DetectionImage } from '../ai/DetectionImage';
import { DetectionSummary } from '../ai/DetectionSummary';
import { DetectionCard } from '../ai/DetectionCard';
import { DetectionTable } from '../ai/DetectionTable';

interface HistoryViewerProps {
  item: HistoryItem;
  onClose: () => void;
  onUpdate: (updatedItem: HistoryItem) => void;
}

export const HistoryViewer: React.FC<HistoryViewerProps> = ({
  item,
  onClose,
  onUpdate,
}) => {
  const [status, setStatus] = useState<HistoryItem['status']>(item.status);
  const [notes, setNotes] = useState(item.notes);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Local confidence threshold for HistoryViewer reuse
  const [minConfidence, setMinConfidence] = useState(0.20);

  // Sync state with item when item changes
  useEffect(() => {
    setStatus(item.status);
    setNotes(item.notes);
    setSaveSuccess(false);
  }, [item]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSaveDetails = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await historyService.updateDetection(item.id, {
        status,
        notes,
      });
      onUpdate(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update detection details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter detections locally in the viewer
  const filteredDetections = item.detections.filter((d) => d.confidence >= minConfidence);

  const dynamicSummary = {
    ...item.summary,
    total_detections: filteredDetections.length,
    pothole_count: filteredDetections.filter((d) => d.class_name.toLowerCase() === 'pothole').length,
    manhole_count: filteredDetections.filter((d) => d.class_name.toLowerCase() === 'manhole').length,
    highest_severity: filteredDetections.reduce((max, d) => {
      const severityOrder: Record<string, number> = { low: 1, medium: 2, high: 3 };
      const dSev = d.severity.toLowerCase();
      const maxSev = max.toLowerCase();
      return (severityOrder[dSev] || 0) > (severityOrder[maxSev] || 0) ? d.severity : max;
    }, 'Low'),
    average_confidence: filteredDetections.length > 0
      ? filteredDetections.reduce((sum, d) => sum + d.confidence, 0) / filteredDetections.length
      : 0,
  };

  const formattedDate = new Date(item.timestamp).toLocaleString();

  return (
    <div className="dialog-backdrop viewer-backdrop" onClick={onClose}>
      <div
        className="dialog-container history-viewer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="viewer-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="viewer-header">
          <div className="viewer-title-group">
            <h2 id="viewer-title" className="viewer-filename">{item.imageName}</h2>
            <span className="viewer-timestamp">{formattedDate}</span>
          </div>
          <button
            className="viewer-close-btn"
            onClick={onClose}
            type="button"
            aria-label="Close details viewer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Grid Split */}
        <div className="viewer-content-grid">
          {/* Left panel: Visualization + Results */}
          <div className="viewer-main-panel">
            {/* Visualizer */}
            <DetectionImage
              imageUrl={item.thumbnail}
              detections={filteredDetections}
              minConfidence={minConfidence}
              onMinConfidenceChange={setMinConfidence}
            />

            {/* Dynamic Summary Cards */}
            <DetectionSummary summary={dynamicSummary} />

            {/* Details Section */}
            {filteredDetections.length === 0 ? (
              <div className="viewer-empty-detections-box">
                <p className="empty-msg">No detections above the confidence filter threshold.</p>
              </div>
            ) : (
              <>
                <div className="viewer-cards-section">
                  <h3 className="viewer-section-title">Detected Hazards</h3>
                  <div className="detection-cards-grid">
                    {filteredDetections.map((detection, index) => (
                      <DetectionCard
                        key={index}
                        detection={detection}
                        index={index}
                      />
                    ))}
                  </div>
                </div>

                <DetectionTable detections={filteredDetections} />
              </>
            )}
          </div>

          {/* Right panel: Management Form */}
          <div className="viewer-sidebar-panel">
            <div className="sidebar-card">
              <h3 className="sidebar-card-title">Manage Hazard Report</h3>
              <p className="sidebar-desc">Update repair status and notes for municipal records.</p>
              
              <div className="sidebar-form-group">
                <label className="sidebar-label" htmlFor="report-status">Repair Status</label>
                <select
                  id="report-status"
                  className="sidebar-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as HistoryItem['status'])}
                >
                  <option value="active">Active (Pending Repair)</option>
                  <option value="repaired">Verified Repaired</option>
                  <option value="ignored">Ignored (False Positive)</option>
                </select>
              </div>

              <div className="sidebar-form-group">
                <label className="sidebar-label" htmlFor="report-notes">Official Notes</label>
                <textarea
                  id="report-notes"
                  className="sidebar-textarea"
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record inspections, contractor assignments, patch repair details, or verification dates here..."
                />
              </div>

              <div className="sidebar-actions">
                <button
                  className={`sidebar-save-btn ${saveSuccess ? 'success' : ''}`}
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  type="button"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : saveSuccess ? (
                    <span className="success-flex">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Changes Saved!</span>
                    </span>
                  ) : (
                    <span>Update Report Details</span>
                  )}
                </button>
              </div>
            </div>
            
            <div className="sidebar-info-card">
              <h4 className="sidebar-info-title">Report Metadata</h4>
              <div className="info-row">
                <span className="info-label">Report ID:</span>
                <span className="info-value monospace">{item.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Original Filename:</span>
                <span className="info-value truncate-val" title={item.imageName}>{item.imageName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Original Detections:</span>
                <span className="info-value">{item.summary.total_detections}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Highest Severity:</span>
                <span className="info-value capitalize">{item.summary.highest_severity}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Initial Avg Confidence:</span>
                <span className="info-value">{(item.summary.average_confidence * 100).toFixed(1)}%</span>
              </div>
              {item.gps && (
                <div className="info-row">
                  <span className="info-label">GPS Location:</span>
                  <span className="info-value truncate-val" style={{ maxWidth: '160px' }}>
                    {typeof item.gps === 'string'
                      ? item.gps
                      : `${item.gps.latitude.toFixed(5)}, ${item.gps.longitude.toFixed(5)}`}
                  </span>
                </div>
              )}
              {item.estimatedDistance !== undefined && (
                <div className="info-row">
                  <span className="info-label">Est. Distance:</span>
                  <span className="info-value">≈ {item.estimatedDistance}m</span>
                </div>
              )}
              {item.modelName && (
                <div className="info-row">
                  <span className="info-label">AI Model:</span>
                  <span className="info-value">{item.modelName}</span>
                </div>
              )}
              {item.inferenceTime !== undefined && (
                <div className="info-row">
                  <span className="info-label">Inference Time:</span>
                  <span className="info-value">{item.inferenceTime} ms</span>
                </div>
              )}
            </div>

            <div className="sidebar-card evidence-verification-card">
              <h4 className="sidebar-card-title" style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                Evidence Verification
              </h4>
              <div className="verification-badges-grid">
                <div className={`verification-badge ${item.gps && item.gps !== 'GPS Unavailable' ? 'verified' : 'unverified'}`}>
                  <span className="badge-icon">{item.gps && item.gps !== 'GPS Unavailable' ? '✓' : '✗'}</span>
                  <span className="badge-text">GPS Geotagged</span>
                </div>
                <div className="verification-badge verified">
                  <span className="badge-icon">✓</span>
                  <span className="badge-text">Image Captured</span>
                </div>
              </div>

              <div className="tooltip-divider" style={{ margin: '0.75rem 0' }} />

              {item.gps && typeof item.gps !== 'string' && (
                <div className="info-row">
                  <span className="info-label">GPS Accuracy:</span>
                  <span className="info-value">± {item.gps.accuracy.toFixed(1)}m</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Confidence Score:</span>
                <span className="info-value font-semibold">
                  {(item.summary.average_confidence * 100).toFixed(0)}%
                </span>
              </div>
              {item.sessionId && (
                <div className="info-row">
                  <span className="info-label">Session ID:</span>
                  <span className="info-value truncate-val" style={{ maxWidth: '140px' }} title={item.sessionId}>
                    {item.sessionId}
                  </span>
                </div>
              )}
              {item.captureReason && (
                <div className="info-row">
                  <span className="info-label">Capture Reason:</span>
                  <span className="info-value font-medium capitalize">
                    {item.captureReason.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
