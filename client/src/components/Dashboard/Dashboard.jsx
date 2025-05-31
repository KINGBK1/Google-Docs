// src/components/Dashboard/Dashboard.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar/Navbar";
import TemplateContainer from "./Templates/TemplateContainer";
import RecentDocs from "./Recent-Docs/RecentDocs";
import TextEditor from "../Text Editor/TextEditor"; 

const Dashboard = () => {
  return (
    <div>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <TemplateContainer />
              <RecentDocs />
            </>
          }
        />
        <Route path="documents/:documentId" element={<TextEditor />} />
      </Routes>
    </div>
  );
};

export default Dashboard;
