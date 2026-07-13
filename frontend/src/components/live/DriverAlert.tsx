import React from 'react';
import { Alert } from './AlertManager';
import { SeverityIndicator } from './SeverityIndicator';

interface DriverAlertProps {
  alertThreshold: number;
  onThresholdChange: (val: number) => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  activeAlert: Alert | null;
  isWarningVisible: boolean;
}

export const DriverAlert: React.FC<DriverAlertProps> = ({
  alertThreshold,
  onThresholdChange,
  isMuted,
  onMuteToggle,
  activeAlert,
  isWarningVisible,
}) => {
  return (
    <div className="driver-assistance-settings-card sidebar-card">
      <h3 className="sidebar-card-title">Driver Alert Settings</h3>
      <p className="sidebar-desc" style={{ marginBottom: '1rem' }}>
        Configure warning audio indicators and minimum confidence filters.
      </p>

      <div className="alert-settings-controls">
        {/* Mute Control */}
        <div className="setting-control-item toggle-item" style={{ padding: 0, marginBottom: '1rem' }}>
          <span className="setting-label">Audio Alerts</span>
          <button
            type="button"
            onClick={onMuteToggle}
            className={`alert-mute-btn-control ${isMuted ? 'muted' : 'active'}`}
            aria-label={isMuted ? 'Unmute alert audio warning signals' : 'Mute alert audio warning signals'}
          >
            {isMuted ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
                <span>Muted</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <span>Active Tones</span>
              </>
            )}
          </button>
        </div>

        {/* Confidence Threshold Selector */}
        <div className="setting-control-item" style={{ marginBottom: '1rem' }}>
          <label className="setting-label" htmlFor="alert-threshold-select">
            Alert Threshold
          </label>
          <select
            id="alert-threshold-select"
            value={alertThreshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
            className="setting-select"
            style={{ width: '100%' }}
          >
            <option value="0.60">60% Confidence (Default)</option>
            <option value="0.70">70% Confidence (Standard)</option>
            <option value="0.80">80% Confidence (Strict)</option>
          </select>
        </div>
      </div>

      {/* Active Warning Severity HUD Meter */}
      {isWarningVisible && activeAlert && (
        <div className="active-warning-hud-panel">
          <span className="hud-heading">Active Hazard Meter:</span>
          <SeverityIndicator
            severity={activeAlert.severity}
            confidence={activeAlert.confidence}
          />
        </div>
      )}
    </div>
  );
};
export default DriverAlert;
