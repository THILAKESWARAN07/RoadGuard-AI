import React from 'react';

interface WarningBannerProps {
  class_name: string;
  severity: string;
  distance: number;
  isVisible: boolean;
  confidence: number;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  class_name,
  severity,
  distance,
  isVisible,
}) => {
  if (!isVisible) return null;

  const isPothole = class_name.toLowerCase() === 'pothole';
  const sev = severity.toLowerCase();

  const getAlertContent = () => {
    if (isPothole) {
      switch (sev) {
        case 'high':
          return {
            emoji: '🔴',
            title: 'HIGH SEVERITY POTHOLE',
            advice: 'Reduce Speed',
            classSuffix: 'high',
          };
        case 'medium':
          return {
            emoji: '🟠',
            title: 'Road Damage Ahead',
            advice: 'Drive Carefully',
            classSuffix: 'medium',
          };
        default:
          return {
            emoji: '🟢',
            title: 'Minor Road Damage',
            advice: 'Proceed With Caution',
            classSuffix: 'low',
          };
      }
    } else {
      return {
        emoji: '🔵',
        title: 'Manhole Ahead',
        advice: 'Proceed',
        classSuffix: 'info',
      };
    }
  };

  const content = getAlertContent();

  return (
    <div
      className={`warning-banner-overlay warning-${content.classSuffix}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="banner-content-inner">
        <div className="banner-title-row">
          <span className="banner-emoji" aria-hidden="true">{content.emoji}</span>
          <span className="banner-title-text">{content.title}</span>
        </div>
        <div className="banner-meta-row">
          <span className="banner-distance">≈ {distance}m Ahead</span>
          <span className="banner-divider" aria-hidden="true">•</span>
          <span className="banner-advice">{content.advice}</span>
        </div>
      </div>
    </div>
  );
};
export default WarningBanner;
