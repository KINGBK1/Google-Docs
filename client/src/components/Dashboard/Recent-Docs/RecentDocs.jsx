// src/components/Recent-Docs/RecentDocs.jsx
import React, { useState, useEffect } from "react";
import RecentDocCard from "./RecentDocCard/RecentDocCard";
import "./RecentDocs.css";
import { FaTableList } from "react-icons/fa6";
import { TiSortAlphabetically } from "react-icons/ti";
import { FaFolderMinus } from "react-icons/fa";
import { FourSquare } from "react-loading-indicators";

const RecentDocs = ({ isLoading, isMobile, searchTerm }) => {
  const [recentDocs, setRecentDocs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetchRecentDocs unchanged…

  useEffect(() => {
    async function fetchRecentDocs() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/documents/my-docs`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Fetch failed");
        const docs = await res.json();
        setRecentDocs(docs);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRecentDocs();
  }, []);

  const formatSubtitle = (dateString) => {
    const opts = { year: "numeric", month: "long", day: "numeric" };
    return `Last edited on ${new Date(dateString).toLocaleDateString(undefined, opts)}`;
  };

  // <-- define filtered
  const filtered = recentDocs.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const docsToShow = searchTerm.trim() ? filtered : recentDocs;

  return (
    <div className="recent-doc-wrapper">
      <div className="recent-doc-header">
        <div className="heading">
          <label>Recent documents</label>
        </div>
        {!isMobile && (
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
        )}
      </div>

      <div className={`recent-doc-list ${loading ? "flex-loader" : "grid-layout"}`}>
        {loading ? (
          <div className="loader-container">
            <FourSquare color="#31a9cc" size="medium" />
          </div>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : docsToShow.length > 0 ? (
          docsToShow.map((doc) => (
            <RecentDocCard
              key={doc._id}
              id={doc._id}
              title={doc.name}
              subtitle={formatSubtitle(doc.updatedAt)}
              onDelete={(id) => {fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/${id}`, {
                method: "DELETE",
                credentials: "include"
              }).then(alert(`do you want to delete ${doc.name}`))
              .then(() => setRecentDocs(recentDocs.filter(d => d._id !== id)));}}
              thumbnail={doc.thumbnail}
            />
          ))
        ) : (
          <p className="no-results">
            No documents match “{searchTerm}”
          </p>
        )}
      </div>
    </div>
  );
};

export default RecentDocs;
