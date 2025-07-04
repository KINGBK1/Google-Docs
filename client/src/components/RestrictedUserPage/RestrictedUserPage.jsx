import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./RestrictedUserPage.css";

const RestrictedUserPage = () => {
  const { documentId } = useParams();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/status`,
          { credentials: "include" }
        );
        const data = await res.json();
        setUserEmail(data?.user?.email || "");
      } catch (err) {
        console.error("Failed to fetch user", err.message);
      }
    };

    fetchUser();
  }, []);

  const handleRequestAccess = async () => {
    const message = document.querySelector(".message-textarea").value;

    if (!userEmail) {
      alert("User email not found. Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/documents/${documentId}/request-access?email=${userEmail}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
          credentials: "include",
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert("Access request sent to the owner.");
    } catch (err) {
      alert("Failed to request access: " + err.message);
    }
  };

  return (
    <div className="restricted-page-container">
      <div className="restricted-page-card">
        <div className="card-content-section">
          <div className="google-docs-header">
            <svg
              className="google-docs-icon"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-3 15H9V8h2v9zm4-5h-2V8h2v4z" />
            </svg>
            <h1 className="google-docs-title">Google Docs</h1>
          </div>

          <h2 className="access-message-title">You need access</h2>
          <p className="access-message-text">
            Request access to this doc or switch to an account with access.{" "}
            <a href="#" className="learn-more-link">
              Learn more
            </a>
          </p>

          <textarea
            className="message-textarea"
            rows="4"
            placeholder="Message (optional)"
          ></textarea>

          <button onClick={handleRequestAccess} className="request-access-button">
            Request Access
          </button>

          <div className="signed-in-section">
            <p className="signed-in-text">You're signed in as</p>
            <div className="user-email-display">
              <svg
                className="user-avatar-icon"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="user-email">{userEmail || "Loading..."}</span>
            </div>
          </div>
        </div>

        <div className="illustration-section">
          <img
            src="/assets/undraw_invite-only_373f.svg"
            alt="Illustration of person accessing documents"
            className="illustration-image"
          />
        </div>
      </div>
    </div>
  );
};

export default RestrictedUserPage;
