import React, { useState } from 'react';
import { config } from '../config';
import { ImageUploadCard } from '../components/ai/ImageUploadCard';
import { ImagePreview } from '../components/ai/ImagePreview';
import { LoadingOverlay } from '../components/ai/LoadingOverlay';
import { ErrorAlert } from '../components/ai/ErrorAlert';
import { DetectionSummary } from '../components/ai/DetectionSummary';
import { DetectionCard } from '../components/ai/DetectionCard';
import { DetectionTable } from '../components/ai/DetectionTable';
import { EmptyDetection } from '../components/ai/EmptyDetection';
import { DetectionImage } from '../components/ai/DetectionImage';
import { historyService, compressImage } from '../services/historyService';

interface DetectionResponse {
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
}

export const AIDetectionPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResponse | null>(null);
  const [minConfidence, setMinConfidence] = useState(0.20);

  // Filter detections based on confidence threshold slider
  const filteredDetections = detectionResult
    ? detectionResult.detections.filter((d) => d.confidence >= minConfidence)
    : [];

  // Compute dynamic summary metrics based on filtered detections
  const dynamicSummary = detectionResult
    ? {
        ...detectionResult.summary,
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
      }
    : null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setDetectionResult(null);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImageUrl('');
    setError(null);
    setDetectionResult(null);
  };

  const handleDetect = async () => {
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
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Detection failed');
      }

      const result: DetectionResponse = await response.json();
      setDetectionResult(result);
      
      // Log the result for debugging (will be displayed in Part 5.2)
      console.log('Detection result:', result);

      // Async save to history list (non-blocking)
      try {
        const compressedBase64 = await compressImage(selectedFile);
        await historyService.saveDetection({
          imageName: selectedFile.name,
          thumbnail: compressedBase64,
          summary: result.summary,
          detections: result.detections,
        });
        console.log('Successfully saved detection to history.');
      } catch (historyErr) {
        console.error('Failed to save detection to history:', historyErr);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleDetect();
  };

  const handleDismissError = () => {
    setError(null);
  };

  return (
    <div className="ai-detection-page">
      <div className="page-header">
        <h1>AI Road Damage Detection</h1>
        <p>Upload a road image to detect potholes and manholes using our AI model</p>
      </div>

      <div className="detection-container">
        {isProcessing && <LoadingOverlay />}

        {error && (
          <ErrorAlert 
            message={error} 
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
        )}

        {!selectedFile ? (
          <ImageUploadCard 
            onFileSelect={handleFileSelect}
            disabled={isProcessing}
          />
        ) : (
          <div className="detection-workflow">
            <ImagePreview 
              imageUrl={imageUrl}
              onRemove={handleRemoveImage}
              disabled={isProcessing}
            />

            <div className="detect-actions">
              <button 
                className="detect-button"
                onClick={handleDetect}
                disabled={isProcessing}
                type="button"
              >
                {isProcessing ? 'Analyzing...' : 'Detect Road Damage'}
              </button>
            </div>
          </div>
        )}

        {/* Detection Results */}
        {detectionResult && dynamicSummary && (
          <div className="detection-results">
            {/* Show uploaded image with AI detections overlay */}
            <DetectionImage 
              imageUrl={imageUrl}
              detections={filteredDetections}
              minConfidence={minConfidence}
              onMinConfidenceChange={setMinConfidence}
            />

            {/* Show summary */}
            <DetectionSummary summary={dynamicSummary} />

            {/* Show empty state or detection cards */}
            {filteredDetections.length === 0 ? (
              <EmptyDetection />
            ) : (
              <>
                {/* Detection Cards */}
                <div className="detection-cards-section">
                  <h2 className="section-title">Detected Issues</h2>
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

                {/* Detection Table */}
                <DetectionTable detections={filteredDetections} />
              </>
            )}

            {/* New Detection Button */}
            <div className="new-detection-actions">
              <button 
                className="new-detection-button"
                onClick={handleRemoveImage}
                type="button"
              >
                Analyze Another Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
