import React from 'react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="error-alert">
      <div className="error-content">
        <div className="error-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        
        <div className="error-message">
          <h3>Detection Failed</h3>
          <p>{message}</p>
        </div>
        
        <div className="error-actions">
          {onRetry && (
            <button className="retry-button" onClick={onRetry} type="button">
              Try Again
            </button>
          )}
          {onDismiss && (
            <button className="dismiss-button" onClick={onDismiss} type="button">
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
