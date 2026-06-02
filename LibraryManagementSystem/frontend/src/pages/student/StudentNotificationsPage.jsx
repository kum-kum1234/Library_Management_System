import React from 'react';
import { Link } from 'react-router-dom';
import { useStudent } from '../../context/StudentDataContext';
import { markNotificationRead } from '../../utils/waitlist';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function StudentNotificationsPage() {
  const { loading, notifications } = useStudent();

  if (loading) return <LoadingSpinner label="Loading notifications..." />;

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Due reminders, fines, and issue updates</p>
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <EmptyState title="No notifications" message="You're all caught up." />
        ) : (
          <ul className="notification-list">
            {notifications.map((n) => (
              <li key={n.id} className={`notification-item type-${n.type} ${n.read ? 'read' : ''}`}>
                <div>
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                </div>
                <Link
                  to={n.link}
                  className="btn-link"
                  onClick={() => {
                    if (String(n.id).startsWith('wl-n-')) {
                      markNotificationRead(Number(String(n.id).replace('wl-n-', '')));
                    }
                  }}
                >
                  View →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
