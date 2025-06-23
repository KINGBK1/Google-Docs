import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Quill from "quill";
import { io } from "socket.io-client";
import "quill/dist/quill.snow.css";
import "./TextEditor.css";
import Delta from "quill-delta";

import TextEditorNavbar from "./TextEditorNavbar/TextEditorNavbar";
import ShareDialogBox from "./ShareDialogBox/ShareDialogBox";
import ChatBotSidebar from "./GeminiChatBotSidebar/ChatBotSidebar";

// Register Page Break blot
const PageBreak = Quill.import("blots/block/embed");
class CustomPageBreak extends PageBreak {
  static blotName = "pageBreak";
  static tagName = "hr";
  static className = "page-break";
}
Quill.register(CustomPageBreak);

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

const SAVE_INTERVAL_MS = 2000;

const TextEditor = () => {
  const { documentId } = useParams();
  const [quill, setQuill] = useState(null);
  const [docName, setDocName] = useState("Untitled Document");
  const [isOpen, setisOpen] = useState(false);
  const [isGeminiOpen, setisGeminiOpen] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const hasLoaded = useRef(false);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  const fetchUserId = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/status`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      if (!data.user?.id) {
        throw new Error("User ID not found in response");
      }
      return data.user.id;
    } catch (err) {
      console.error("Error fetching user ID:", err.message);
      return null;
    }
  };

  const WrapperRef = useCallback((wrapper) => {
    if (!wrapper) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.appendChild(editor);

    const q = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });

    // Filter pasted base64/Blob images
    q.clipboard.addMatcher("IMG", (node, delta) => {
      const src = node.getAttribute("src") || "";
      if (src.startsWith("data:") || src.startsWith("blob:")) return new Delta();
      return delta;
    });

    // Handle custom image uploads
    const toolbar = q.getModule("toolbar");
    toolbar.addHandler("image", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.click();

      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("image", file);
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/upload-image`, {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          if (!res.ok) {
            throw new Error(`Image upload failed: ${res.status}`);
          }
          const data = await res.json();
          const range = q.getSelection();
          if (range) {
            q.insertEmbed(range.index, "image", data.url);
          }
        } catch (err) {
          console.error("Image upload failed:", err.message);
        }
      };
    });

    // Add Page Break button
    const pageBreakBtn = document.createElement("button");
    pageBreakBtn.innerText = "PB";
    pageBreakBtn.onclick = () => {
      const range = q.getSelection();
      if (range) {
        q.insertEmbed(range.index, "pageBreak", true);
        q.setSelection(range.index + 1, Quill.sources.SILENT);
      }
    };
    toolbar.container.appendChild(pageBreakBtn);

    q.disable();
    setQuill(q);
  }, []);

  useEffect(() => {
    if (!quill || !documentId) return;

    hasLoaded.current = false;
    const s = io(`${import.meta.env.VITE_API_BASE_URL}`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = s;

    // Enable Socket.IO debugging
    localStorage.debug = 'socket.io-client:socket';

    s.on('connect', () => {
      console.log('Socket.IO connected:', s.id);
    });

    s.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
    });

    s.on('error', (err) => {
      console.error('Socket.IO server error:', err.message);
      if (err.message === 'Authentication error' || err.message === 'Invalid token') {
        navigate('/login');
      }
    });

    fetchUserId().then((userId) => {
      if (userId) {
        s.emit("get-document", { documentId, userId });
      } else {
        console.error('No user ID, cannot load document');
        navigate('/login');
      }
    });

    s.on("load-document", ({ content, name, isRestricted, isAllowed }) => {
      setIsRestricted(isRestricted);
      if (isRestricted && !isAllowed) {
        navigate(`/restricted/${documentId}`);
        return;
      }

      quill.setContents(content);
      quill.enable();

      if (!hasLoaded.current) {
        setDocName(name || "Untitled Document");
        hasLoaded.current = true;
      }

      setIsReady(true);
    });

    s.on("receive-changes", (delta) => {
      quill.updateContents(delta);
    });

    const handleTextChange = (delta, _, source) => {
      if (source === "user") {
        s.emit("send-changes", delta);
      }
    };

    quill.on("text-change", handleTextChange);

    return () => {
      s.disconnect();
      quill.off("text-change", handleTextChange);
      setIsReady(false);
    };
  }, [quill, documentId, navigate]);

  const saveDocument = useCallback(() => {
    if (!isReady || !quill) return;
    socketRef.current?.emit("save-document", {
      documentId,
      name: docName,
      content: quill.getContents(),
    });
  }, [quill, docName, documentId, isReady]);

  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(saveDocument, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [saveDocument, isReady]);

  const handleManualSave = () => saveDocument();
  const handleDocNameChange = (newName) => setDocName(newName);

  useEffect(() => {
    hasLoaded.current = false;
    setIsReady(false);
    setDocName("Untitled Document");
  }, [documentId]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
  }, [isOpen]);

  const insertText = (text) => {
    if (!quill) return;
    const range = quill.getSelection();
    if (range) {
      quill.insertText(range.index, text);
      quill.setSelection(range.index + text.length);
    } else {
      quill.insertText(0, text);
    }
  };

  return (
    <div className="container">
      <TextEditorNavbar
        docName={docName}
        onDocNameChange={handleDocNameChange}
        onSaveDocument={handleManualSave}
        setisOpen={setisOpen}
        setIsGeminiOpen={setisGeminiOpen}
      />
      <div className="text-editor-wrapper" ref={WrapperRef}></div>
      {isOpen && (
        <div className="dialog-backdrop">
          <ShareDialogBox
            isOpen={isOpen}
            setisOpen={setisOpen}
            documentId={documentId}
            isRestricted={isRestricted}
            setIsRestricted={setIsRestricted}
          />
        </div>
      )}
      {isGeminiOpen && (
        <div className="gemini-sidebar-container">
          <ChatBotSidebar
            onClose={() => setisGeminiOpen(false)}
            onInsertText={insertText}
          />
        </div>
      )}
    </div>
  );
};

export default TextEditor;