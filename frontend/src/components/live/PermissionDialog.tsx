import React, { useEffect } from 'react';

interface PermissionDialogProps {
  status:
    | 'off'
    | 'connecting'
    | 'streaming'
    | 'permission-denied'
    | 'device-not-found'
    | 'device-busy'
    | 'unsupported'
    | 'error';
  onClose: () => void;
}

export const PermissionDialog: React.FC<PermissionDialogProps> = ({ status, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getErrorContent = () => {
    switch (status) {
      case 'permission-denied':
        return {
          title: 'Camera Access Blocked',
          message: 'RoadGuard AI was denied access to your camera. Please enable permissions to allow live road hazard inspection.',
          steps: [
            'Click the lock or camera icon in your browser URL address bar.',
            'Change "Camera" permission setting from "Block" to "Allow".',
            'Refresh the page and click "Start Camera" again.'
          ],
        };
      case 'device-not-found':
        return {
          title: 'No Camera Device Found',
          message: 'We could not detect any connected video input hardware. Please verify your hardware connection.',
          steps: [
            'Check that your webcam is plugged in securely.',
            'Ensure your system camera switch (hardware slider on laptop bezel) is open.',
            'Verify that device drivers are installed and recognized by your OS.'
          ],
        };
      case 'device-busy':
        return {
          title: 'Camera Currently Busy',
          message: 'Your webcam is already in use by another application or tab (e.g. Zoom, Teams, or another browser page).',
          steps: [
            'Close other video calling or camera programs.',
            'Close other browser tabs that might have active camera streams.',
            'Wait a few seconds and try starting the camera again.'
          ],
        };
      case 'unsupported':
        return {
          title: 'Browser Not Supported',
          message: 'Your browser or environment does not support media capture APIs.',
          steps: [
            'Make sure you are accessing the page over HTTPS (local capture requires secure context).',
            'Try updating your browser to the latest version.',
            'Use a modern desktop browser like Chrome, Firefox, Safari, or Edge.'
          ],
        };
      default:
        return {
          title: 'Webcam Stream Error',
          message: 'An unexpected error occurred while trying to initialize the camera stream.',
          steps: [
            'Refresh the page and try again.',
            'Unplug and replug your external camera if applicable.',
            'Check system privacy settings to ensure browser apps can access the camera.'
          ],
        };
    }
  };

  const hasError = [
    'permission-denied',
    'device-not-found',
    'device-busy',
    'unsupported',
    'error'
  ].includes(status);

  if (!hasError) return null;

  const content = getErrorContent();

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-container camera-permission-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="perm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <svg className="dialog-warning-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 id="perm-dialog-title" className="dialog-title">{content.title}</h3>
        </div>
        <div className="dialog-body">
          <p className="dialog-message">{content.message}</p>
          <div className="permission-steps-panel">
            <span className="steps-heading">How to resolve:</span>
            <ol className="steps-list">
              {content.steps.map((step, idx) => (
                <li key={idx} className="step-item">{step}</li>
              ))}
            </ol>
          </div>
        </div>
        <div className="dialog-actions">
          <button
            className="dialog-btn secondary-btn"
            onClick={onClose}
            type="button"
            style={{ width: '100%' }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
