import './loading-btn.css'; 
import { IoCloudDoneOutline } from 'react-icons/io5';

const SaveStatusButton = ({ status, onClick }) => {
  return (
    <button className="save-status-button" onClick={onClick} disabled={status === 'saving'}>
      {status === 'saving' ? (
        <span className="saving-text">Saving...</span>
      ) : status === 'saved' ? (
        <>
          <IoCloudDoneOutline />
          <span>Saved</span>
        </>
      ) : (
        <>
          <IoCloudDoneOutline />
          <span>Save</span>
        </>
      )}
    </button>
  );
};

export default SaveStatusButton;
