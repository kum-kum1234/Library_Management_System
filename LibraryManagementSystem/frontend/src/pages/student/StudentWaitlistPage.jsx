import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useStudent } from '../../context/StudentDataContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import {
  cancelWaitlist,
  getUserWaitlist,
  WAITLIST_STATUS
} from '../../utils/waitlist';
import { submitBookRequest } from '../../utils/bookRequests';

export default function StudentWaitlistPage() {
  const { loading, userId, profile } = useStudent();
  const [entries, setEntries] = useState([]);

  const load = useCallback(() => {
    if (userId) setEntries(getUserWaitlist(userId));
  }, [userId]);

  useEffect(() => {
    load();
    window.addEventListener('waitlist-updated', load);
    return () => window.removeEventListener('waitlist-updated', load);
  }, [load]);

  const handleCancel = (entry) => {
    cancelWaitlist(entry.id);
    toast.info('Removed from waitlist');
    load();
  };

  const handleClaim = (entry) => {
    const result = submitBookRequest({
      book: {
        id: entry.book_id,
        title: entry.bookTitle,
        author: entry.bookAuthor,
        category: entry.bookCategory
      },
      userId,
      username: profile?.username
    });
    if (result.ok) {
      toast.success('Issue request sent — admin will approve your reserved book');
    } else {
      toast.warning('Request already pending for this book');
    }
  };

  if (loading) return <LoadingSpinner label="Loading waitlist..." />;

  const active = entries.filter(
    (e) =>
      e.status !== WAITLIST_STATUS.CANCELLED && e.status !== WAITLIST_STATUS.EXPIRED
  );

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>My Waitlist</h1>
        <p>Books you are queued for when copies become available</p>
      </div>

      <div className="card table-card">
        {active.length === 0 ? (
          <EmptyState
            title="No waitlist entries"
            message="Join a waitlist when a book is unavailable."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Queue Position</th>
                <th>Estimated Wait</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {active.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <strong>{entry.bookTitle}</strong>
                    <span className="muted block">{entry.bookAuthor}</span>
                  </td>
                  <td>#{entry.position ?? '—'}</td>
                  <td>{entry.estimatedWait}</td>
                  <td><StatusBadge status={entry.status} /></td>
                  <td className="actions-cell">
                    {(entry.status === WAITLIST_STATUS.RESERVED ||
                      entry.status === WAITLIST_STATUS.NOTIFIED) && (
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => handleClaim(entry)}
                      >
                        Issue Request
                      </button>
                    )}
                    {entry.status === WAITLIST_STATUS.WAITING && (
                      <button
                        type="button"
                        className="btn-danger-outline btn-sm"
                        onClick={() => handleCancel(entry)}
                      >
                        Cancel Waitlist
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="muted" style={{ marginTop: 16 }}>
        <Link to="/student/books">Search more books →</Link>
      </p>
    </div>
  );
}
