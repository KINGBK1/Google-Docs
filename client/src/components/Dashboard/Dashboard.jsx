// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./Navbar/Navbar";
import TemplateContainer from "./Templates/TemplateContainer";
import RecentDocs from "./Recent-Docs/RecentDocs";
import TextEditor from "../Text Editor/TextEditor";
import "./Dashboard.css";
import { v4 as uuidv4 } from "uuid";
import { ThemeProvider } from "../Dashboard/themes/ThemeContext";

const Dashboard = ({ isLoading, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 690);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return (
    <ThemeProvider>
      <div className="dashboard">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar
                  isMobile={isMobile}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  setIsAuthenticated={setIsAuthenticated}
                />
                {!isMobile && <TemplateContainer />}
                <RecentDocs
                  isLoading={isLoading}
                  isMobile={isMobile}
                  searchTerm={searchTerm}
                />
                {isMobile && (
                  <button
                    className="fab"
                    onClick={async () => {
                      const newId = uuidv4();
                      try {
                        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents`, {
                          method: "POST",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            documentId: newId,
                            name: "Untitled Document",
                            isRestricted: false,
                          }),
                        });
                        if (res.ok) {
                          navigate(`/documents/${newId}`);
                        } else {
                          const { message } = await res.json();
                          alert("Failed to create document: " + message);
                        }
                      } catch (err) {
                        alert("Server error while creating document.");
                        console.error(err);
                      }
                    }}
                    aria-label="New document"
                  >
                    +
                  </button>
                )}
              </>
            }
          />
          <Route path="documents/:documentId" element={<TextEditor />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
};
export default Dashboard;