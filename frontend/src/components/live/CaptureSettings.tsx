import React from 'react';

export interface CaptureSettingsData {
  autoCapture: boolean;
  gpsLogging: boolean;
  cooldownSeconds: number;
  minConfidence: number;
}

interface CaptureSettingsProps {
  settings: CaptureSettingsData;
  onSettingsChange: (settings: CaptureSettingsData) => void;
}

export const CaptureSettings: React.FC<CaptureSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  return (
    <div className="capture-settings-controls-group">
      {/* Auto Capture Toggle */}
      <div className="setting-control-item toggle-item" style={{ padding: 0, marginBottom: '0.85rem' }}>
        <span className="setting-label">Auto Capture Evidence</span>
        <label className="switch-control-toggle">
          <input
            type="checkbox"
            checked={settings.autoCapture}
            onChange={(e) => onSettingsChange({ ...settings, autoCapture: e.target.checked })}
            className="switch-input-element"
            aria-label="Toggle auto capture evidence"
          />
          <span className="switch-slider-track" />
        </label>
      </div>

      {/* GPS Logging Toggle */}
      <div className="setting-control-item toggle-item" style={{ padding: 0, marginBottom: '0.85rem' }}>
        <span className="setting-label">GPS Geotagging</span>
        <label className="switch-control-toggle">
          <input
            type="checkbox"
            checked={settings.gpsLogging}
            onChange={(e) => onSettingsChange({ ...settings, gpsLogging: e.target.checked })}
            className="switch-input-element"
            aria-label="Toggle GPS geotagging"
          />
          <span className="switch-slider-track" />
        </label>
      </div>

      {settings.autoCapture && (
        <div className="capture-settings-expanded animate-fadeIn">
          {/* Min Confidence Slider */}
          <div className="setting-control-item" style={{ marginBottom: '0.85rem' }}>
            <div className="slider-label-header">
              <label className="setting-label" htmlFor="capture-confidence-slider">Min Capture Confidence</label>
              <span className="slider-value-badge">{Math.round(settings.minConfidence * 100)}%</span>
            </div>
            <input
              id="capture-confidence-slider"
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={settings.minConfidence}
              onChange={(e) => onSettingsChange({ ...settings, minConfidence: parseFloat(e.target.value) })}
              className="settings-slider-element"
              aria-label="Minimum capture confidence"
            />
          </div>

          {/* Cooldown Seconds Slider */}
          <div className="setting-control-item" style={{ marginBottom: '0.5rem' }}>
            <div className="slider-label-header">
              <label className="setting-label" htmlFor="capture-cooldown-slider">Duplicate Cooldown</label>
              <span className="slider-value-badge">{settings.cooldownSeconds}s</span>
            </div>
            <input
              id="capture-cooldown-slider"
              type="range"
              min="5"
              max="30"
              step="1"
              value={settings.cooldownSeconds}
              onChange={(e) => onSettingsChange({ ...settings, cooldownSeconds: parseInt(e.target.value, 10) })}
              className="settings-slider-element"
              aria-label="Duplicate capture cooldown in seconds"
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default CaptureSettings;
