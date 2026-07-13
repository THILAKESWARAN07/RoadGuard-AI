import React from 'react';

export type CameraStatusType =
  | 'off'
  | 'connecting'
  | 'streaming'
  | 'permission-denied'
  | 'device-not-found'
  | 'device-busy'
  | 'unsupported'
  | 'error';

interface CameraStatusProps {
  status: CameraStatusType;
}

export const CameraStatus: React.FC<CameraStatusProps> = ({ status }) => {
  const getBadgeDetails = () => {
    switch (status) {
      case 'off':
        return {
          label: 'Camera Off',
          classSuffix: 'off',
          dot: false,
        };
      case 'connecting':
        return {
          label: 'Connecting...',
          classSuffix: 'connecting',
          dot: true,
        };
      case 'streaming':
        return {
          label: 'Live Streaming',
          classSuffix: 'streaming',
          dot: true,
        };
      case 'permission-denied':
        return {
          label: 'Permission Blocked',
          classSuffix: 'error',
          dot: false,
        };
      case 'device-not-found':
        return {
          label: 'No Camera Found',
          classSuffix: 'error',
          dot: false,
        };
      case 'device-busy':
        return {
          label: 'Camera Busy',
          classSuffix: 'error',
          dot: false,
        };
      case 'unsupported':
        return {
          label: 'Unsupported Browser',
          classSuffix: 'error',
          dot: false,
        };
      default:
        return {
          label: 'Stream Error',
          classSuffix: 'error',
          dot: false,
        };
    }
  };

  const details = getBadgeDetails();

  return (
    <div
      className={`camera-status-badge badge-${details.classSuffix}`}
      role="status"
      aria-live="polite"
    >
      {details.dot && <span className="status-badge-dot-pulse" />}
      <span className="status-badge-label-text">{details.label}</span>
    </div>
  );
};
