// src/components/Text Editor/TextEditor.jsx
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom"; // <— import this
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
  const { documentId } = useParams(); // <— get doc ID from URL
  const [quill, setQuill] = useState(null);
  const socketRef = useRef(null);

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

    // 1) Connect to Socket.IO
    socketRef.current = io("http://localhost:5000");

    const socket = socketRef.current;
    // 2) Ask server to load (or create) this particular document
    socket.emit("get-document", documentId);

    // 3) When server sends back the document content, set it in Quill
    socket.on("load-document", (document) => {
      quill.setContents(quill.clipboard.convert(document));
      quill.enable();
    });

    // 4) When someone else makes edits, apply their delta
    socket.on("receive-changes", (delta) => {
      quill.updateContents(delta);
    });

    // 5) When *you* edit, emit “send-changes”
    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handleTextChange);

    // 6) Periodically save to Mongo
    const saveInterval = setInterval(() => {
      socket.emit("save-document", quill.root.innerHTML);
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(saveInterval);
      socket.disconnect();
      quill.off("text-change", handleTextChange);
    };
  }, [quill, documentId]);

  return <div className="container" ref={WrapperRef}></div>;
};

export default TextEditor;
