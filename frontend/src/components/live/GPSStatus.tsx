import React from 'react';
import { GPSStatusType, LocationData } from './LocationService';

interface GPSStatusProps {
  status: GPSStatusType;
  location: LocationData | null;
  gpsLoggingEnabled: boolean;
}

export const GPSStatus: React.FC<GPSStatusProps> = ({
  status,
  location,
  gpsLoggingEnabled,
}) => {
  const getStatusBadge = () => {
    if (!gpsLoggingEnabled) {
      return {
        label: 'GPS Geotags Off',
        classSuffix: 'waiting',
        pulse: false,
      };
    }

    switch (status) {
      case 'found':
        if (location && location.accuracy > 50) {
          return {
            label: 'Low GPS Accuracy',
            classSuffix: 'error',
            pulse: true,
          };
        }
        return {
          label: 'Location Found',
          classSuffix: 'detecting',
          pulse: false,
        };
      case 'searching':
        return {
          label: 'Searching...',
          classSuffix: 'idle',
          pulse: true,
        };
      case 'denied':
        return {
          label: 'Permission Denied',
          classSuffix: 'error',
          pulse: false,
        };
      case 'unavailable':
        return {
          label: 'Unavailable',
          classSuffix: 'error',
          pulse: false,
        };
      default:
        return {
          label: 'GPS Enabled',
          classSuffix: 'idle',
          pulse: false,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="gps-status-panel-hud">
      <div className="panel-card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <span className="line-label" style={{ fontWeight: 600 }}>GPS Telemetry</span>
        <div className={`status-badge-indicator badge-${badge.classSuffix}`}>
          {badge.pulse && <span className="pulsing-radar-ring" />}
          <span>{badge.label}</span>
        </div>
      </div>

      {gpsLoggingEnabled && status === 'found' && location && (
        <div className="gps-coordinates-bubble animate-fadeIn">
          {location.accuracy > 50 && (
            <div className="low-gps-accuracy-alert" role="alert">
              ⚠️ Warning: Poor satellite signal (precision &gt; 50m).
            </div>
          )}
          <div className="coord-row">
            <span className="coord-label">Latitude:</span>
            <span className="coord-value monospace">{location.latitude.toFixed(6)}</span>
          </div>
          <div className="coord-row">
            <span className="coord-label">Longitude:</span>
            <span className="coord-value monospace">{location.longitude.toFixed(6)}</span>
          </div>
          <div className="coord-row" style={{ marginTop: '0.2rem', fontSize: '0.7rem', opacity: 0.85 }}>
            <span className="coord-label">Accuracy:</span>
            <span className={`coord-value ${location.accuracy > 50 ? 'text-red' : 'text-green'}`} style={{ fontWeight: 700 }}>
              ± {location.accuracy.toFixed(1)} m
            </span>
          </div>
        </div>
      )}

      {gpsLoggingEnabled && status === 'searching' && (
        <div className="gps-acquiring-message-container animate-pulse">
          <p>Acquiring satellite lock. Ensure location services are active...</p>
        </div>
      )}

      {gpsLoggingEnabled && status === 'denied' && (
        <div className="gps-error-warning-container">
          <p>Location permission was blocked. Captures will log "GPS Unavailable".</p>
        </div>
      )}

      {gpsLoggingEnabled && status === 'unavailable' && (
        <div className="gps-error-warning-container">
          <p>Location services are unavailable on this device.</p>
        </div>
      )}
    </div>
  );
};
export default GPSStatus;
