import React from 'react';

interface ImageToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  isOriginalSize: boolean;
  onFitScreen: () => void;
  onOriginalSize: () => void;
  showBoxes: boolean;
  onToggleBoxes: () => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  isFullscreen: boolean;
  onFullscreen: () => void;
  onDownload: () => void;
  minConfidence: number;
  onMinConfidenceChange: (value: number) => void;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isOriginalSize,
  onFitScreen,
  onOriginalSize,
  showBoxes,
  onToggleBoxes,
  showLegend,
  onToggleLegend,
  isFullscreen,
  onFullscreen,
  onDownload,
  minConfidence,
  onMinConfidenceChange,
}) => {
  const zoomLevels = [0.5, 0.6, 0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];
  const currentZoomIndex = zoomLevels.findIndex(z => Math.abs(z - zoom) < 0.01);

  const canZoomIn = currentZoomIndex < zoomLevels.length - 1;
  const canZoomOut = currentZoomIndex > 0;

  return (
    <div className="image-toolbar" aria-label="Image controls">
      {/* Zoom controls */}
      <div className="toolbar-section">
        <span className="toolbar-section-label">View</span>
        <div className="toolbar-group">
          <button
            className="toolbar-button"
            onClick={onZoomOut}
            disabled={!canZoomOut}
            title="Zoom Out"
            type="button"
            aria-label="Zoom out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <span className="zoom-level-badge">{Math.round(zoom * 100)}%</span>

          <button
            className="toolbar-button"
            onClick={onZoomIn}
            disabled={!canZoomIn}
            title="Zoom In"
            type="button"
            aria-label="Zoom in"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <button
            className="toolbar-button"
            onClick={onResetZoom}
            title="Reset Zoom to 100%"
            type="button"
            aria-label="Reset zoom"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
          </button>
        </div>

        <div className="toolbar-group layout-modes">
          <button
            className={`toolbar-button ${!isOriginalSize ? 'active' : ''}`}
            onClick={onFitScreen}
            title="Fit to Screen"
            type="button"
            aria-label="Fit image to screen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M17 9l-5 5-2-2" />
            </svg>
            <span className="button-text">Fit</span>
          </button>

          <button
            className={`toolbar-button ${isOriginalSize ? 'active' : ''}`}
            onClick={onOriginalSize}
            title="Original 1:1 Size"
            type="button"
            aria-label="Show original image size"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8" />
              <path d="M9 12h6" />
            </svg>
            <span className="button-text">1:1</span>
          </button>
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Visibility toggles */}
      <div className="toolbar-section">
        <span className="toolbar-section-label">Overlays</span>
        <div className="toolbar-group">
          <button
            className={`toolbar-button ${showBoxes ? 'active' : ''}`}
            onClick={onToggleBoxes}
            title="Toggle Bounding Boxes"
            type="button"
            aria-label="Toggle bounding boxes"
            aria-pressed={showBoxes}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          </button>

          <button
            className={`toolbar-button ${showLegend ? 'active' : ''}`}
            onClick={onToggleLegend}
            title="Toggle Legend"
            type="button"
            aria-label="Toggle legend"
            aria-pressed={showLegend}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M12 4h9" />
              <path d="M12 12h9" />
              <path d="M3 4h2v2H3z" />
              <path d="M3 12h2v2H3z" />
              <path d="M3 20h2v2H3z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Action controls */}
      <div className="toolbar-section">
        <span className="toolbar-section-label">Actions</span>
        <div className="toolbar-group">
          <button
            className={`toolbar-button ${isFullscreen ? 'active' : ''}`}
            onClick={onFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            type="button"
            aria-label="Toggle fullscreen"
            aria-pressed={isFullscreen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>

          <button
            className="toolbar-button download-btn"
            onClick={onDownload}
            title="Download Annotated Image"
            type="button"
            aria-label="Download annotated image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Confidence Filter Slider */}
      <div className="toolbar-section slider-section">
        <div className="slider-label-group">
          <span className="toolbar-section-label">Confidence Threshold</span>
          <span className="confidence-value-label">{Math.round(minConfidence * 100)}%</span>
        </div>
        <div className="slider-input-container">
          <span className="slider-limit">20%</span>
          <input
            type="range"
            min="0.20"
            max="0.95"
            step="0.01"
            value={minConfidence}
            onChange={(e) => onMinConfidenceChange(parseFloat(e.target.value))}
            className="confidence-slider"
            aria-label="Filter detections by minimum confidence threshold"
          />
          <span className="slider-limit">95%</span>
        </div>
      </div>
    </div>
  );
};
