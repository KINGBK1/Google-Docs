import React, { useState } from 'react';
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

// Receive docName, onDocNameChange, and onSaveDocument as props
const TextEditorNavbar = ({ docName, onDocNameChange, onSaveDocument, setisOpen , setIsGeminiOpen}) => {
    const [isFilled, setIsFilled] = useState(false);

    const handleNameInputChange = (e) => {
        onDocNameChange(e.target.value);
    };

    const handleBlur = () => { };

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
                    <button title="Move document"><MdDriveFileMoveOutline /></button>
                    {/* Save Button */}
                    <button onClick={onSaveDocument} title="Save Document">
                        <IoCloudDoneOutline />
                    </button>
                </div>

                <div className="right-items">
                    <button title="Version history"><MdOutlineTimer /></button>
                    <button title="Comments"><LiaCommentSolid /></button>
                    <button title="Video call (Placeholder)"><BsCameraVideo /></button>

                    <button className="share-button" onClick={() => setisOpen(true)}>
                        <PiLockKeyLight className="w-4 h-4 mr-2" />
                        <span>Share</span>
                    </button>


                    <button title="Gemini (Placeholder)" onClick={()=>(setIsGeminiOpen(prev => !prev))}><RiGeminiFill /></button>
                    <div className="profile-wrapper">
                        <div className="profile-circle"></div> {/* Placeholder for profile icon */}
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
                    <select name="" id="" className="mode-list">
                        <option value="editing">Editing</option>
                        <option value="suggesting">Suggesting</option>
                        <option value="viewing">Viewing</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default TextEditorNavbar;