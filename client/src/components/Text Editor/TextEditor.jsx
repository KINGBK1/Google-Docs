import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import "quill/dist/quill.snow.css";
import "./TextEditor.css";
import ImageUploader from "quill-image-uploader";
Quill.register("modules/imageUploader", ImageUploader);

import TextEditorNavbar from "./TextEditorNavbar/TextEditorNavbar";
import ShareDialogBox from "./ShareDialogBox/ShareDialogBox";

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
  const [docName, setDocName] = useState("Untitled Document");
  const hasLoaded = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setisOpen] = useState(false);

  const WrapperRef = useCallback((wrapper) => {
    if (!wrapper) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.appendChild(editor);

    const q = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
        imageUploader: {
          upload: async (file) => {
            const formData = new FormData();
            formData.append("image", file);
            const response = await fetch("http://localhost:5000/api/upload-image", {
              method: "POST",
              body: formData,
            });
            const data = await response.json();
            return data.url;
          },
        },
      },
    });

    // Prevent paste/drop base64 or blob images
    q.clipboard.addMatcher("IMG", function (node, delta) {
      const src = node.getAttribute("src") || "";
      if (src.startsWith("data:") || src.startsWith("blob:")) {
        return new Delta(); // remove the image
      }
      return delta;
    });

    // Override image handler to suppress default blob insert
    const toolbar = q.getModule("toolbar");
    toolbar.addHandler("image", () => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();
      input.onchange = async () => {
        const file = input.files[0];
        if (file) {
          const formData = new FormData();
          formData.append("image", file);
          try {
            const res = await fetch("http://localhost:5000/api/upload-image", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            const range = q.getSelection();
            q.insertEmbed(range.index, "image", data.url);
          } catch (err) {
            console.error("Image upload failed:", err);
          }
        }
      };
    });

    q.disable();
    setQuill(q);
  }, []);


  useEffect(() => {
    if (!quill || !documentId) return;

    const s = io("http://localhost:5000");
    socketRef.current = s;

    if (!hasLoaded.current) {
      let userId = null;
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          userId = decoded.id;
        } catch (err) {
          console.error("Failed to decode JWT:", err);
        }
      }
      s.emit("get-document", { documentId, userId });
    }

    s.on("load-document", ({ content, name }) => {
      quill.setContents(content);
      quill.enable();
      if (!hasLoaded.current) {
        setDocName(name || "Untitled Document");
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
    if (!isReady || !quill) return;
    const payload = {
      documentId,
      name: docName,
      content: quill.getContents(),
    };
    if (socketRef.current) {
      socketRef.current.emit("save-document", payload);
    }
  }, [quill, docName, documentId, isReady]);

  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(saveDocument, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [saveDocument, isReady]);

  const handleManualSave = () => {
    saveDocument();
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

  return (
    <div className="container">
      <TextEditorNavbar
        docName={docName}
        onDocNameChange={handleDocNameChange}
        onSaveDocument={handleManualSave}
        setisOpen={setisOpen}
      />
      <div className="text-editor-wrapper" ref={WrapperRef}></div>
      {isOpen && (
        <div className="dialog-backdrop">
          <ShareDialogBox isOpen={isOpen} setisOpen={setisOpen} />
        </div>
      )}
    </div>
  );
};

export default TextEditor;
