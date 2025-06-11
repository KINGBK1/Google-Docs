import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
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
  ["clean"],
];

const TextEditor = () => {
  const { documentId } = useParams();
  const [quill, setQuill] = useState(null);

  const socketRef = useRef(null); // socketRef = {current:null} 

  const [docName, setDocName] = useState("Untitled Document");

  const hasLoaded = useRef(false); // creating a hasLoaded object like -> hasLoaded = {current: true}


  const [isReady, setIsReady] = useState(false);

  const WrapperRef = useCallback((wrapper) => {
    if (!wrapper) return;
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

    const s = io("http://localhost:5000"); // creating an instance of the io(<url of the backend server>)
    socketRef.current = s;

    if (!hasLoaded.current) {
      let userId = null;
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token); // extarcting the username from the jwt-token i created during login
          // console.log('decoded : ',decoded) ; 

          // decoded :  
          // {id: '684684d4fe04f2ce7bc8419b', email: 'bishalkunwar140405@gmail.com', iat: 1749451988, exp: 1749455588}
          // email
          // : 
          // "bishalkunwar140405@gmail.com"
          // exp
          // : 
          // 1749455588
          // iat
          // : 
          // 1749451988
          // id
          // : 
          // "684684d4fe04f2ce7bc8419b"


          userId = decoded.id;
        } catch (err) {
          console.error("Failed to decode JWT:", err);
        }
      }

      s.emit("get-document", { documentId, userId }); // sending the document id and the user id to the backend 
    }

    s.on("load-document", ({ content, name }) => {
      quill.setContents(content); // setting the content to the content that is stored in my DB
      quill.enable();  // enabling typing in the editor 
      if (!hasLoaded.current) {
        setDocName(name || "Untitled Document"); // if name is not given then keep the default name as Untitled Document
        hasLoaded.current = true; 
      }
      setIsReady(true);
    });

    s.on("receive-changes", (delta) => {
      if (quill) quill.updateContents(delta);
    });

    const handleTextChange = (delta, _, source) => {
      if (source !== "user") return;
      s.emit("send-changes", delta);
    };

    quill.on("text-change", handleTextChange);

    return () => {
      s.disconnect();
      quill.off("text-change", handleTextChange);
      setIsReady(false);
    };
  }, [quill, documentId]);

  const saveDocument = useCallback(() => {
    if (!isReady) return;
    const payload = {
      documentId,
      name: docName,
      content: quill.getContents(),
    };
    socketRef.current.emit("save-document", payload);
  }, [quill, docName, documentId, isReady]);

  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(saveDocument, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [saveDocument, isReady]);

  function handleManualSave() {
    console.log("Manual save triggered.");
    saveDocument();
  }

  const handleDocNameChange = (newName) => setDocName(newName);

  useEffect(() => {
    hasLoaded.current = false;
    setIsReady(false);
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
