import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Analyzing Road Image...' 
}) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="spinner">
          <div className="spinner-circle"></div>
        </div>
        
        <h3 className="loading-message">{message}</h3>
        
        <p className="loading-subtitle">
          Please wait while our AI analyzes your image
        </p>
      </div>
    </div>
  );
};
