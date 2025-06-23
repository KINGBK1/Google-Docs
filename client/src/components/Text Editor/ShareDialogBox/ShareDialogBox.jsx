import React, { useState, useEffect } from 'react';
import './ShareDialogBox.css';
import { MdOutlineContactSupport } from "react-icons/md";
import { CiSettings } from "react-icons/ci";

const ShareDialogBox = ({ isOpen, setisOpen, documentId }) => {
  const [email, setEmail] = useState('');
  const [isRestricted, setIsRestricted] = useState(true);
  const [accessList, setAccessList] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [documentOwnerId, setDocumentOwnerId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetching current user & return ID
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/status", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      setCurrentUserId(data.user.id);
      return data.user.id;
    } catch (err) {
      console.error("Error fetching current user:", err);
      alert("Session expired. Please log in again.");
      return null;
    }
  };

  const handleCopyEvent = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
      .then(() => alert("Doc link copied to clipboard"))
      .catch(err => console.log("ERROR COPYING LINK", err));
  };

  const handleAddUser = async () => {
    if (!email) return alert("Enter an email");

    try {
      const res = await fetch(`http://localhost:5000/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("User added successfully");
      setEmail('');
      fetchAccessList(currentUserId); // Refreshing access list
    } catch (err) {
      alert(`Failed to add user: ${err.message}`);
    }
  };

  const handleRemoveAccess = async (userId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/${documentId}/revoke`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Access revoked successfully");
      fetchAccessList(currentUserId);
    } catch (err) {
      alert(`Failed to revoke access: ${err.message}`);
    }
  };

  const fetchAccessList = async (userIdParam) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/${documentId}`, {
        credentials: "include",
      });
      const data = await res.json();

      setIsRestricted(data.isRestricted);
      setAccessList(data.allowedUsers || []);

      const ownerId = typeof data.owner === "string" ? data.owner : data.owner?._id;
      setDocumentOwnerId(ownerId);
      setIsOwner(ownerId === userIdParam);
    } catch (err) {
      console.error("Error fetching document access:", err);
    }
  };

  const handleAccessChange = async (value) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/${documentId}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isRestricted: value === "restricted" }),
      });

      if (!res.ok) throw new Error("Failed to update access");
      setIsRestricted(value === "restricted");
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const init = async () => {
        const id = await fetchCurrentUser();
        if (id) {
          await fetchAccessList(id);
        }
      };
      init();
    }
  }, [isOpen]);

  return (
    <div className="dialog-container">
      <div className="head-container">
        <h2 className="container-heading">Share Document</h2>
        <div className="head-button">
          <button className="help"><MdOutlineContactSupport /></button>
          <button className="setting"><CiSettings /></button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Add email to share"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
      />

      <div className="people-access-container">
        <h3>People With Access</h3>
        {accessList.map((user, i) => {
          const isSelf = user._id === currentUserId;
          const isUserOwner = user._id === documentOwnerId;
          return (
            <div key={i} className="user-row">
              <div className="user-info">
                <div className="profile-img-icon">
                  <img src={user.picture || "/default-profile.png"} alt="Profile" className="profile-img" />
                </div>
                <div className="email-info">
                  <h3 className="name">{user.name || "Unnamed User"}</h3>
                  <p className="email">
                    {user.email} {isUserOwner && <span className="owner-tag">(Owner)</span>}
                  </p>
                </div>
              </div>
              {isOwner && !isSelf && (
                <button
                  className="remove-access-btn"
                  onClick={() => handleRemoveAccess(user._id)}
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="general-access-conatiner">
        <h3>General Access</h3>
        <div className="access-row">
          <div className="lock-icon">
            <img src="" alt="" className='current-status-icon' />
          </div>
          <div className="status">
            <select
              className="current-status"
              value={isRestricted ? "restricted" : "anyone-with-the-link"}
              onChange={(e) => {
                if (isOwner) handleAccessChange(e.target.value);
              }}
              disabled={!isOwner}
            >
              <option value="restricted">Restricted</option>
              <option value="anyone-with-the-link">Anyone With The Link</option>
            </select>
            <p className="status-info">
              {isRestricted
                ? "Only people added can access this document."
                : "Anyone with the link can view this document."}
            </p>
          </div>
        </div>
      </div>

      <div className="footer-button-container">
        <button className="copy-link" onClick={handleCopyEvent}>Copy Link</button>
        <button onClick={() => setisOpen(false)} className="done">Done</button>
      </div>
    </div>
  );
};

export default ShareDialogBox;
