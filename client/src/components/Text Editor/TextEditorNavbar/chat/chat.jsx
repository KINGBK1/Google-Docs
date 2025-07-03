import React, { useEffect, useState, useRef } from 'react';
import { IoIosNotificationsOutline } from "react-icons/io";
import { RxCross1 } from "react-icons/rx";
import { TbDotsVertical } from "react-icons/tb";
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import './chat.css';

const socket = io(import.meta.env.VITE_SERVER_URL, {
  withCredentials: true,
});

const ChatSidebar = ({ onClose }) => {
  const { id: documentId } = useParams();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch logged-in user info
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/status`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Not authenticated");
        const { user } = await res.json();
        setUser(user);
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, []);

  // Set up socket listeners
  useEffect(() => {
    if (!documentId) return;

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleDocumentLoad = (data) => {
      if (data.chatMessages) {
        setMessages(data.chatMessages);
      }
    };

    socket.on('receive-chat-message', handleNewMessage);
    socket.on('load-document', handleDocumentLoad);

    return () => {
      socket.off('receive-chat-message', handleNewMessage);
      socket.off('load-document', handleDocumentLoad);
    };
  }, [documentId]);

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    socket.emit('send-chat-message', {
      documentId,
      message: messageInput,
    });

    setMessageInput('');
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='chat-wrapper'>
      <div className="chat-header">
        <div className="chat-head"><h3>Comments</h3></div>
        <div className="chat-header-right-buttons">
          <button className="notification"><IoIosNotificationsOutline /></button>
          <button className="chat-cancel" onClick={onClose}><RxCross1 /></button>
        </div>
      </div>

      <div className="search">
        <input type="text" placeholder="Search" />
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => (
            <div className="message-block" key={index}>
              <div className="message-head">
                <div className="message-head-left">
                  <img
                    src={
                      msg.sender === user?.name
                        ? user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender)}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender)}`
                    }
                    alt="profile"
                    className="chat-profile"
                  />
                  <div className="sender-details">
                    <label className="sender-name">{msg.sender}</label>
                    <span className="send-date">{formatDate(msg.timestamp)}</span>
                  </div>
                </div>
                <button className='chat-options'><TbDotsVertical /></button>
              </div>
              <div className="message">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
