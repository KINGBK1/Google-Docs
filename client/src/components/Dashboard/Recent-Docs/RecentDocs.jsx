import React, { useState, useEffect } from "react";
import RecentDocCard from "./RecentDocCard/RecentDocCard";
import "./RecentDocs.css";
import { FaTableList } from "react-icons/fa6";
import { TiSortAlphabetically } from "react-icons/ti";
import { FaFolderMinus } from "react-icons/fa";
import { FourSquare } from "react-loading-indicators";

const RecentDocs = () => {
  const [recentDocs, setRecentDocs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (docId) => {
    // const token = localStorage.getItem("token");
    // if (!token) return alert("Please login again");

    try {
      if (!window.confirm("Are you sure you want to delete this document?")) return;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/${docId}`, {
        method: "DELETE",
        headers: {
          // Authorization: `Bearer ${token}`,
        },
        credentials:"include",
      });

      if (!response.ok) {
        const errorMsg = await response.json();
        throw new Error(errorMsg.message || "Delete failed");
      }

      // Remove from UI
      setRecentDocs(prev => prev.filter(doc => doc._id !== docId));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete document");
    }
  };


  useEffect(() => {
    const fetchRecentDocs = async () => {
      try {
        // const token = localStorage.getItem("token");
        // if (!token) {
        //   setError("Authentication token not found. Please log in again.");
        //   return;
        // }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/my-docs`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${token}`,
          },
          credentials:"include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Your session has expired. Please log in again.");
          }
          throw new Error("Failed to fetch documents");
        }

        const docs = await response.json();
        setRecentDocs(docs);
      } catch (err) {
        console.error("Error fetching recent documents:", err);
        setError(err.message);
      } finally {
        setLoading(false);
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
      <div className={`recent-doc-list ${loading ? 'flex-loader' : 'grid-layout'}`}>

        {loading ? (
          <div className="loader-container">
            <FourSquare color="#31a9cc" size="medium" text="" textColor="#333" />
          </div>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : recentDocs.length > 0 ? (
          recentDocs.map((doc) => (
            <RecentDocCard
              key={doc._id}
              id={doc._id}
              title={doc.name}
              subtitle={formatSubtitle(doc.updatedAt)}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <p>No recent documents found.</p>
        )}
      </div>

    </div>
  );
};

export default RecentDocs;
