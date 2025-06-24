import React from "react";
import "./skeletal-loader.css";

const SkeletonDashboard = () => {
  return (
    <div className="skeleton-wrapper">
      <div className="skeleton-top-bar shimmer"></div>

      <div className="skeleton-section-title shimmer"></div>

      <div className="skeleton-templates">
        {[...Array(7)].map((_, i) => (
          <div className="skeleton-template shimmer" key={i}></div>
        ))}
      </div>

      <div className="skeleton-section-title shimmer" style={{ width: "200px" }}></div>

      <div className="skeleton-recent-docs">
        {[...Array(6)].map((_, i) => (
          <div className="skeleton-doc-card" key={i}>
            <div className="skeleton-doc-preview shimmer"></div>
            <div className="skeleton-doc-title shimmer"></div>
            <div className="skeleton-doc-meta shimmer"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonDashboard;
