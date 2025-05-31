import React, { useState, useEffect } from "react";
import RecentDocCard from "./RecentDocCard/RecentDocCard";
import "./RecentDocs.css";
import { FaTableList } from "react-icons/fa6";
import { TiSortAlphabetically } from "react-icons/ti";
import { FaFolderMinus } from "react-icons/fa";

const RecentDocs = () => {
  const [recentDocs, setRecentDocs] = useState([]);

  useEffect(() => {
    const docs = [
      { id: "doc1", title: "Project Plan", subtitle: "Last edited 2 days ago" },
      { id: "doc2", title: "Meeting Notes", subtitle: "Last edited yesterday" },
      { id: "doc3", title: "Research Paper", subtitle: "Last edited today" },
      { id: "doc4", title: "Ideas Brainstorm", subtitle: "Last edited 3 days ago" },
    ];
    setRecentDocs(docs);
  }, []);

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
        {recentDocs.map((doc) => (
          <RecentDocCard
            key={doc.id}
            id={doc.id}
            title={doc.title}
            subtitle={doc.subtitle}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentDocs;
