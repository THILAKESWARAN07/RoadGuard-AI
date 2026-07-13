import React from 'react';
import { CaptureSettings, CaptureSettingsData } from './CaptureSettings';
import { GPSStatus } from './GPSStatus';
import { GPSStatusType, LocationData } from './LocationService';

interface AutoCaptureProps {
  settings: CaptureSettingsData;
  onSettingsChange: (settings: CaptureSettingsData) => void;
  gpsStatus: GPSStatusType;
  gpsLocation: LocationData | null;
  sessionCaptureCount: number;
  onManualCapture: () => void;
  cameraActive: boolean;
}

export const AutoCapture: React.FC<AutoCaptureProps> = ({
  settings,
  onSettingsChange,
  gpsStatus,
  gpsLocation,
  sessionCaptureCount,
  onManualCapture,
  cameraActive,
}) => {
  return (
    <div className="auto-capture-sidebar-panel sidebar-card">
      <div className="capture-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 className="sidebar-card-title" style={{ margin: 0 }}>Auto Evidence Capture</h3>
        
        {cameraActive && (
          <div className="session-capture-counter-badge" title="Number of captures saved in this session">
            Captures: {sessionCaptureCount}
          </div>
        )}
      </div>
      <p className="sidebar-desc" style={{ marginBottom: '1rem' }}>
        Automatically log geotagged evidence snapshots to the municipal dashboard database.
      </p>

      {/* GPS Status HUD */}
      <GPSStatus
        status={gpsStatus}
        location={gpsLocation}
        gpsLoggingEnabled={settings.gpsLogging}
      />

      {/* Manual Capture Trigger Button */}
      {cameraActive && (
        <button
          type="button"
          onClick={onManualCapture}
          className="manual-capture-now-btn"
          aria-label="Capture evidence frame manually now"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>Capture Now</span>
        </button>
      )}

      <div className="tooltip-divider" style={{ margin: '1rem 0' }} />

      {/* Capture Configuration Settings */}
      <CaptureSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </div>
  );
};
export default AutoCapture;
