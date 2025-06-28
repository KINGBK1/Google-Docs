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
import DriveUploadDialogBox from "./driveUploadDialogbox/DriveUploadDialogbox";


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
  const [saveStatus, setSaveStatus] = useState("idle");
  const saveTimeoutRef = useRef(null);
  const [needsSaving, setNeedsSaving] = useState(false);
  const [mode, setMode] = useState("editing"); // default mode is editing
  const [isDialogOpen, setDialogOpen] = useState(false);

const handleModeChange = async (newMode) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/documents/${documentId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: newMode }),
      }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    console.log("Mode updated:", data.document.mode);

    setMode(data.document.mode);

    // toggle editor
    if (data.document.mode === "viewing") quill.disable();
    else quill.enable();
  } catch (err) {
    console.error("Error updating mode:", err);
  }
};




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

  // … in TextEditor.jsx …

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

    // === 1) Remove any pasted base64/blob images ===
    q.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
      delta.ops = delta.ops.filter((op) => {
        if (op.insert && op.insert.image) {
          const src = op.insert.image;
          // drop if it's data: or blob:
          return !(src.startsWith("data:") || src.startsWith("blob:"));
        }
        return true;
      });
      return delta;
    });

    // === 2) Handle our own image uploads only ===
    const toolbar = q.getModule("toolbar");
    toolbar.addHandler("image", () => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("image", file);
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/upload-image`,
            {
              method: "POST",
              body: formData,
              credentials: "include",
            }
          );
          if (!res.ok) throw new Error(res.statusText);
          const { url } = await res.json();

          // insert Cloudinary URL into editor
          const range = q.getSelection(true);
          q.insertEmbed(range.index, "image", url, Quill.sources.USER);
          q.setSelection(range.index + 1, Quill.sources.SILENT);
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      };
    });

    // === 3) (Optional) Add page-break button ===
    const pageBreakBtn = document.createElement("button");
    pageBreakBtn.innerText = "PB";
    pageBreakBtn.onclick = () => {
      const range = q.getSelection(true);
      q.insertEmbed(range.index, "pageBreak", true, Quill.sources.USER);
      q.setSelection(range.index + 1, Quill.sources.SILENT);
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

    s.on("load-document", ({ content, name, isRestricted, isAllowed , mode: serverMode}) => {
      setIsRestricted(isRestricted);
      if (isRestricted && !isAllowed) {
        navigate(`/restricted/${documentId}`);
        return;
      }
      quill.setContents(content);
      setMode(mode || "editing"); // default to editing mode if not set

      if (mode === "viewing") {
        quill.disable();
      } else {
        quill.enable();
      }




      if (!hasLoaded.current) {
        setDocName(name || "Untitled Document");
        hasLoaded.current = true;
      }

      setIsReady(true);
    });

    s.on("receive-changes", (delta) => {
      quill.updateContents(delta);
    });

    // using debouncing to handle text changes
    const handleTextChange = (delta, _, source) => {
      if (source === "user") {
        socketRef.current?.emit("send-changes", delta);
        setNeedsSaving(true); // mark it dirty
        if (quill) {
          window.editorTextForDrive = quill.getText();
        }


        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          saveDocument();
        }, 1000);
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
    if (!isReady || !quill || !needsSaving) return;

    setSaveStatus("saving");

    socketRef.current?.emit("save-document", {
      documentId,
      name: docName,
      content: quill.getContents(),
    });

    setNeedsSaving(false); // reset after save

    // Simulate saving done
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
  }, [quill, docName, documentId, isReady, needsSaving]);




  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(saveDocument, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [saveDocument, isReady]);

  const handleManualSave = () => {
    saveDocument(); // manually call save
  };
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
      <div className="navbar-wrapper">
        <TextEditorNavbar
          docName={docName}
          onDocNameChange={handleDocNameChange}
          onSaveDocument={handleManualSave}
          saveStatus={saveStatus}
          setisOpen={setisOpen}
          setIsGeminiOpen={setisGeminiOpen}
          onModeChange={handleModeChange}
          mode={mode}
          isOpen={isDialogOpen}
          onClose={() => setDialogOpen(false)}
          documentName={docName}
          editorText={quill?.getText() || ""}
          onDriveClick={() => setDialogOpen(true)}

        />
      </div>
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
      {isDialogOpen && (
        <div className="drive-upload-dialog-container">
          <DriveUploadDialogBox
            isOpen={isDialogOpen}
            onClose={() => setDialogOpen(false)}
            documentName={docName}
          />
        </div>
      )}
    </div>
  );
};

export default TextEditor;