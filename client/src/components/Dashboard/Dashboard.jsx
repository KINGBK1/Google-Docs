// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./Navbar/Navbar";
import TemplateContainer from "./Templates/TemplateContainer";
import RecentDocs from "./Recent-Docs/RecentDocs";
import TextEditor from "../Text Editor/TextEditor";
import "./Dashboard.css";
import { v4 as uuidv4 } from "uuid"; 

const Dashboard = ({ isLoading , setIsAuthenticated}) => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 690);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 690);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
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
                  onClick={() => {
                    const newId = uuidv4();
                    navigate(`/documents/${newId}`);
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
  );
};

export default Dashboard;
