// src/components/Dashboard/Dashboard.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar/Navbar";
import TemplateContainer from "./Templates/TemplateContainer";
import RecentDocs from "./Recent-Docs/RecentDocs";
import TextEditor from "../Text Editor/TextEditor"; // make sure this path matches your folder structure

const Dashboard = () => {
  return (
    <div>
      <Navbar />

      <Routes>
        {/* 1) When the URL is exactly /dashboard, show templates + recent docs */}
        <Route
          path="/"
          element={
            <>
              <TemplateContainer />
              <RecentDocs />
            </>
          }
        />

        {/* 2) When the URL is /dashboard/documents/:documentId, show the TextEditor */}
        <Route path="documents/:documentId" element={<TextEditor />} />
      </Routes>
    </div>
  );
};

export default Dashboard;
