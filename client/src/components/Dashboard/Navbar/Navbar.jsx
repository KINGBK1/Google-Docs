import { useEffect, useState, useRef } from "react";
import { FaBars, FaSearch, FaTh } from "react-icons/fa";
import { FcDocument } from "react-icons/fc";
import "./Navbar.css";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    console.log("Loaded user:", userData);
    setUser(userData);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload(); // Will redirect to login
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

        {/* Profile */}
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
