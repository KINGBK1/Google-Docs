import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaSearch, FaTh, FaMoon, FaSun } from "react-icons/fa";
import { FcDocument } from "react-icons/fc";
import "./Navbar.css";

const Navbar = ({ isMobile, searchTerm, setSearchTerm }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const dropdownRef = useRef();
  const sidebarRef = useRef();
  const inputRef = useRef();

  // Fetch user on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/status`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Not authenticated");
        const { user } = await res.json();
        setUser(user);
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, []);

  // Close dropdown/sidebar on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !e.target.closest(".icon-button")
      ) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  // Logout handler
  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    navigate("/");
  };

  // Switch-account just logs out and sends back to login
  const handleSwitchAccount = () => {
    // you could clear tokens here if needed
    handleLogout();
  };

  const handleSearchSubmit = () => {
    inputRef.current.blur();
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter") handleSearchSubmit();
  };

  return (
    <>
      <div className="navbar-container">
        <div className="navbar-left">
          <div
            className="icon-button"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <FaBars />
          </div>
          <FcDocument size={32} />
          <span className="docs-title">Docs</span>
        </div>

        <div className="navbar-search">
          <FaSearch
            className="search-icon"
            onClick={handleSearchSubmit}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Docs"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>

        <div className="navbar-right">
          <div className="icon-button">
            <FaTh />
          </div>

          {user && (
            <div className="profile-wrapper" ref={dropdownRef}>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  className="profile-circle-img"
                  onClick={() => setDropdownOpen((o) => !o)}
                />
              ) : (
                <div
                  className="profile-circle"
                  onClick={() => setDropdownOpen((o) => !o)}
                >
                  {user.name?.[0] || "U"}
                </div>
              )}

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-avatar">
                    {user.picture ? (
                      <img src={user.picture} alt="Profile" />
                    ) : (
                      <div className="dropdown-avatar-fallback">
                        {user.name?.[0] || "U"}
                      </div>
                    )}
                  </div>
                  <div className="dropdown-info">
                    <p className="dropdown-name">{user.name}</p>
                    <p className="dropdown-email">{user.email}</p>
                  </div>
                  <div className="dropdown-actions">
                    <button onClick={handleSwitchAccount}>
                      Switch Account
                    </button>
                    <button onClick={handleLogout}>Log Out</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sliding Sidebar */}
      <div
        ref={sidebarRef}
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
      >
        <div className="sidebar-header">
          <FcDocument size={28} />
          <span className="sidebar-title">Google Docs</span>
        </div>
        <nav className="sidebar-nav">
          <a href="https://google-docs-7mav.vercel.app/"><img src="assets/Google_Docs_Logo.svg" alt="" />Docs</a>
          <a href="https://docs.google.com/spreadsheets"><img src="assets/Google_Slides_Logo.svg" alt="" /> Sheets</a>
          <a href="https://docs.google.com/presentation"><img src="assets/Google_Slides_Logo.svg" alt="S" /> Slides</a>
          <a href="https://docs.google.com/forms"><img src="assets/Google_Forms_Logo.svg" alt="" /> Forms</a>
          <hr />
          <button
            className="theme-toggle"
            onClick={() => setDarkMode((d) => !d)}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
            {darkMode ? " Light mode" : " Dark mode"}
          </button>
          <hr />
          <a href="/settings">⚙ Settings</a>
          <a href="/help">❓ Help & Feedback</a>
          <a href="https://drive.google.com">▶ Drive</a>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
