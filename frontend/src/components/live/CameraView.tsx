import React from 'react';
import { CameraStatus, CameraStatusType } from './CameraStatus';

interface CameraViewProps {
  status: CameraStatusType;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isMirrored: boolean;
  children?: React.ReactNode;
}

export const CameraView: React.FC<CameraViewProps> = ({
  status,
  videoRef,
  isMirrored,
  children,
}) => {
  const isConnecting = status === 'connecting';
  const isOff = status === 'off';
  const hasError = ['permission-denied', 'device-not-found', 'device-busy', 'unsupported', 'error'].includes(status);

  return (
    <div className="camera-view-viewport-container">
      {/* Video Viewport Wrapper */}
      <div className="camera-video-viewport">
        {/* Aspect-ratio preserving wrapper around video element and overlay */}
        <div
          className="camera-video-wrapper"
          style={{
            position: 'relative',
            display: status === 'streaming' ? 'inline-block' : 'none',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          {/* HTML5 video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video-element"
            style={{
              transform: isMirrored ? 'scaleX(-1)' : 'none',
              display: 'block',
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
            }}
          />

          {/* Dynamic Overlay layer for bounding boxes */}
          <div
            className="overlay-layer"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          >
            {children}
          </div>
        </div>

        {/* Pulse Connecting/Loading Skeleton */}
        {isConnecting && (
          <div className="camera-loading-skeleton" role="progressbar" aria-label="Initializing video feed">
            <div className="skeleton-pulse-animation-circle" />
            <div className="skeleton-loader-content">
              <svg className="skeleton-camera-spinner-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <span className="skeleton-loader-title">Initializing Stream</span>
              <span className="skeleton-loader-desc">Accessing hardware camera device...</span>
            </div>
          </div>
        )}

        {/* Off State Visual Block */}
        {isOff && (
          <div className="camera-off-placeholder">
            <div className="placeholder-icon-badge">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M21 21H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9L9.6 5.1a2 2 0 0 0 1.69.9h1.42" />
                <path d="M21 16V5a2 2 0 0 0-2-2h-5" />
                <path d="M23 7v10l-4.5-3" />
              </svg>
            </div>
            <span className="placeholder-title">Live Inspection Offline</span>
            <span className="placeholder-desc">Click "Start Camera" below to activate real-time hazard detection.</span>
          </div>
        )}

        {/* Error State Visual Block */}
        {hasError && (
          <div className="camera-error-placeholder">
            <div className="placeholder-icon-badge error">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span className="placeholder-title error">Stream Configuration Blocked</span>
            <span className="placeholder-desc">Please check permissions, connection, or device settings.</span>
          </div>
        )}

        {/* Status Badge overlay */}
        <div className="camera-status-overlay-position">
          <CameraStatus status={status} />
        </div>
      </div>
    </div>
  );
};
