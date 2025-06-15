import React from "react";
import { useNavigate } from "react-router-dom";
import "./RecentDocsCard.css";

const RecentDocCard = ({ id, title, subtitle, onDelete }) => {
  const navigate = useNavigate();

  const openDocument = () => {
    navigate(`/documents/${id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // prevent bubbling to card click
    onDelete(id); // call delete handler passed from parent
  };

  return (
    <div
      className="recent-doc-card"
      onClick={openDocument}
      role="button"
      tabIndex={0}
      onKeyPress={openDocument}
    >
      <div className="recent-doc-thumbnail">
        {/* Placeholder thumbnail */}
      </div>
      <div className="recent-doc-caption">
        <div className="recent-doc-title">{title}</div>
        <div className="recent-doc-subtitle">{subtitle}</div>
        <div className="btn-cont">
          <button
            className="delete-btn"
            onClick={handleDeleteClick}
          >Delete</button>
        </div>
      </div>
    </div>
  );
};

export default RecentDocCard;
