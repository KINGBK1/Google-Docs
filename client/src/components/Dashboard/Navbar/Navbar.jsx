import { FaBars, FaSearch, FaTh } from "react-icons/fa";
import { FcDocument } from "react-icons/fc";
import "./Navbar.css"; 

const Navbar = () => {
  return (
    <div className="navbar-container">
      {/* Left: Docs logo */}
      <div className="navbar-left">
        <div className="icon-button">
          <FaBars />
        </div>
        <FcDocument size={32} />
        <span className="docs-title">Docs</span>
      </div>

      {/* Center: Search */}
      <div className="navbar-search">
        <FaSearch className="search-icon" />
        <input type="text" placeholder="Search" className="search-input" />
      </div>

      {/* Right: Grid + Profile */}
      <div className="navbar-right">
        <div className="icon-button">
          <FaTh />
        </div>
        <div className="profile-circle">B</div>
      </div>
    </div>
  );
};

export default Navbar;
