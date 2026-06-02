import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiTrash2, FiBell } from 'react-icons/fi';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';
import api from '../services/api';
import {
  WAITLIST_STATUS
} from '../utils/waitlist';

export default function WaitlistManagementPanel({ fullPage }) {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {

  try {

    const res = await api.get(
      '/waitlists'
    );

    console.log(res.data);

    setEntries(
      res.data.waitlists || []
    );

  } catch (err) {

    console.error(err);
  }

}, []);

  useEffect(() => {
    load();
  }, [load]);

  const approveReservation = async (id) => {

  try {

    await api.put(
      `/waitlists/${id}/approve`
    );

    toast.success(
      'Reservation approved'
    );

    load();

  } catch (err) {

    console.error(err);

    toast.error(
      'Approval failed'
    );
  }
};

const notifyStudent = async (id) => {

  try {

    await api.put(
      `/waitlists/${id}/notify`
    );

    toast.success(
      'Student notified'
    );

    load();

  } catch (err) {

    console.error(err);

    toast.error(
      'Notification failed'
    );
  }
};

const removeWaitlist = async (id) => {

  try {

    await api.delete(
      `/waitlists/${id}`
    );

    toast.success(
      'Entry removed'
    );

    load();

  } catch (err) {

    console.error(err);

    toast.error(
      'Remove failed'
    );
  }
};
  const filtered =
    filter === 'all' ? entries : entries.filter((e) => e.status === filter);

  return (
    <div className={`panel-card waitlist-panel ${fullPage ? '' : 'dashboard-waitlist'}`}>
      {!fullPage && (
        <div className="panel-header">
          <h3>Waitlist Management</h3>
          <span className="pending-pill">
            {entries.filter((e) => e.status === WAITLIST_STATUS.WAITING).length} waiting
          </span>
        </div>
      )}

      <div className="request-tabs">
        {['all', WAITLIST_STATUS.WAITING, WAITLIST_STATUS.RESERVED, WAITLIST_STATUS.NOTIFIED].map(
          (key) => (
            <button
              key={key}
              type="button"
              className={filter === key ? 'tab active' : 'tab'}
              onClick={() => setFilter(key)}
            >
              {key === 'all' ? 'All' : key}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No waitlist entries" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Student</th>
              <th>Position</th>
              <th>Request Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <strong>{entry.bookTitle}</strong>
                  <span className="muted block">{entry.bookCategory}</span>
                </td>
                <td>
                  {entry.username}
                  <span className="muted block">
                    {entry.userRole} · ID {entry.user_id}
                  </span>
                </td>
                <td>#{entry.position}</td>
                <td>{entry.joined_at?.slice(0, 10)}</td>
                <td><StatusBadge status={entry.status} /></td>
                <td className="actions-cell request-actions">
                  {entry.status === WAITLIST_STATUS.WAITING && (
                    <>
                      <button
                        type="button"
                        className="btn-success btn-sm"
                        onClick={() => {
                          approveReservation(entry.id);
                          toast.success(`Reserved for ${entry.username}`);
                          load();
                        }}
                      >
                        <FiCheck /> Approve
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => {
                          notifyStudent(entry.id);
                          toast.success('Notification sent');
                          load();
                        }}
                      >
                        <FiBell /> Notify
                      </button>
                      <button
                        type="button"
                        className="btn-danger-outline btn-sm"
                        onClick={() => {
                          removeWaitlist(entry.id);
                          toast.info('Removed from waitlist');
                          load();
                        }}
                      >
                        <FiTrash2 /> Remove
                      </button>
                    </>
                  )}
                  {(entry.status === WAITLIST_STATUS.RESERVED ||
                    entry.status === WAITLIST_STATUS.NOTIFIED) && (
                    <button
                      type="button"
                      className="btn-danger-outline btn-sm"
                      onClick={() => {
                        removeFromWaitlist(entry.id);
                        load();
                      }}
                    >
                      <FiTrash2 /> Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
