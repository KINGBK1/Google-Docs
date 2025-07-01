import React, { useState, useEffect } from 'react';
import './suggestionBox.css';
import { RxCross1 } from "react-icons/rx";
import { TiTick } from "react-icons/ti";

const SuggestionBox = ({ suggestion, name, date, onAccept, onReject }) => {
    const [user, setUser] = useState(null);

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

    return (
        <div className="suggestion-box">
            <div className="suggestion-head">
                <div className="suggestion-head-left-container">
                    <div className="profile-cont">
                        {user?.picture ? (
                            <img src={user.picture} alt="profile" />
                        ) : (
                            <div className="fallback-img">{user?.name?.[0] || "U"}</div>
                        )}
                        <div className="name-date">
                            <label>{name}</label>
                            <span>{date}</span>
                        </div>
                    </div>
                </div>
                <div className="suggestion-head-right-container">
                    <div className="confirmation-btns">
                        <button className="confirm-btn" onClick={onAccept}><TiTick /></button>
                        <button className="cancel-btn" onClick={onReject}><RxCross1 /></button>
                    </div>
                </div>
            </div>
            <div className="suggestion-text">
                <label>Add:</label>
                <span>{suggestion}</span>
            </div>
            <div className="suggestion-text-input">
                <input type="text" placeholder="Give your suggestion" />
            </div>
            <div className="down-buttons">
                <button>Cancel</button>
                <button>Reply</button>

            </div>
            <h3 className="note">🚧 Experimental Feature
                This feature is still in the development phase and contains a lot of bugs.
                You're welcome to try it out and help improve it by contributing!
                👉 Contribute via a separate git branch:</h3>
        </div>
    );
};

export default SuggestionBox;
