// import React from 'react';
import './DeleteDialogBox.css';

const DeleteDialogBox  = ({ 
  fileName = 'Resume', 
  onCancel, 
  onConfirm, 
  isOpen = true 
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-container">
        <div className="dialog-content">
          <h2 className="dialog-title" style={{color:"red" , fontWeight:"bolder"}}>Move to bin?</h2>
          
          <div className="dialog-body">
            <p className="primary-message" style={{ color: 'black' , fontWeight: 'bold'}}>
              '{fileName}' will be moved to Drive bin and deleted forever after 30 days.
            </p>
            
            <p className="secondary-message">
              If this file is shared, collaborators can still make a copy of it until it's permanently deleted. 
              <a href="#" className="learn-more-link">Learn more</a>
            </p>
          </div>
          
          <div className="dialog-actions">
            <button 
              className="cancel-button"
              onClick={onCancel}
              style={{ color: 'black' }}
            >
              Cancel
            </button>
            <button 
              className="confirm-button"
              onClick={onConfirm}
            >
              Move to bin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteDialogBox ;