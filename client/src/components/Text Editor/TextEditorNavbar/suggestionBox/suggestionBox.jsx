import React from 'react'
import './suggestionBox.css' ;
import { RxCross1 } from "react-icons/rx";
import { TiTick } from "react-icons/ti";

const SuggestionBox = ({ suggestion, name, date, onAccept, onReject }) => {

  return (
    <div className="suggestion-box">
        <div className="suggestion-head">
            <div className="suggestion-head-left-container">
                <div className="profile-cont">
                    <img src="" alt="profile" />
                    <div className="name-date">
                        <label htmlFor="">{name}</label>
                        <span>{date}</span>
                    </div>
                </div>
                

            </div>
            <div className="suggestion-head-right-container">
                <div className="confirmation-btns">
                    <button className="confirm-btn" onClick={onAccept}><TiTick/></button>
                    <button className="cancel-btn" onClick={onReject}><RxCross1/></button>
                </div>
            </div>
        </div>
        <div className="suggestion-text">
            <label htmlFor="add">Add : </label>
            <span>{suggestion}</span>
        </div>
        <div className="suggestion-text-input">
            <input type="text" placeholder="give your suggestion" />
        </div>
        <div className="down-buttons">
            <button>Cancel</button>
            <button>Reply</button>
        </div>
    </div>
  )
}

export default SuggestionBox ;