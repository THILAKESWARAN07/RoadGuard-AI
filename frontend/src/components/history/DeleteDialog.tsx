import React, { useEffect, useRef } from 'react';

interface DeleteDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and accessibility helpers
  useEffect(() => {
    if (isOpen) {
      // Focus the cancel or confirm button on open
      confirmButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div
        className="dialog-container alert-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <svg className="dialog-warning-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 id="dialog-title" className="dialog-title">{title}</h3>
        </div>
        <div className="dialog-body">
          <p id="dialog-desc" className="dialog-message">{message}</p>
        </div>
        <div className="dialog-actions">
          <button
            className="dialog-btn secondary-btn"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            className="dialog-btn danger-btn"
            onClick={onConfirm}
            type="button"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
};
