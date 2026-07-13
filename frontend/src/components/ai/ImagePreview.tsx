import React from 'react';

interface ImagePreviewProps {
  imageUrl: string;
  onRemove: () => void;
  disabled: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onRemove, disabled }) => {
  return (
    <div className="image-preview">
      <div className="preview-container">
        <img 
          src={imageUrl} 
          alt="Preview" 
          className="preview-image"
        />
        
        <button
          className="remove-button"
          onClick={onRemove}
          disabled={disabled}
          type="button"
          aria-label="Remove image"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      
      <div className="preview-info">
        <p className="preview-filename">Image selected</p>
        <p className="preview-status">Ready for detection</p>
      </div>
    </div>
  );
};
