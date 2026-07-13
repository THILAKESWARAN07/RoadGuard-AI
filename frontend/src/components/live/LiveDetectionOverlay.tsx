import React, { memo } from 'react';
import { BoundingBox } from '../ai/BoundingBox';

interface Detection {
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
}

interface LiveDetectionOverlayProps {
  detections: Detection[];
  videoWidth: number;
  videoHeight: number;
  isMirrored: boolean;
}

export const LiveDetectionOverlay: React.FC<LiveDetectionOverlayProps> = memo(({
  detections,
  videoWidth,
  videoHeight,
  isMirrored,
}) => {
  if (videoWidth === 0 || videoHeight === 0) return null;

  return (
    <>
      {detections.map((det, index) => (
        <BoundingBox
          key={`${index}_${det.class_name}_${det.confidence}_${det.bbox.x1}`}
          detection={det}
          index={index}
          highlighted={false}
          imageWidth={videoWidth}
          imageHeight={videoHeight}
          zoom={1.0}
          mirrored={isMirrored}
        />
      ))}
    </>
  );
});

LiveDetectionOverlay.displayName = 'LiveDetectionOverlay';
export default LiveDetectionOverlay;
