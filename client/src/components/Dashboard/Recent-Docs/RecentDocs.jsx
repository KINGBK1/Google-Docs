import React, { useState, useEffect } from "react";
import RecentDocCard from "./RecentDocCard/RecentDocCard";
import "./RecentDocs.css";
import { FaTableList } from "react-icons/fa6";
import { TiSortAlphabetically } from "react-icons/ti";
import { FaFolderMinus } from "react-icons/fa";

const RecentDocs = () => {
  const [recentDocs, setRecentDocs] = useState([]);
  const [error, setError] = useState(null); // State to handle errors

  useEffect(() => {
    // Function to fetch documents from the backend
    const fetchRecentDocs = async () => {
      try {
        const token = localStorage.getItem("token"); // Get the auth token
        if (!token) {
          setError("User is not authenticated.");
          return;
        }

        // Fetch documents from your existing endpoint
        const response = await fetch("http://localhost:5000/api/documents/my-docs", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Include the token for authentication
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }

        const docs = await response.json();
        setRecentDocs(docs); // Update state with fetched documents
      } catch (err) {
        console.error("Error fetching recent documents:", err);
        setError(err.message);
      }
    };

    fetchRecentDocs();
  }, []); // The empty dependency array ensures this runs once on component mount

  // Helper function to format the date for the subtitle
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
        {/* Your existing option buttons are preserved */}
        <div className="option-btns">
          <div className="list">
            <select name="owned-by" id="owned-by">
              <option value="owned-by-me">Owned By Me</option>
              <option value="owned-by-anyone">Owned By Anyone</option>
              <option value="not-owned-by-me">Not Owned By Me</option>
            </select>
          </div>
          <div className="btns">
            <button>
              <FaTableList />
            </button>
            <button>
              <TiSortAlphabetically />
            </button>
            <button>
              <FaFolderMinus />
            </button>
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
              subtitle={formatSubtitle(doc.updatedAt)} // Format the date for display
            />
          ))
        ) : (
          !error && <p>No recent documents found.</p> // Show a message if there are no docs
        )}
      </div>
    </div>
  );
};

export default RecentDocs;