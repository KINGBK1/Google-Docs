import React, { useState, useEffect, useRef } from 'react';
import './SaveDialog.css';

const SaveDialog = ({ 
  initialFileName = 'Untitled document', 
  onSave, 
  onCancel, 
  isOpen = true,
  isSaving = false 
}) => {
  const [fileName, setFileName] = useState(initialFileName);
  const [selectedLocation, setSelectedLocation] = useState('my-drive');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Focus and select all text when dialog opens
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleSave = () => {
    if (fileName.trim()) {
      onSave({
        fileName: fileName.trim(),
        location: selectedLocation
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && fileName.trim()) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const isValidFileName = fileName.trim().length > 0;

  return (
    <div className="save-dialog-overlay" onClick={handleOverlayClick}>
      <div className="save-dialog-container">
        <div className="save-dialog-content">
          <h2 className="save-dialog-title">Save document</h2>
          
          <div className="save-dialog-body">
            <div className="input-group">
              <label htmlFor="document-name" className="input-label">
                Document name
              </label>
              <input
                ref={inputRef}
                id="document-name"
                type="text"
                className={`document-name-input ${!isValidFileName ? 'error' : ''}`}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter document name"
                disabled={isSaving}
              />
              {!isValidFileName && (
                <span className="error-text">Document name is required</span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="save-location" className="input-label">
                Save to
              </label>
              <div className="location-selector">
                <select
                  id="save-location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="location-select"
                  disabled={isSaving}
                >
                  <option value="my-drive">📁 My Drive</option>
                  <option value="shared-drives">👥 Shared drives</option>
                  <option value="recent">🕐 Recent</option>
                  <option value="starred">⭐ Starred</option>
                </select>
              </div>
            </div>

            <div className="save-info">
              <div className="info-item">
                <span className="info-icon">💾</span>
                <span className="info-text">Document will be saved automatically as you type</span>
              </div>
              <div className="info-item">
                <span className="info-icon">🔗</span>
                <span className="info-text">Shareable link will be generated after saving</span>
              </div>
            </div>
          </div>
          
          <div className="save-dialog-actions">
            <button 
              className="cancel-button"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              className="save-button"
              onClick={handleSave}
              disabled={!isValidFileName || isSaving}
            >
              {isSaving ? (
                <>
                  <span className="saving-spinner"></span>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveDialog;