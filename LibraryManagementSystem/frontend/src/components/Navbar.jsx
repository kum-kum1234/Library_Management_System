import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiBell, FiSun, FiMoon, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryDataContext';
import { buildNotifications } from '../utils/libraryData';

export default function Navbar({ onMenuToggle }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { books, transactions, users } = useLibrary();
  const notifications = buildNotifications({ transactions, books, users });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/books?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button type="button" className="icon-btn mobile-menu" onClick={onMenuToggle} aria-label="Menu">
          <FiMenu />
        </button>
        <form className="search-bar" onSubmit={handleSearch}>
          <FiSearch />
          <input
            type="search"
            placeholder="Search books, users, transactions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>Ctrl + /</kbd>
        </form>
      </div>

      <div className="navbar-right">
        <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <FiMoon /> : <FiSun />}
        </button>

        <button
          type="button"
          className="icon-btn notification-btn"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <FiBell />
          {notifications.length > 0 && (
            <span className="nav-badge">{notifications.length}</span>
          )}
        </button>

        <div className="profile-box">
          <div className="avatar">{user?.username?.charAt(0).toUpperCase()}</div>
          <div>
            <h4>{user?.username || 'Admin'}</h4>
            <p>{user?.role === 'admin' ? 'Super Admin' : 'Librarian'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
