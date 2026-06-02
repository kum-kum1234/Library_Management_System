import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiMenu, FiChevronDown, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../context/StudentDataContext';

export default function StudentNavbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { profile, notifications } = useStudent();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [dropdown, setDropdown] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/student/books?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="navbar student-navbar">
      <div className="navbar-left">
        <button type="button" className="icon-btn mobile-menu" onClick={onMenuToggle} aria-label="Menu">
          <FiMenu />
        </button>
        <form className="search-bar" onSubmit={handleSearch}>
          <FiSearch />
          <input
            type="search"
            placeholder="Search books by title, author, category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="navbar-right">
        <button
          type="button"
          className="icon-btn notification-btn"
          onClick={() => navigate('/student/notifications')}
        >
          <FiBell />
          {unread > 0 && <span className="nav-badge">{unread}</span>}
        </button>

        <div className="profile-dropdown-wrap">
          <button
            type="button"
            className="profile-box clickable"
            onClick={() => setDropdown((v) => !v)}
          >
            <div className="avatar">{user?.username?.charAt(0).toUpperCase()}</div>
            <div>
              <h4>{profile?.username || user?.username}</h4>
              <p>Student</p>
            </div>
            <FiChevronDown />
          </button>
          {dropdown && (
            <div className="profile-dropdown">
              <button type="button" onClick={() => { navigate('/student/profile'); setDropdown(false); }}>
                <FiUser /> Profile
              </button>
              <button type="button" onClick={() => { navigate('/student/change-password'); setDropdown(false); }}>
                <FiSettings /> Settings
              </button>
              <button type="button" onClick={() => { logout(); navigate('/login'); }}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
