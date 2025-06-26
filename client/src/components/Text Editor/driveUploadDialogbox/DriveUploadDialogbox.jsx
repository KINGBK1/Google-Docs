import React, { useState } from 'react';
import './DriveUploadDialogBox.css';

const DriveUploadDialogBox = ({ isOpen, onClose, documentName = "Untitled Document" }) => {
    const [activeTab, setActiveTab] = useState('Suggested');
    const folders = ['Farewelllll', 'Photos', 'JT'];
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="drive-modal-overlay">
            <div className="drive-modal">
                <h2 className="drive-modal-title">Move {documentName}</h2>

                <div className="drive-current-location">
                    <span>Current location:</span>
                    <button className="drive-location-btn">📁 My Drive</button>
                    <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="drive-open-drive">🔗</a>
                </div>

                <div className="drive-tabs">
                    {['Suggested', 'Starred', 'All locations'].map(tab => (
                        <button
                            key={tab}
                            className={`drive-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="drive-folder-list">
                    {folders.map((folder, index) => (
                        <div className="drive-folder-item" key={index}>
                            📁 {folder}
                        </div>
                    ))}
                </div>

                <div className="drive-warning">
                    ⚠️ Select a location to show the folder path
                </div>

                <div className="drive-footer">
                    <button className="drive-cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="drive-move-btn"
                        onClick={async () => {
                            setUploading(true);
                            try {
                                const res = await axios.post(
                                    `${import.meta.env.VITE_API_BASE_URL}/api/drive/upload`,
                                    {
                                        documentName,
                                        content: window.editorTextForDrive || "Empty document",
                                    },
                                    { withCredentials: true }
                                );
                                alert("✅ Document uploaded to Google Drive!");
                                onClose();
                            } catch (err) {
                                console.error("Upload failed:", err);
                                alert("❌ Failed to upload to Drive");
                            } finally {
                                setUploading(false);
                            }
                        }}
                        disabled={uploading}
                    >
                        {uploading ? "Uploading..." : "Move"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriveMoveDialog;
