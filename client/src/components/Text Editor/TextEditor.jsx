import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import { io } from "socket.io-client";
import "quill/dist/quill.snow.css";
import "./TextEditor.css";
import TextEditorNavbar from "./TextEditorNavbar/TextEditorNavbar";

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
  ["clean"]
];

const TextEditor = () => {
  const { documentId } = useParams();
  const [quill, setQuill] = useState(null);
  const socketRef = useRef(null);
  const [docName, setDocName] = useState("Untitled Document");
  const hasInitiallyLoadedRef = useRef(false);
  const [isQuillReady, setIsQuillReady] = useState(false);

  const WrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.appendChild(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    setQuill(q);
  }, []);

  useEffect(() => {
    if (!quill || !documentId) return;

    const s = io("http://localhost:5000");
    socketRef.current = s;

    if (!hasInitiallyLoadedRef.current) {
      s.emit("get-document", documentId);
    }

    s.on("load-document", (documentData) => {
      if (quill) {
        quill.setContents(documentData.content);
        if (!hasInitiallyLoadedRef.current) {
          setDocName(documentData.name || "Untitled Document");
          hasInitiallyLoadedRef.current = true;
        }
        setIsQuillReady(true);
        quill.enable();
      }
    });

    s.on("receive-changes", (delta) => {
      if (quill) quill.updateContents(delta);
    });

    const textChangeHandler = (delta, oldDelta, source) => {
      if (source !== "user" || !s) return;
      s.emit("send-changes", delta);
    };
    quill.on("text-change", textChangeHandler);

    return () => {
      s.disconnect();
      if (quill) {
        quill.off("text-change", textChangeHandler);
      }
      setIsQuillReady(false);
    };
  }, [quill, documentId]);

  const handleDocNameChange = (newName) => {
    setDocName(newName);
  };

  const saveDocument = useCallback(() => {
    if (quill && socketRef.current && isQuillReady && documentId) {
      const saveData = {
        content: quill.getContents(),
        name: docName,
        documentId: documentId,
      };
      socketRef.current.emit("save-document", saveData);
    } else {
      console.warn("Could not save: Document or editor not ready.");
    }
  }, [quill, docName, documentId, socketRef, isQuillReady]);

  useEffect(() => {
    if (!isQuillReady) return;

    const interval = setInterval(() => {
      saveDocument();
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [saveDocument, isQuillReady]);

  const handleManualSave = () => {
    console.log("Manual save triggered.");
    saveDocument();
  };

  useEffect(() => {
    hasInitiallyLoadedRef.current = false;
    setIsQuillReady(false);
    setDocName("Untitled Document");
  }, [documentId]);

  return (
    <div className="container">
      <TextEditorNavbar
        docName={docName}
        onDocNameChange={handleDocNameChange}
        onSaveDocument={handleManualSave}
      />
      <div className="text-editor-wrapper" ref={WrapperRef}></div>
    </div>
  );
};

export default TextEditor;