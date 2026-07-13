import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BoundingBox } from './BoundingBox';
import { ImageToolbar } from './ImageToolbar';
import { DetectionLegend } from './DetectionLegend';

interface DetectionImageProps {
  imageUrl: string;
  detections: Array<{
    class_id: number;
    class_name: string;
    confidence: number;
    severity: string;
    bbox: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    };
    area: number;
  }>;
  minConfidence: number;
  onMinConfidenceChange: (value: number) => void;
}

export const DetectionImage: React.FC<DetectionImageProps> = ({
  imageUrl,
  detections,
  minConfidence,
  onMinConfidenceChange,
}) => {
  // Centralized State
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [isOriginalSize, setIsOriginalSize] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightedBox, setHighlightedBox] = useState<number | null>(null);

  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const zoomLevels = [0.5, 0.6, 0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];

  // Load natural dimensions when the image loads
  const handleImageLoad = () => {
    const img = imageRef.current;
    if (img) {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
  };

  useEffect(() => {
    // Reset layout settings when a new image URL is provided
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setIsOriginalSize(false);
    setHighlightedBox(null);
  }, [imageUrl]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((prevZoom) => {
      const currentIndex = zoomLevels.findIndex(z => Math.abs(z - prevZoom) < 0.01);
      if (currentIndex !== -1 && currentIndex < zoomLevels.length - 1) {
        return zoomLevels[currentIndex + 1];
      }
      return prevZoom;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prevZoom) => {
      const currentIndex = zoomLevels.findIndex(z => Math.abs(z - prevZoom) < 0.01);
      if (currentIndex > 0) {
        return zoomLevels[currentIndex - 1];
      }
      return prevZoom;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFitScreen = useCallback(() => {
    setIsOriginalSize(false);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleOriginalSize = useCallback(() => {
    setIsOriginalSize(true);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleToggleBoxes = useCallback(() => {
    setShowBoxes(prev => !prev);
  }, []);

  const handleToggleLegend = useCallback(() => {
    setShowLegend(prev => !prev);
  }, []);

  // Fullscreen handlers
  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Panning handlers (Drag-and-click)
  const isPannable = zoom > 1.0 || isOriginalSize;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPannable) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !isPannable) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // High resolution download using canvas internally
  const handleDownload = useCallback(() => {
    const img = imageRef.current;
    if (!img || imageDimensions.width === 0) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to original image resolution
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;

    // Draw base image
    ctx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height);

    // Draw bounding boxes on canvas
    if (showBoxes) {
      detections.forEach((detection, index) => {
        const { bbox, class_name, confidence, severity } = detection;
        const isPothole = class_name.toLowerCase() === 'pothole';

        const strokeColor = isPothole ? '#ff5252' : '#00b2ff';
        const fillColor = isPothole ? 'rgba(255, 82, 82, 0.15)' : 'rgba(0, 178, 255, 0.15)';

        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = fillColor;

        let borderWidth = 2;
        ctx.setLineDash([]);
        if (severity.toLowerCase() === 'high') {
          borderWidth = 4;
        } else if (severity.toLowerCase() === 'medium') {
          ctx.setLineDash([8, 8]);
        }
        ctx.lineWidth = borderWidth;

        // Draw bbox
        ctx.strokeRect(bbox.x1, bbox.y1, bbox.width, bbox.height);
        ctx.fillRect(bbox.x1, bbox.y1, bbox.width, bbox.height);

        // Label details
        const detectionNumber = index + 1;
        const labelText = `#${detectionNumber} ${class_name.charAt(0).toUpperCase() + class_name.slice(1)} ${(confidence * 100).toFixed(0)}%`;
        
        ctx.font = 'bold 13px Inter, Arial, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const textWidth = textMetrics.width;
        const textHeight = 15;

        // Check if label fits above the box, otherwise place inside
        const labelX = bbox.x1;
        const labelY = bbox.y1 - textHeight - 6 > 0 ? bbox.y1 - textHeight - 6 : bbox.y1;

        // Draw background box for label
        ctx.fillStyle = strokeColor;
        ctx.fillRect(labelX, labelY, textWidth + 8, textHeight + 6);

        // Draw label text
        ctx.fillStyle = '#07111f'; // dark blue contrast
        ctx.fillText(labelText, labelX + 4, labelY + textHeight - 1);
      });
    }

    // Download PNG
    const timestamp = Date.now();
    const link = document.createElement('a');
    link.download = `roadguard_detection_${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [detections, showBoxes, imageDimensions]);

  // Map hover to child boxes
  const handleBoxHover = useCallback((index: number | null) => {
    setHighlightedBox(index);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`detection-image-container ${isFullscreen ? 'fullscreen' : ''}`}
    >
      <div className="detection-image-header">
        <h3 className="detection-image-title">AI Detection Overlay</h3>
        <DetectionLegend show={showLegend} />
      </div>

      <div
        className="detection-image-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isPannable ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <div
          className="detection-image-pan-wrapper"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <div
            className="detection-image-relative-container"
            style={{
              display: 'inline-block',
              position: 'relative',
              width: isOriginalSize ? `${imageDimensions.width}px` : 'auto',
              height: isOriginalSize ? `${imageDimensions.height}px` : 'auto',
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Uploaded road visualization"
              onLoad={handleImageLoad}
              className="detection-image-element"
              style={{
                display: 'block',
                width: isOriginalSize ? '100%' : 'auto',
                height: isOriginalSize ? '100%' : 'auto',
                maxWidth: isOriginalSize ? 'none' : '100%',
                maxHeight: isOriginalSize ? 'none' : '65vh',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />

            {showBoxes && detections.length > 0 && imageDimensions.width > 0 && (
              <div
                className="bounding-boxes-overlay-container"
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'auto',
                }}
              >
                {detections.map((detection, index) => (
                  <BoundingBox
                    key={index}
                    detection={detection}
                    index={index}
                    highlighted={highlightedBox === index}
                    onHover={handleBoxHover}
                    imageWidth={imageDimensions.width}
                    imageHeight={imageDimensions.height}
                    zoom={zoom}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ImageToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        isOriginalSize={isOriginalSize}
        onFitScreen={handleFitScreen}
        onOriginalSize={handleOriginalSize}
        showBoxes={showBoxes}
        onToggleBoxes={handleToggleBoxes}
        showLegend={showLegend}
        onToggleLegend={handleToggleLegend}
        isFullscreen={isFullscreen}
        onFullscreen={handleFullscreen}
        onDownload={handleDownload}
        minConfidence={minConfidence}
        onMinConfidenceChange={onMinConfidenceChange}
      />
    </div>
  );
};
