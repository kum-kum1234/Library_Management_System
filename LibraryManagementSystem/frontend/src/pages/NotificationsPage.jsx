import React from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryDataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { buildNotifications } from '../utils/libraryData';

export default function NotificationsPage() {
  const { loading, books, transactions, users } = useLibrary();
  const notifications = buildNotifications({ transactions, books, users });

  if (loading) return <LoadingSpinner label="Loading notifications..." />;

  return (
    <div className="page-notifications">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Alerts derived from live library data</p>
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <EmptyState title="All clear" message="No alerts at the moment." />
        ) : (
          <ul className="notification-list">
            {notifications.map((n) => (
              <li key={n.id} className={`notification-item type-${n.type}`}>
                <div>
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                </div>
                <Link to={n.link} className="btn-link">View →</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
