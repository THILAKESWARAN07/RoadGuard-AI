import React from 'react';

interface VoiceStatusProps {
  status: 'muted' | 'idle' | 'speaking';
  currentText: string;
  currentVoiceURI: string;
}

export const VoiceStatus: React.FC<VoiceStatusProps> = ({
  status,
  currentText,
  currentVoiceURI,
}) => {
  const getBadgeDetails = () => {
    switch (status) {
      case 'speaking':
        return {
          label: 'Speaking',
          classSuffix: 'detecting', // Reuses the green color style from inference badges
          pulse: true,
        };
      case 'idle':
        return {
          label: 'Voice Active',
          classSuffix: 'idle', // Blue style
          pulse: false,
        };
      default:
        return {
          label: 'Voice Off',
          classSuffix: 'waiting', // Gray style
          pulse: false,
        };
    }
  };

  const badge = getBadgeDetails();

  return (
    <div className="voice-status-panel-hud">
      <div className="panel-card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <span className="line-label" style={{ fontWeight: 600 }}>Assistant State</span>
        <div className={`status-badge-indicator badge-${badge.classSuffix}`}>
          {badge.pulse && <span className="pulsing-radar-ring" />}
          <span>{badge.label}</span>
        </div>
      </div>

      {status === 'speaking' && currentText && (
        <div className="speech-text-announcement-bubble animate-fadeIn">
          <span className="speech-bubble-heading">Announcing:</span>
          <p className="speech-bubble-body">"{currentText}"</p>
        </div>
      )}

      <div className="info-line" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
        <span className="line-label">Active Profile</span>
        <span className="line-value truncate-val" style={{ maxWidth: '160px', color: '#b8c7da' }} title={currentVoiceURI || 'Browser Default'}>
          {currentVoiceURI ? currentVoiceURI.split('(')[0].trim() : 'Browser Default'}
        </span>
      </div>
    </div>
  );
};
export default VoiceStatus;
