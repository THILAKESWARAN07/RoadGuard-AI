import React from 'react';

interface FPSCounterProps {
  currentFps: number;
  averageFps: number;
  inferenceTime: number;
  latency: number;
  detectionCount: number;
}

export const FPSCounter: React.FC<FPSCounterProps> = ({
  currentFps,
  averageFps,
  inferenceTime,
  latency,
  detectionCount,
}) => {
  return (
    <div className="camera-fps-counter-dashboard">
      <div className="telemetry-grid">
        <div className="telemetry-block">
          <span className="telemetry-label">Current FPS</span>
          <span className="telemetry-value text-amber">{currentFps.toFixed(1)}</span>
        </div>
        <div className="telemetry-block">
          <span className="telemetry-label">Average FPS</span>
          <span className="telemetry-value">{averageFps.toFixed(1)}</span>
        </div>
        <div className="telemetry-block">
          <span className="telemetry-label">Inference (AI)</span>
          <span className="telemetry-value">
            {inferenceTime > 0 ? `${inferenceTime.toFixed(0)} ms` : 'N/A'}
          </span>
        </div>
        <div className="telemetry-block">
          <span className="telemetry-label">Round-Trip Latency</span>
          <span className="telemetry-value">
            {latency > 0 ? `${latency.toFixed(0)} ms` : 'N/A'}
          </span>
        </div>
        <div className="telemetry-block full-width">
          <span className="telemetry-label">Hazards Tracked</span>
          <span className="telemetry-value text-red">{detectionCount}</span>
        </div>
      </div>
    </div>
  );
};
export default FPSCounter;
