import React, { useState, useCallback } from 'react';
import { config } from '../../config';
import { ImageUploadCard } from './ImageUploadCard';
import { ImagePreview } from './ImagePreview';
import { LoadingOverlay } from './LoadingOverlay';
import { ErrorAlert } from './ErrorAlert';
import { DetectionSummary } from './DetectionSummary';
import { DetectionCard } from './DetectionCard';
import { DetectionTable } from './DetectionTable';
import { EmptyDetection } from './EmptyDetection';
import { DetectionImage } from './DetectionImage';

// ── Types ──────────────────────────────────────────────────────────────────

export interface DetectionResult {
  status: string;
  summary: {
    total_detections: number;
    pothole_count: number;
    manhole_count: number;
    highest_severity: string;
    average_confidence: number;
    processing_time_ms: number;
  };
  detections: Array<{
    class_id: number;
    class_name: string;
    confidence: number;
    severity: string;
    bbox: { x1: number; y1: number; x2: number; y2: number; width: number; height: number };
    area: number;
  }>;
}

interface InlineDetectionPanelProps {
  /** Card title shown in collapsed header */
  title?: string;
  /** Label for the detect button */
  detectLabel?: string;
  /** Start collapsed (default: false) */
  defaultCollapsed?: boolean;
  /**
   * Called with the latest result whenever a detection completes.
   * Useful for parent components that need to read the file/result (e.g. citizen form).
   */
  onResult?: (file: File, result: DetectionResult) => void;
  /** Called whenever a file is selected (before detection runs) */
  onFileSelected?: (file: File | null) => void;
  /** Custom callback to save report / create record from result */
  onSaveReport?: (file: File, result: DetectionResult) => Promise<void>;
  /** Text for the save report button */
  saveReportLabel?: string;
}

// ── Component ─────────────────────────────────────────────────────────────

export const InlineDetectionPanel: React.FC<InlineDetectionPanelProps> = ({
  title = '🔍 Analyze Road Image',
  detectLabel = 'Detect Road Damage',
  defaultCollapsed = false,
  onResult,
  onFileSelected,
  onSaveReport,
  saveReportLabel = 'Create Government Report',
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [minConfidence, setMinConfidence] = useState(0.20);
  const [isSavingReport, setIsSavingReport] = useState(false);

  const filteredDetections = detectionResult
    ? detectionResult.detections.filter((d) => d.confidence >= minConfidence)
    : [];

  const dynamicSummary = detectionResult
    ? {
        ...detectionResult.summary,
        total_detections: filteredDetections.length,
        pothole_count: filteredDetections.filter((d) => d.class_name.toLowerCase() === 'pothole').length,
        manhole_count: filteredDetections.filter((d) => d.class_name.toLowerCase() === 'manhole').length,
        highest_severity: filteredDetections.reduce((max, d) => {
          const order: Record<string, number> = { low: 1, medium: 2, high: 3 };
          return (order[d.severity.toLowerCase()] || 0) > (order[max.toLowerCase()] || 0)
            ? d.severity : max;
        }, 'Low'),
        average_confidence:
          filteredDetections.length > 0
            ? filteredDetections.reduce((s, d) => s + d.confidence, 0) / filteredDetections.length
            : 0,
      }
    : null;

  const handleFileSelect = useCallback((file: File) => {
    // Revoke previous object URL to avoid memory leak
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setImageUrl(url);
    setError(null);
    setDetectionResult(null);
    onFileSelected?.(file);
  }, [imageUrl, onFileSelected]);

  const handleRemove = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setSelectedFile(null);
    setImageUrl('');
    setError(null);
    setDetectionResult(null);
    onFileSelected?.(null);
  }, [imageUrl, onFileSelected]);

  const handleDetect = useCallback(async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const response = await fetch(`${config.apiBaseUrl}/api/detect`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail || 'Detection failed');
      }
      const result: DetectionResult = await response.json();
      setDetectionResult(result);
      onResult?.(selectedFile, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, onResult]);

  const handleRetry = useCallback(() => {
    setError(null);
    void handleDetect();
  }, [handleDetect]);

  const handleSave = async () => {
    if (!selectedFile || !detectionResult || !onSaveReport) return;
    setIsSavingReport(true);
    try {
      await onSaveReport(selectedFile, detectionResult);
    } catch (err) {
      console.error('Failed to save report:', err);
    } finally {
      setIsSavingReport(false);
    }
  };

  return (
    <div className="inline-detection-panel">
      {/* ── Collapsible Header ── */}
      <button
        type="button"
        className="inline-panel-header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls="inline-detection-body"
      >
        <span className="inline-panel-title">{title}</span>
        <svg
          className={`inline-panel-chevron ${collapsed ? '' : 'open'}`}
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* ── Body ── */}
      {!collapsed && (
        <div id="inline-detection-body" className="inline-panel-body">
          {isProcessing && <LoadingOverlay message="Analyzing road image…" />}

          {error && (
            <ErrorAlert
              message={error}
              onRetry={handleRetry}
              onDismiss={() => setError(null)}
            />
          )}

          {!selectedFile ? (
            <ImageUploadCard onFileSelect={handleFileSelect} disabled={isProcessing} />
          ) : (
            <div className="inline-panel-workflow">
              {!detectionResult ? (
                <ImagePreview imageUrl={imageUrl} onRemove={handleRemove} disabled={isProcessing} />
              ) : (
                <DetectionImage
                  imageUrl={imageUrl}
                  detections={filteredDetections}
                  minConfidence={minConfidence}
                  onMinConfidenceChange={setMinConfidence}
                />
              )}
              <div className="inline-panel-actions">
                {!detectionResult && (
                  <button
                    type="button"
                    className="detect-button"
                    onClick={() => void handleDetect()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Analyzing…' : detectLabel}
                  </button>
                )}
                {onSaveReport && detectionResult && (
                  <button
                    type="button"
                    className="detect-button"
                    onClick={handleSave}
                    disabled={isSavingReport}
                  >
                    {isSavingReport ? 'Saving...' : saveReportLabel}
                  </button>
                )}
                <button
                  type="button"
                  className="inline-panel-clear-btn"
                  onClick={handleRemove}
                  disabled={isProcessing}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ── Results ── */}
          {detectionResult && dynamicSummary && (
            <div className="inline-detection-results">
              <DetectionSummary summary={dynamicSummary} />

              {filteredDetections.length === 0 ? (
                <EmptyDetection />
              ) : (
                <>
                  <div className="detection-cards-section">
                    <h3 className="section-title">Detected Issues</h3>
                    <div className="detection-cards-grid">
                      {filteredDetections.map((det, i) => (
                        <DetectionCard key={i} detection={det} index={i} />
                      ))}
                    </div>
                  </div>
                  <DetectionTable detections={filteredDetections} />
                </>
              )}

              <div className="inline-panel-new-scan">
                <button
                  type="button"
                  className="new-detection-button"
                  onClick={handleRemove}
                >
                  Analyze Another Image
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineDetectionPanel;

