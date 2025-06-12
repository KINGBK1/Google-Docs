import React from 'react'
import './ShareDialogBox.css'
import { MdOutlineContactSupport } from "react-icons/md";
import { CiSettings } from "react-icons/ci";


const ShareDialogBox = ({isOpen , setisOpen}) => {
    return (
        <div className="dialog-container">
            <div className="head-container">
                <h2 className="container-heading">share New Document</h2>
                <div className="head-button">
                    <button className="help"><MdOutlineContactSupport /></button>
                    <button className="setting"><CiSettings /></button>
                </div>
            </div>
            <input type="text" placeholder='Add people , groups , calender , events' />
            <div className="people-access-container">
                <h3>People With Access</h3>
                <div className="user-row">
                    <div className="user-info">
                        <div className="profile-img-icon">
                            <img src="" alt="" className="profile-img" />
                        </div>
                        <div className="email-info">
                            <h3 className="name"></h3>
                            <p className="email">Loremdkdnekndfeknfkefnkle</p>
                        </div>  
                    </div>
                </div>
            </div>
            <div className="general-access-conatiner">
                <h3>General Access</h3>
                <div className="access-row">
                    <div className="lock-icon">
                        <img src="" alt="" className='current-staus-icon'/>
                    </div>
                    <div className="status">
                        <select name="" id="" className="current-status">
                            <option value="restricted">Restricted</option>
                            <option value="anyone-with-the-link">Anyone With The Link</option>
                        </select>
                        <p className="status-info">Lorem ipsum dolor sit amet consectetur.</p>
                    </div>
                </div>
            </div>
            <div className="footer-button-container">
                <button className="copy-link">Copy Link</button>
                <button onClick = {()=> (setisOpen(!isOpen))}className="done">Done</button>
            </div>
        </div>
    );
}

export default ShareDialogBox