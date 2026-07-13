import React, { useState } from 'react';
import { CameraStatusType } from './CameraStatus';

interface CameraControlsProps {
  status: CameraStatusType;
  onStart: () => void;
  onStop: () => void;
  devices: MediaDeviceInfo[];
  activeDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
  resolution: string;
  onResolutionChange: (res: string) => void;
  frameRate: number;
  onFrameRateChange: (fps: number) => void;
  isMirrored: boolean;
  onMirrorToggle: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  status,
  onStart,
  onStop,
  devices,
  activeDeviceId,
  onDeviceChange,
  resolution,
  onResolutionChange,
  frameRate,
  onFrameRateChange,
  isMirrored,
  onMirrorToggle,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isStreaming = status === 'streaming';
  const isConnecting = status === 'connecting';
  const isActive = isStreaming || isConnecting;

  const handleToggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  return (
    <div className="camera-controls-container">
      {/* Primary Actions Row */}
      <div className="controls-primary-row">
        {/* Start / Stop Button */}
        {!isActive ? (
          <button
            className="control-action-btn start-camera-btn"
            onClick={onStart}
            type="button"
            aria-label="Start live camera stream"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span>Start Camera</span>
          </button>
        ) : (
          <button
            className="control-action-btn stop-camera-btn"
            onClick={onStop}
            type="button"
            aria-label="Stop live camera stream"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            </svg>
            <span>Stop Camera</span>
          </button>
        )}

        {/* Switch camera select (only if multiple inputs) */}
        {devices.length > 1 && (
          <div className="camera-select-container">
            <select
              className="camera-device-select"
              value={activeDeviceId}
              onChange={(e) => onDeviceChange(e.target.value)}
              aria-label="Select camera hardware input"
              title="Camera devices"
            >
              {devices.map((device, idx) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Expand Settings Button */}
        <button
          className={`control-settings-toggle-btn ${settingsOpen ? 'active' : ''}`}
          onClick={handleToggleSettings}
          type="button"
          aria-expanded={settingsOpen}
          aria-label="Toggle camera settings panel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="button-text">Settings</span>
        </button>
      </div>

      {/* Expandable Settings Card */}
      {settingsOpen && (
        <div className="camera-settings-dropdown-panel">
          <h4 className="settings-panel-title">Camera Settings</h4>
          
          <div className="settings-options-grid">
            {/* Resolution Selector */}
            <div className="setting-control-item">
              <label className="setting-label" htmlFor="camera-res">Resolution</label>
              <select
                id="camera-res"
                value={resolution}
                onChange={(e) => onResolutionChange(e.target.value)}
                className="setting-select"
                disabled={isConnecting}
              >
                <option value="640x480">640 × 480 (VGA)</option>
                <option value="1280x720">1280 × 720 (HD 720p)</option>
                <option value="1920x1080">1920 × 1080 (FHD 1080p)</option>
              </select>
            </div>

            {/* Frame Rate Selector */}
            <div className="setting-control-item">
              <label className="setting-label" htmlFor="camera-fps">Frame Rate</label>
              <select
                id="camera-fps"
                value={frameRate}
                onChange={(e) => onFrameRateChange(parseInt(e.target.value))}
                className="setting-select"
                disabled={isConnecting}
              >
                <option value="15">15 FPS (Eco Mode)</option>
                <option value="30">30 FPS (Standard)</option>
              </select>
            </div>

            {/* Mirror Camera Switch */}
            <div className="setting-control-item toggle-item">
              <span className="setting-label">Mirror Display</span>
              <label className="switch-control-toggle">
                <input
                  type="checkbox"
                  checked={isMirrored}
                  onChange={onMirrorToggle}
                  className="switch-input-element"
                />
                <span className="switch-slider-track" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
