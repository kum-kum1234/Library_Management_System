import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';
import api from '../services/api';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';
import {
  getAllRequests,
  REQUEST_STATUS,
  updateRequestStatus
} from '../utils/bookRequests';

const TABS = [
  { key: REQUEST_STATUS.PENDING, label: 'Pending' },
  { key: REQUEST_STATUS.WAITLIST, label: 'Waitlist' },
  { key: REQUEST_STATUS.APPROVED, label: 'Approved' },
  { key: REQUEST_STATUS.REJECTED, label: 'Rejected' },
  { key: 'all', label: 'All' }
];

export default function BookRequestsPanel({ onRefresh }) {
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState(REQUEST_STATUS.PENDING);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setRequests(getAllRequests());
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('book-requests-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('book-requests-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, [load]);

  const filtered =
    tab === 'all' ? requests : requests.filter((r) => r.status === tab);

  const pendingCount = requests.filter((r) => r.status === REQUEST_STATUS.PENDING).length;

  const handleApprove = async (req) => {
    setBusyId(req.id);
    try {
      await api.post('/issue', {
        bookId: req.bookId,
        userId: req.userId,
        issueDate: new Date().toISOString().slice(0, 10)
      });
      updateRequestStatus(req.id, REQUEST_STATUS.APPROVED);
      toast.success(`Approved — "${req.title}" issued to ${req.username}`);
      load();
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data || 'Could not issue book. Check availability.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = (req) => {
    updateRequestStatus(req.id, REQUEST_STATUS.REJECTED);
    toast.info(`Request rejected for "${req.title}"`);
    load();
  };

  const handleWaitlist = (req) => {
    updateRequestStatus(req.id, REQUEST_STATUS.WAITLIST);
    toast.info(`"${req.title}" moved to waitlist`);
    load();
  };

  return (
    <div className="panel-card book-requests-panel">
      <div className="panel-header">
        <div>
          <h3>Book Request Approvals</h3>
          <p className="muted panel-subtitle">
            Student Request → Admin Approval → Book Issued
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="pending-pill">{pendingCount} pending</span>
        )}
      </div>

      <div className="request-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === REQUEST_STATUS.PENDING && pendingCount > 0 && (
              <span className="tab-count">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No requests in this queue"
          message={
            tab === REQUEST_STATUS.PENDING
              ? 'When students click Request Book, requests appear here.'
              : undefined
          }
        />
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Book</th>
                <th>Category</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id}>
                  <td>
                    <strong>{req.username}</strong>
                    <span className="muted block">ID: {req.userId}</span>
                  </td>
                  <td>
                    <strong>{req.title}</strong>
                    <span className="muted block">{req.author}</span>
                  </td>
                  <td>{req.category || '—'}</td>
                  <td>{req.createdAt?.slice(0, 10)}</td>
                  <td>
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="actions-cell request-actions">
                    {req.status === REQUEST_STATUS.PENDING && (
                      <>
                        <button
                          type="button"
                          className="btn-success btn-sm"
                          disabled={busyId === req.id}
                          onClick={() => handleApprove(req)}
                          title="Approve & issue book"
                        >
                          <FiCheck /> Approve
                        </button>
                        <button
                          type="button"
                          className="btn-danger-outline btn-sm"
                          onClick={() => handleReject(req)}
                          title="Reject request"
                        >
                          <FiX /> Reject
                        </button>
                        <button
                          type="button"
                          className="btn-warning btn-sm"
                          onClick={() => handleWaitlist(req)}
                          title="Add to waitlist"
                        >
                          <FiClock /> Waitlist
                        </button>
                      </>
                    )}
                    {req.status === REQUEST_STATUS.WAITLIST && (
                      <>
                        <button
                          type="button"
                          className="btn-success btn-sm"
                          disabled={busyId === req.id}
                          onClick={() => handleApprove(req)}
                        >
                          <FiCheck /> Approve
                        </button>
                        <button
                          type="button"
                          className="btn-danger-outline btn-sm"
                          onClick={() => handleReject(req)}
                        >
                          <FiX /> Reject
                        </button>
                      </>
                    )}
                    {(req.status === REQUEST_STATUS.APPROVED ||
                      req.status === REQUEST_STATUS.REJECTED) && (
                      <span className="muted">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
