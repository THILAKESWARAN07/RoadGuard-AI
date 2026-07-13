import React from 'react';

export const EmptyDetection: React.FC = () => {
  return (
    <div className="empty-detection">
      <div className="empty-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      
      <h3 className="empty-title">No Road Damage Detected</h3>
      
      <p className="empty-message">
        Your image has been analyzed and no potholes or manholes were found.
        The road appears to be in good condition.
      </p>
      
      <div className="empty-tips">
        <p className="empty-tip">
          <strong>Tip:</strong> Try uploading a different image with clearer road visibility.
        </p>
      </div>
    </div>
  );
};
