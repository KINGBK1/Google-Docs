import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import { io } from "socket.io-client";
import "quill/dist/quill.snow.css";
import "./TextEditor.css";
import TextEditorNavbar from "./TextEditorNavbar/TextEditorNavbar";

const SAVE_INTERVAL_MS = 2000; // Keep periodic auto-save
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
  
  // Use a ref to track if the document has been loaded initially
  // This helps prevent overwriting user's name changes with data from server after initial load
  const hasInitiallyLoadedRef = useRef(false);
  const [isQuillReady, setIsQuillReady] = useState(false); // Tracks if Quill is setup and content loaded

  const WrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.appendChild(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable(); // Disable initially until content is loaded
    setQuill(q);
  }, []);

  // Effect for socket connection, document loading, and real-time changes
  useEffect(() => {
    if (!quill || !documentId) return;

    const s = io("http://localhost:5000");
    socketRef.current = s;

    // Request document only if it hasn't been initially loaded
    if (!hasInitiallyLoadedRef.current) {
        s.emit("get-document", documentId);
    }

    s.on("load-document", (documentData) => {
      if (quill) {
        quill.setContents(documentData.content);
        // Only set docName from server on the very first load for this documentId
        if (!hasInitiallyLoadedRef.current) {
          setDocName(documentData.name || "Untitled Document");
          hasInitiallyLoadedRef.current = true; // Mark as initially loaded
        }
        setIsQuillReady(true); // Mark Quill as ready with content
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
      // Don't reset hasInitiallyLoadedRef here unless component unmounts for a *new* documentId
      // If documentId changes, TextEditor will re-mount or this effect will re-run with new documentId,
      // and hasInitiallyLoadedRef being false for the new ID is implicitly handled by its nature.
      // Or, if documentId in params changes, reset it:
      // hasInitiallyLoadedRef.current = false; // Reset if documentId itself changes
      setIsQuillReady(false);
    };
  }, [quill, documentId]); // Runs when quill instance or documentId changes

  // Handler to update docName from TextEditorNavbar
  const handleDocNameChange = (newName) => {
    setDocName(newName);
  };

  // Centralized save function
  const saveDocument = useCallback(() => {
    if (quill && socketRef.current && isQuillReady && documentId) {
      const saveData = {
        content: quill.getContents(),
        name: docName, // Uses the current docName state
        documentId: documentId,
      };
      socketRef.current.emit("save-document", saveData);
      console.log(`Saving document: ID=${documentId}, Name=${docName}`);
      // You could add a visual "Saved!" indicator here
    } else {
      console.warn("Could not save: Document or editor not ready.");
    }
  }, [quill, docName, documentId, socketRef, isQuillReady]);


  // Effect for periodic auto-saving
  useEffect(() => {
    if (!isQuillReady) return; // Don't auto-save if not ready

    const interval = setInterval(() => {
      saveDocument();
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [saveDocument, isQuillReady]); // Re-runs if saveDocument or isQuillReady changes


  // Handler for manual save button click
  const handleManualSave = () => {
    console.log("Manual save triggered.");
    saveDocument();
  };
  
  // Reset initial load flag if documentId changes, ensuring new doc loads fresh
  useEffect(() => {
    hasInitiallyLoadedRef.current = false;
    setIsQuillReady(false);
    setDocName("Untitled Document"); // Reset doc name for new document
  }, [documentId]);


  return (
    <div className="container">
      <TextEditorNavbar
        docName={docName}
        onDocNameChange={handleDocNameChange}
        onSaveDocument={handleManualSave} // Pass manual save handler
      />
      <div className="text-editor-wrapper" ref={WrapperRef}></div>
    </div>
  );
};

export default TextEditor;