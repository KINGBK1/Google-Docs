import React, { useState, useRef , useEffect } from 'react';
import './TextEditorNavbar.css';

import { MdDriveFileMoveOutline } from "react-icons/md";
import { IoCloudDoneOutline } from "react-icons/io5";
import { MdOutlineTimer } from "react-icons/md";
import { LiaCommentSolid } from "react-icons/lia";
import { BsCameraVideo } from "react-icons/bs";
// import { BiSolidDownArrow } from "react-icons/bi";
import { RiGeminiFill } from "react-icons/ri";
import { PiLockKeyLight } from "react-icons/pi";
// import ShareDialogBox from "./ShareDialogBox/ShareDialogBox";
import SaveStatusButton from '../loading-button/loading-button';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


// Receive docName, onDocNameChange, and onSaveDocument as props
const TextEditorNavbar = ({ docName, onDocNameChange, onSaveDocument, setisOpen, setIsGeminiOpen, saveStatus, mode, onModeChange , onDriveClick, setIsAuthenticated , underConstructionOpen , setUnderConstructionOpen }) => {
    const [isFilled, setIsFilled] = useState(false);
    const [user, setUser] = useState(null);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const navigate = useNavigate();


    const handleNameInputChange = (e) => {
        onDocNameChange(e.target.value);
    };

    const handleDriveClick = async ()=> {
        await axios.post(
  `${import.meta.env.VITE_API_BASE_URL}/api/drive/upload`,
  {
    documentName: docName,
    content: quillRef.current.root.innerText,
  },
  { withCredentials: true }
);
    }

    const handleBlur = () => { };

    // fetch user 
    useEffect(() => {
        async function fetchUser() {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/auth/status`,
                    { credentials: "include" }
                );
                if (!res.ok) throw new Error("Not authenticated");
                const { user } = await res.json();
                setUser(user);
            } catch (err) {
                console.error(err);
            }
        }
        fetchUser();
    }, []);

    // handling outside clicks
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

      const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      setIsAuthenticated(false); 
    //   navigate("/"); 
    window.location.href = "/";            
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };


    return (
        <div className="navbar-wrapper">
            {/* <div className="logo-conatainer">
                <img src="assets/Google_Docs_Logo.svg" alt="logo" className="g-docs-logo" />
            </div> */}
            
            <div className="nav-first-row">
                <div className="left-items">
                    <input
                        type="text"
                        className="document-name-input"
                        placeholder="Document Name"
                        value={docName}
                        onChange={handleNameInputChange}
                        onBlur={handleBlur}
                    />
                    <button onClick={() => setIsFilled(!isFilled)} title={isFilled ? 'Unstar document' : 'Star document'}>
                        {isFilled ? '★' : '☆'}
                    </button>
                    <button title="Move document" onClick={onDriveClick}><MdDriveFileMoveOutline /></button>
                    {/* Save Button */}
                    <SaveStatusButton status={saveStatus} onClick={onSaveDocument} />

                </div>

                <div className="right-items">
                    <button title="Version history"  onClick={() => setUnderConstructionOpen(prev => !prev)}><MdOutlineTimer /></button>
                    <button title="Comments"  onClick={() => setUnderConstructionOpen(prev => !prev)}><LiaCommentSolid /></button>
                    <button title="Video call (Placeholder)" onClick={() => setUnderConstructionOpen(prev => !prev)}><BsCameraVideo /></button>

                    <button className="share-button" onClick={() => setisOpen(true)}>
                        <PiLockKeyLight className="w-4 h-4 mr-2" />
                        <span>Share</span>
                    </button>


                    <button title="Gemini (Placeholder)" onClick={() => (setIsGeminiOpen(prev => !prev))}><RiGeminiFill /></button>
                    <div className="profile-wrapper" ref={dropdownRef}>
                        {user?.picture ? (
                            <img
                                src={user.picture}
                                alt="Profile"
                                className="profile-circle-img"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            />
                        ) : (
                            <div
                                className="profile-circle"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                {user?.name?.[0] || "U"}
                            </div>
                        )}

                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-avatar">
                                    {user.picture ? (
                                        <img src={user.picture} alt="Profile" />
                                    ) : (
                                        <div className="dropdown-avatar-fallback">
                                            {user.name?.[0] || "U"}
                                        </div>
                                    )}
                                </div>
                                <div className="dropdown-info">
                                    <p className="dropdown-name">{user.name}</p>
                                    <p className="dropdown-email">{user.email}</p>
                                </div>
                                <div className="dropdown-actions">
                                    <button onClick={handleLogout }>Switch Account</button>
                                    <button onClick={handleLogout}>Log Out</button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <div className="nav-second-row">
                <div className="left-buttons-container">
                    <ul className="menu-bar">
                        <li>
                            File
                            <div className="file-dropdown">
                                <ul>
                                    <li>New</li>
                                    <li>Open</li>
                                    <li>Make a Copy</li>
                                </ul>
                            </div>
                        </li>
                        <li>Edit
                            <div className="edit-dropdown">
                                <ul>
                                    <li>Undo</li>
                                    <li>Redo</li>
                                </ul>
                            </div>
                        </li>
                        <li>View</li>
                        <li>Insert</li>
                        <li>Format</li>
                        <li>Tools</li>
                        <li>Extensions</li>
                        <li>Help</li>
                    </ul>
                </div>
                <div className="right-mode-container">
                    <select name="" id="" className="mode-list"
                        value={mode}
                        onChange={(e) => onModeChange(e.target.value)}
                    >
                        <option value="editing">Editing</option>
                        <option value="suggesting">Suggesting(beta)</option>
                        <option value="viewing">Viewing</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default TextEditorNavbar;