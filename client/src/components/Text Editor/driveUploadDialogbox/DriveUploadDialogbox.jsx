import React, { useState } from 'react';
import './DriveUploadDialogBox.css';
import axios from 'axios';

const DriveUploadDialogBox = ({ isOpen, onClose, documentName = "Untitled Document" }) => {
    const [activeTab, setActiveTab] = useState('Suggested');
    const folders = ['Folder1', 'Folder2', 'Folder3'];
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="drive-modal-overlay">
            <div className="drive-modal">
                <h2 className="drive-modal-title">Move "{documentName}"</h2>

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

                <h3 className="drive-warning">
                    ⚠️THIS FEATURE IS YET UNDER DEVELOPMENT/VERIFICATIN DUE TO GOOGLE DRIVE API LIMITATIONS.
                </h3>

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
                                        // Add selectedFolderId if needed later
                                    },
                                    { withCredentials: true }
                                );
                                alert("Uploaded to Google Drive!");
                                onClose();
                            } catch (err) {
                                console.error("Upload failed:", err);
                                alert("Failed to upload to Drive");
                            } finally {
                                setUploading(false);
                            }
                        }}
                        disabled={uploading}
                        style={{
                            backgroundColor: uploading ? "#ccc" : "#1a73e8",
                            color: "#fff",
                            cursor: uploading ? "not-allowed" : "pointer",
                            borderRadius: "20px",
                            padding: "8px 24px",
                            border: "none",
                            fontWeight: "500"
                        }}
                    >
                        {uploading ? "Uploading..." : "Move"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriveUploadDialogBox;
