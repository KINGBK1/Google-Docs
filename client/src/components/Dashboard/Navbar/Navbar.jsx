import { useEffect, useState, useRef } from "react";
import { FaBars, FaSearch, FaTh } from "react-icons/fa";
import { FcDocument } from "react-icons/fc";
import "./Navbar.css";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/status`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Failed to fetch user from cookie session:", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSwitchAccount = () => {
    // Same as logout for cookie-based auth
    handleLogout();
  };

  return (
    <div className="navbar-container">
      {/* Left section */}
      <div className="navbar-left">
        <div className="icon-button">
          <FaBars />
        </div>
        <FcDocument size={32} />
        <span className="docs-title">Docs</span>
      </div>

      {/* Search section */}
      <div className="navbar-search">
        <FaSearch className="search-icon" />
        <input type="text" placeholder="Search" className="search-input" />
      </div>

      {/* Right section */}
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
                onClick={() => setDropdownOpen(!dropdownOpen)}
              />
            ) : (
              <div
                className="profile-circle"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {user.name?.[0] || "U"}
              </div>
            )}

            {dropdownOpen && (
              <div className="dropdown-menu">
                <p><strong>{user.name}</strong></p>
                <p>{user.email}</p>
                <hr />
                <button onClick={handleSwitchAccount}>Switch Account</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
