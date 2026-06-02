import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiSearch,
  FiBook,
  FiList,
  FiCreditCard,
  FiBell,
  FiUser,
  FiLock,
  FiLogOut,
  FiClock,
  FiBookmark
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../context/StudentDataContext';

const NAV = [
  { to: '/student/dashboard', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/student/books', label: 'Search Books', icon: FiSearch },
  { to: '/student/my-books', label: 'My Books', icon: FiBook },
  { to: '/student/reservations', label: 'My Reservations', icon: FiBookmark },
  { to: '/student/waitlist', label: 'My Waitlist', icon: FiClock },
  { to: '/student/transactions', label: 'My Transactions', icon: FiList },
  { to: '/student/fines-payments', label: 'Fines & Payments', icon: FiCreditCard },
  { to: '/student/notifications', label: 'Notifications', icon: FiBell },
  { to: '/student/profile', label: 'Profile', icon: FiUser },
  { to: '/student/change-password', label: 'Change Password', icon: FiLock }
];

export default function StudentSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { notifications } = useStudent();
  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar student-sidebar">
      <div>
        <div className="logo">
          <span className="logo-icon">📘</span>
          <div>
            <strong>LibraryMS</strong>
            <small>Student Panel</small>
          </div>
        </div>

        <nav className="menu">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon />
                <span>{item.label}</span>
                {item.to === '/student/notifications' && unread > 0 && (
                  <span className="menu-badge">{unread}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="premium-card student-promo">
          <span className="promo-emoji">📚</span>
          <h4>Expand Your Knowledge</h4>
          <p>Discover new books in the catalog.</p>
          <button type="button" className="btn-premium" onClick={() => navigate('/student/books')}>
            Browse Books
          </button>
        </div>
      </div>

      <button type="button" className="logout-btn" onClick={handleLogout}>
        <FiLogOut /> Logout
      </button>
    </aside>
  );
}
