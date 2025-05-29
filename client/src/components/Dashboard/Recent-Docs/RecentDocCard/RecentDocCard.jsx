import React from "react";
import { useNavigate } from "react-router-dom";
import "./RecentDocsCard.css";

const RecentDocCard = ({ id, title, subtitle }) => {
  const navigate = useNavigate();

  const openDocument = () => {
    navigate(`/dashboard/documents/${id}`);
  };

  return (
    <div className="recent-doc-card" onClick={openDocument} role="button" tabIndex={0} onKeyPress={openDocument}>
      <div className="recent-doc-thumbnail">
        {/* Placeholder thumbnail */}
      </div>
      <div className="recent-doc-caption">
        <div className="recent-doc-title">{title}</div>
        <div className="recent-doc-subtitle">{subtitle}</div>
      </div>
    </div>
  );
};

export default RecentDocCard;
