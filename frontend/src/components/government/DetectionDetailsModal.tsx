import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { HistoryItem } from '../../services/historyService';
import { historyService } from '../../services/historyService';
import { StatusBadge } from './StatusBadge';
import { StatusSelector } from './StatusSelector';
import { toGovStatus, GOV_STATUS_LABELS } from './StatusBadge';

interface DetectionDetailsModalProps {
  item: HistoryItem;
  onClose: () => void;
  onUpdated: (updated: HistoryItem) => void;
}

const formatGPS = (gps: HistoryItem['gps']) => {
  if (!gps || gps === 'GPS Unavailable') return 'GPS Unavailable';
  return `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)} (±${gps.accuracy.toFixed(0)}m)`;
};

export const DetectionDetailsModal: React.FC<DetectionDetailsModalProps> = ({
  item, onClose, onUpdated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [notes, setNotes] = useState(item.notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);

  // Draw bounding boxes onto canvas overlay
  const drawBoxes = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    canvas.width = img.naturalWidth || img.offsetWidth;
    canvas.height = img.naturalHeight || img.offsetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width;
    const scaleY = canvas.height;

    currentItem.detections.forEach((det) => {
      const { x1, y1, width: bw, height: bh } = det.bbox;

      const color = det.severity.toLowerCase() === 'high'
        ? '#ff5252'
        : det.severity.toLowerCase() === 'medium'
        ? '#ff9c3c'
        : '#73e19f';

      // Bounding box rectangle
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.strokeRect(x1, y1, bw, bh);

      // Label background
      const label = `${det.class_name} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 12px monospace';
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.shadowBlur = 0;
      const labelY = y1 > 20 ? y1 - 2 : y1 + bh + 16;
      ctx.fillRect(x1, labelY - 14, textWidth + 8, 18);

      // Label text
      ctx.fillStyle = '#050b14';
      ctx.fillText(label, x1 + 4, labelY);
    });
  }, [currentItem.detections]);

  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      img.onload = drawBoxes;
      if (img.complete) drawBoxes();
    }
  }, [drawBoxes]);

  // Trap focus inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const updated = await historyService.updateDetection(currentItem.id, { notes });
      setCurrentItem(updated);
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdated = (updated: HistoryItem) => {
    setCurrentItem(updated);
    onUpdated(updated);
  };

  const damageType = currentItem.summary.pothole_count > 0
    ? 'Pothole'
    : currentItem.summary.manhole_count > 0
    ? 'Manhole'
    : 'Unknown';

  return (
    <div
      className="gov-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Detection details"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="gov-modal-panel">
        {/* Modal Header */}
        <div className="gov-modal-header">
          <div>
            <h2 className="gov-modal-title">Detection Report</h2>
            <p className="gov-modal-subtitle">
              {new Date(currentItem.timestamp).toLocaleString()} &nbsp;·&nbsp; {currentItem.imageName}
            </p>
          </div>
          <button
            type="button"
            className="gov-modal-close"
            onClick={onClose}
            aria-label="Close detection details modal"
          >
            ✕
          </button>
        </div>

        <div className="gov-modal-body">
          {/* Left: Image with bbox canvas */}
          <div className="gov-modal-image-col">
            <div className="gov-modal-img-container">
              {currentItem.thumbnail ? (
                <>
                  <img
                    ref={imgRef}
                    src={currentItem.thumbnail}
                    alt="Detection evidence"
                    className="gov-modal-img"
                    onLoad={drawBoxes}
                  />
                  <canvas
                    ref={canvasRef}
                    className="gov-modal-canvas-overlay"
                    aria-hidden="true"
                  />
                </>
              ) : (
                <div className="gov-modal-no-image">
                  <span aria-hidden="true">📷</span>
                  <p>No image captured</p>
                </div>
              )}
            </div>

            {/* Detections list */}
            <div className="gov-modal-detections-list">
              <h4 className="gov-section-heading">Detected Objects ({currentItem.detections.length})</h4>
              {currentItem.detections.length === 0 ? (
                <p className="gov-muted-text">No objects detected in this frame.</p>
              ) : (
                currentItem.detections.map((det, idx) => (
                  <div key={idx} className="gov-det-item">
                    <span className="gov-det-class">{det.class_name}</span>
                    <span className={`gov-severity-chip sev-${det.severity.toLowerCase()}`}>
                      {det.severity}
                    </span>
                    <span className="gov-det-conf">
                      {(det.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Metadata + controls */}
          <div className="gov-modal-meta-col">
            {/* Repair Status control */}
            <div className="gov-modal-section">
              <h4 className="gov-section-heading">Repair Status</h4>
              <StatusSelector item={currentItem} onUpdated={handleStatusUpdated} />
              <StatusBadge status={currentItem.status} size="md" />
            </div>

            {/* GPS */}
            <div className="gov-modal-section">
              <h4 className="gov-section-heading">GPS Coordinates</h4>
              <p className="gov-meta-value">{formatGPS(currentItem.gps)}</p>
            </div>

            {/* Summary stats */}
            <div className="gov-modal-section">
              <h4 className="gov-section-heading">Detection Summary</h4>
              <div className="gov-meta-grid">
                <div className="gov-meta-item">
                  <span className="gov-meta-label">Damage Type</span>
                  <span className="gov-meta-value">{damageType}</span>
                </div>
                <div className="gov-meta-item">
                  <span className="gov-meta-label">Severity</span>
                  <span className={`gov-severity-chip sev-${currentItem.summary.highest_severity.toLowerCase()}`}>
                    {currentItem.summary.highest_severity}
                  </span>
                </div>
                <div className="gov-meta-item">
                  <span className="gov-meta-label">Confidence</span>
                  <span className="gov-meta-value">
                    {(currentItem.summary.average_confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="gov-meta-item">
                  <span className="gov-meta-label">Total Detections</span>
                  <span className="gov-meta-value">{currentItem.summary.total_detections}</span>
                </div>
                {currentItem.estimatedDistance && (
                  <div className="gov-meta-item">
                    <span className="gov-meta-label">Est. Distance</span>
                    <span className="gov-meta-value">≈ {currentItem.estimatedDistance}m</span>
                  </div>
                )}
              </div>
            </div>

            {/* Session metadata */}
            <div className="gov-modal-section">
              <h4 className="gov-section-heading">Session Metadata</h4>
              <div className="gov-meta-grid">
                {currentItem.sessionId && (
                  <div className="gov-meta-item gov-meta-item--full">
                    <span className="gov-meta-label">Session ID</span>
                    <span className="gov-meta-value gov-id-mono">{currentItem.sessionId}</span>
                  </div>
                )}
                {currentItem.captureReason && (
                  <div className="gov-meta-item">
                    <span className="gov-meta-label">Capture Reason</span>
                    <span className="gov-meta-value">{currentItem.captureReason.replace(/_/g, ' ')}</span>
                  </div>
                )}
                {currentItem.modelName && (
                  <div className="gov-meta-item">
                    <span className="gov-meta-label">AI Model</span>
                    <span className="gov-meta-value">{currentItem.modelName}</span>
                  </div>
                )}
                {currentItem.inferenceTime != null && (
                  <div className="gov-meta-item">
                    <span className="gov-meta-label">Inference Time</span>
                    <span className="gov-meta-value">{currentItem.inferenceTime}ms</span>
                  </div>
                )}
                {currentItem.deviceName && (
                  <div className="gov-meta-item gov-meta-item--full">
                    <span className="gov-meta-label">Camera Device</span>
                    <span className="gov-meta-value">{currentItem.deviceName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Repair Notes textarea */}
            <div className="gov-modal-section">
              <h4 className="gov-section-heading">Repair Notes</h4>
              <textarea
                className="gov-notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add repair notes, officer assignment, work order number…"
                aria-label="Repair notes"
              />
              <button
                type="button"
                className="gov-save-notes-btn"
                onClick={handleSaveNotes}
                disabled={saving}
                aria-label="Save repair notes"
              >
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionDetailsModal;
