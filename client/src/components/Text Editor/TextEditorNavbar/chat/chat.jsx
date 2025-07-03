import React, { useEffect, useState, useRef } from 'react';
import { IoIosNotificationsOutline } from "react-icons/io";
import { RxCross1 } from "react-icons/rx";
import { TbDotsVertical } from "react-icons/tb";
import { useParams } from 'react-router-dom';
import { io } from "socket.io-client";
import './chat.css';

const ChatSidebar = ({ onClose }) => {
  const { id: documentId } = useParams();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SERVER_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

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
        console.log('User fetched:', user);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    }
    fetchUser();
  }, []);

  // Join document and set up chat listeners
  useEffect(() => {
    if (!socket || !documentId || !user) return;

    console.log('Joining document:', documentId, 'with user:', user._id);

    // Join the document
    socket.emit('get-document', { 
      documentId, 
      userId: user._id 
    });

    const handleNewMessage = (msg) => {
      console.log('Received new message:', msg);
      setMessages((prev) => [...prev, msg]);
    };

    const handleDocumentLoad = (data) => {
      console.log('Document loaded:', data);
      if (data.chatMessages) {
        setMessages(data.chatMessages);
      }
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
    };

    socket.on('receive-chat-message', handleNewMessage);
    socket.on('load-document', handleDocumentLoad);
    socket.on('error', handleError);

    return () => {
      socket.off('receive-chat-message', handleNewMessage);
      socket.off('load-document', handleDocumentLoad);
      socket.off('error', handleError);
    };
  }, [socket, documentId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!messageInput.trim() || !socket || !documentId) {
      console.log('Cannot send message:', {
        messageInput: messageInput.trim(),
        socket: !!socket,
        documentId: !!documentId,
        isConnected
      });
      return;
    }

    console.log('Sending message:', messageInput, 'to document:', documentId);

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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className='chat-wrapper'>
      <div className="chat-header">
        <div className="chat-head">
          <h3>Comments</h3>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '●' : '○'}
            </span>
          </div>
        </div>
        <div className="chat-header-right-buttons">
          <button className="notification"><IoIosNotificationsOutline /></button>
          <button className="chat-cancel" onClick={onClose}><RxCross1 /></button>
        </div>
      </div>

      <div className="search">
        <input type="text" placeholder="Search messages..." />
      </div>

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              <p>No comments yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div className="message-block" key={index}>
                <div className="message-head">
                  <div className="message-head-left">
                    <div className="chat-profile">
                      {msg.sender === user?.name && user?.picture ? (
                        <img
                          src={user.picture}
                          alt="profile"
                          className="profile-img"
                        />
                      ) : (
                        <div className="profile-initials">
                          {getInitials(msg.sender)}
                        </div>
                      )}
                    </div>
                    <div className="sender-details">
                      <label className="sender-name">{msg.sender}</label>
                      <span className="send-date">{formatDate(msg.timestamp)}</span>
                    </div>
                  </div>
                  <button className='chat-options'><TbDotsVertical /></button>
                </div>
                <div className="message">{msg.text}</div>
              </div>
            ))
          )}
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
            disabled={!isConnected}
          />
          <button 
            onClick={sendMessage}
            disabled={!isConnected || !messageInput.trim()}
            className={!isConnected || !messageInput.trim() ? 'disabled' : ''}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;