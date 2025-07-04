import React from 'react';
import { RiGeminiFill } from "react-icons/ri";
import { FiEdit3 } from "react-icons/fi";
import { RxCross1 } from "react-icons/rx";
import axios from "axios";
import { useState } from 'react';
import "./GeminiChatBotSidebar.css";
import { Atom } from 'react-loading-indicators';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

import MarkdownIt from 'markdown-it';
const md = new MarkdownIt();

const ChatBotSidebar = ({ onClose, onInsertText }) => {
    const [prompt, setPrompt] = useState("");
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) {
            setReply("Please enter a prompt.");
            return;
        }
        setLoading(true);
        setReply("");
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/generate`, { prompt });
            setReply(res.data.reply);
        } catch (err) {
            console.error("Gemini Error:", err);
            setReply("Failed to generate response. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleUseIt = () => {
        if (reply && !loading) {
            const htmlContent = md.render(reply);
            onInsertText(htmlContent);
        }
    };

    return (
        <div className="gemini-wrapper">
            <div className="heading">
                <div className="head-container">
                    <RiGeminiFill />
                    <label htmlFor="">Gemini</label>
                </div>
                <div className="cancel">
                    <button className="cancel-btn" onClick={onClose}>
                        <RxCross1 />
                    </button>
                </div>
            </div>
            <div className="chat-container">
                <div className="chat-heading-container">
                    <div className="chat-head">
                        <FiEdit3 />
                        <label htmlFor="">Help me Write</label>
                    </div>
                </div>
                <div className="chat-area">
                    <input
                        type="text"
                        className="prompt-box"
                        value={prompt}
                        placeholder="Type your writing request here..."
                        onChange={e => setPrompt(e.target.value)}
                        disabled={loading}
                    />
                    <div className="gemini-reply">
                        {loading ? (
                            <Atom color="#3163cc" size="medium" text="" textColor="" />
                        ) : (
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {reply}
                            </ReactMarkdown>
                        )}
                    </div>
                </div>
                <div className="buttons">
                    <button className="generate" onClick={handleGenerate} disabled={loading || !prompt}>
                        Generate
                    </button>
                    <button
                        className="use-it"
                        onClick={handleUseIt}
                        disabled={!reply || loading}
                    >
                        Use it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBotSidebar;