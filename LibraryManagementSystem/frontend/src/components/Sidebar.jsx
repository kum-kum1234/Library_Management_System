import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiBook,
  FiUsers,
  FiRepeat,
  FiList,
  FiBarChart2,
  FiBell,
  FiSettings,
  FiLogOut,
  FiDatabase,
  FiActivity,
  FiClock
} from 'react-icons/fi';
import { countActiveWaitlist } from '../utils/waitlist';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryDataContext';
import { buildNotifications } from '../utils/libraryData';

const NAV = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/books', label: 'Books', icon: FiBook },
  { to: '/waitlists', label: 'Waitlists', icon: FiClock },
  { to: '/users', label: 'Users', icon: FiUsers, admin: true },
  { to: '/issue-return', label: 'Issue / Return', icon: FiRepeat },
  { to: '/transactions', label: 'Transactions', icon: FiList },
  { to: '/reports', label: 'Reports', icon: FiBarChart2 },
  { to: '/notifications', label: 'Notifications', icon: FiBell },
  { to: '/settings', label: 'Settings', icon: FiSettings }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { books, transactions, users } = useLibrary();
  const notifications = buildNotifications({ transactions, books, users });
  const waitlistWaiting = countActiveWaitlist();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="logo">
          <span className="logo-icon">📘</span>
          <div>
            <strong>LibraryMS</strong>
            <small>Admin Panel</small>
          </div>
        </div>

        <nav className="menu">
          {NAV.filter((item) => !item.admin || user?.role === 'admin').map((item) => {
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
                {item.to === '/notifications' && notifications.length > 0 && (
                  <span className="menu-badge">{notifications.length}</span>
                )}
                {item.to === '/waitlists' && waitlistWaiting > 0 && (
                  <span className="menu-badge">{waitlistWaiting}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-section">
          <p className="sidebar-label">Others</p>
          <button type="button" className="sidebar-link" onClick={() => navigate('/settings')}>
            <FiDatabase /> Backup
          </button>
          <button type="button" className="sidebar-link" onClick={() => navigate('/reports')}>
            <FiActivity /> Activity Logs
          </button>
        </div>

        <div className="premium-card">
          <h4>Upgrade to Premium</h4>
          <p>Unlock advanced analytics and automated reminders.</p>
          <button type="button" className="btn-premium">Upgrade Now</button>
        </div>
      </div>

      <button type="button" className="logout-btn" onClick={handleLogout}>
        <FiLogOut /> Logout
      </button>
    </aside>
  );
}
