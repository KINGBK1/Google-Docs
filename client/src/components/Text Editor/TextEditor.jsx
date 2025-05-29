// src/components/Text Editor/TextEditor.js
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Quill from "quill";
import { io } from "socket.io-client";
import "quill/dist/quill.snow.css";
import "./TextEditor.css";

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ font: [] }, { size: [] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ header: 1 }, { header: 2 }, { header: 3 }],
  [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
  [{ align: [] }],
  ["link", "image", "blockquote", "code-block"],
  ["clean"],
];

const TextEditor = () => {
  const { documentId } = useParams();
  const [quill, setQuill] = useState(null);
  const socketRef = useRef(null);
  const [docName, setDocName] = useState("");
  const navigate = useNavigate();

  const WrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = "";

    const editor = document.createElement("div");
    wrapper.appendChild(editor);

    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    setQuill(q);
  }, []);

  useEffect(() => {
    if (!quill || !documentId) return;

    socketRef.current = io("http://localhost:5000");
    const socket = socketRef.current;

    console.log("Connecting to socket...");

    socket.emit("get-document", documentId);
    console.log("Emitting get-document:", documentId);

    socket.on("load-document", (documentData) => {
      console.log("Received load-document:", documentData);
      quill.setContents(documentData.content);
      setDocName(documentData.name); // Set the document name
      quill.enable();
    });

    socket.on("receive-changes", (delta) => {
      console.log("Received receive-changes:", delta);
      quill.updateContents(delta);
    });

    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
      console.log("Emitting send-changes:", delta);
    };
    quill.on("text-change", handleTextChange);

    const saveInterval = setInterval(() => {
      if (quill) {
        const saveData = { content: quill.getContents(), name: docName };
        socket.emit("save-document", saveData);
        console.log("Emitting save-document:", saveData);
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(saveInterval);
      socket.disconnect();
      quill.off("text-change", handleTextChange);
    };
  }, [quill, documentId, docName]); // Added docName to dependency array

  const handleNameChange = (e) => {
    setDocName(e.target.value);
  };

  const handleBlur = () => {
    if (socketRef.current) {
      socketRef.current.emit("save-document", { content: quill?.getContents(), name: docName });
      console.log("Emitting save-document on blur:", { content: quill?.getContents(), name: docName });
    }
  };

  return (
    <div className="container">
      <input
        type="text"
        className="document-name-input"
        placeholder="Document Name"
        value={docName}
        onChange={handleNameChange}
        onBlur={handleBlur}
      />
      <div className="text-editor-wrapper" ref={WrapperRef}></div>
    </div>
  );
};

export default TextEditor;