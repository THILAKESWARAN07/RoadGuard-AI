import React, { useState, useEffect, useRef } from 'react';

interface ExportMenuProps {
  onExportJSON: () => void;
  onExportCSV: () => void;
  disabled?: boolean;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  onExportJSON,
  onExportCSV,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleExportJSON = () => {
    onExportJSON();
    setIsOpen(false);
  };

  const handleExportCSV = () => {
    onExportCSV();
    setIsOpen(false);
  };

  return (
    <div className="export-menu-container" ref={menuRef}>
      <button
        className={`export-menu-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Export history reports"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Export Report</span>
        <svg className={`chevron-icon ${isOpen ? 'rotate-180' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <ul className="export-menu-dropdown" role="menu">
          <li role="none">
            <button
              onClick={handleExportJSON}
              className="export-menu-item"
              role="menuitem"
              type="button"
            >
              <span className="export-format-tag json">JSON</span>
              <span className="export-item-desc">Raw detection records</span>
            </button>
          </li>
          <li role="none">
            <button
              onClick={handleExportCSV}
              className="export-menu-item"
              role="menuitem"
              type="button"
            >
              <span className="export-format-tag csv">CSV</span>
              <span className="export-item-desc">Excel report format</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};
