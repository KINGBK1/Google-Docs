import React, { useState, useEffect } from "react";
import RecentDocCard from "./RecentDocCard/RecentDocCard";
import "./RecentDocs.css";
import { FaTableList } from "react-icons/fa6";
import { TiSortAlphabetically } from "react-icons/ti";
import { FaFolderMinus } from "react-icons/fa";

const RecentDocs = () => {
  const [recentDocs, setRecentDocs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          return;
        }

        // console.log("fetchRecentDocs token:", token); [FOR DEBUGGING]
        const response = await fetch("http://localhost:5000/api/documents/my-docs", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
          }
          throw new Error("Failed to fetch documents");
        }

        const docs = await response.json();
        // console.log("Frontend received docs:", docs);
        setRecentDocs(docs);
      } catch (err) {
        console.error("Error fetching recent documents:", err);
        setError(err.message);
      }
    };

    fetchRecentDocs();
  }, []);

  const formatSubtitle = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return `Last edited on ${new Date(dateString).toLocaleDateString(undefined, options)}`;
  };

  return (
    <div className="recent-doc-wrapper">
      <div className="recent-doc-header">
        <div className="heading">
          <label>Recent documents</label>
        </div>
        <div className="option-btns">
          <div className="list">
            <select name="owned-by" id="owned-by">
              <option value="owned-by-me">Owned By Me</option>
              <option value="owned-by-anyone">Owned By Anyone</option>
              <option value="not-owned-by-me">Not Owned By Me</option>
            </select>
          </div>
          <div className="btns">
            <button><FaTableList /></button>
            <button><TiSortAlphabetically /></button>
            <button><FaFolderMinus /></button>
          </div>
        </div>
      </div>

      <div className="recent-doc-list">
        {error && <p className="error-message">Error: {error}</p>}
        {recentDocs.length > 0 ? (
          recentDocs.map((doc) => (
            <RecentDocCard
              key={doc._id}
              id={doc._id}
              title={doc.name}
              subtitle={formatSubtitle(doc.updatedAt)}
            />
          ))
        ) : (
          !error && <p>No recent documents found.</p>
        )}
      </div>
    </div>
  );
};

export default RecentDocs;
