import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiCreditCard,
  FiDownload,
  FiEye,
  FiAlertCircle,
  FiBook
} from 'react-icons/fi';
import api from '../../services/api';
import { useStudent } from '../../context/StudentDataContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import PaymentCard from '../../components/PaymentCard';
import { downloadFineReceipt } from '../../utils/paymentReceipt';

function PaymentStatusBadge({ status }) {
  const key = (status || 'PENDING').toUpperCase();
  const variant =
    key === 'PAID' ? 'success' : key === 'FAILED' ? 'danger' : 'warning';
  return <span className={`badge badge-${variant}`}>{key}</span>;
}

export default function StudentFinesPage() {
  const { loading: ctxLoading, refresh: ctxRefresh, profile } = useStudent();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [fines, setFines] = useState([]);
  const [payModal, setPayModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, finesRes] = await Promise.all([
        api.get('/student/fines-summary'),
        api.get('/student/fines')
      ]);
      setSummary(summaryRes.data);
      setFines(finesRes.data.fines || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to load fines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshAll = async () => {
    await loadData();
    ctxRefresh();
  };

  const pendingRows = useMemo(
    () =>
      fines.filter(
        (f) => (f.fine > 0 || f.status === 'payment_pending') && f.paymentStatus !== 'PAID'
      ),
    [fines]
  );

  const paidRows = useMemo(
    () => fines.filter((f) => f.paymentStatus === 'PAID' && f.fine > 0),
    [fines]
  );

  const handleDownloadReceipt = (row) => {
    if (row.paymentStatus !== 'PAID') {
      toast.warning('Receipt available after payment is completed');
      return;
    }
    downloadFineReceipt({
      studentName: profile?.username,
      bookName: row.bookTitle,
      transactionId: row.id,
      fineAmount: row.fine,
      paymentMethod: row.paymentMethod,
      paymentDate: row.paymentDate,
      paymentStatus: row.paymentStatus
    });
    toast.success('Receipt downloaded');
  };

  if (loading || ctxLoading) {
    return <LoadingSpinner label="Loading fines & payments..." />;
  }

  return (
    <div className="student-page student-fines-page">
      <div className="page-header">
        <div>
          <h1>Fines & Payments</h1>
          <p>Manage overdue fines and payment history</p>
        </div>
      </div>

      <div className="fines-summary-grid">
        <div className="fines-summary-card fines-card-pending">
          <p className="fines-card-label">Pending Fine Amount</p>
          <h2>₹{Number(summary?.pendingAmount || 0).toFixed(2)}</h2>
          {pendingRows.length > 0 && (
            <button
              type="button"
              className="btn-warning fines-pay-now"
              onClick={() => setPayModal(pendingRows[0])}
            >
              Pay Now
            </button>
          )}
        </div>
        <div className="fines-summary-card fines-card-paid">
          <p className="fines-card-label">Paid Fines</p>
          <h2>₹{Number(summary?.paidAmount || 0).toFixed(2)}</h2>
        </div>
        <div className="fines-summary-card fines-card-overdue">
          <p className="fines-card-label">Overdue Books</p>
          <h2>{summary?.overdueBooks ?? 0}</h2>
        </div>
        <div className="fines-summary-card fines-card-status">
          <p className="fines-card-label">Payment Status</p>
          <h2>
            <PaymentStatusBadge status={summary?.overallPaymentStatus || 'PAID'} />
          </h2>
        </div>
      </div>

      {summary?.hasUnpaidFines && (
        <div className="fines-warning-banner">
          <FiAlertCircle />
          <span>
            Please clear pending fines before issuing new books.
          </span>
        </div>
      )}

      <div className="card table-card">
        <h3>My Fines</h3>
        {fines.length === 0 ? (
          <EmptyState
            title="No fines on record"
            message="You have no overdue fines or pending payments."
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table fines-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Late Days</th>
                  <th>Fine</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="fines-book-cell">
                        <div className="fines-book-cover">
                          {row.coverImage ? (
                            <img src={row.coverImage} alt="" />
                          ) : (
                            <FiBook />
                          )}
                        </div>
                        <div>
                          <strong>{row.bookTitle}</strong>
                          <small className="muted">{row.bookAuthor}</small>
                        </div>
                      </div>
                    </td>
                    <td>{row.issueDate?.slice(0, 10)}</td>
                    <td>{row.dueDate?.slice(0, 10)}</td>
                    <td>{row.lateDays ?? 0}</td>
                    <td>₹{Number(row.fine || 0).toFixed(2)}</td>
                    <td>
                      <PaymentStatusBadge status={row.paymentStatus} />
                    </td>
                    <td className="actions-cell">
                      {row.paymentStatus !== 'PAID' && row.fine > 0 && (
                        <button
                          type="button"
                          className="btn-warning btn-sm"
                          onClick={() => setPayModal(row)}
                        >
                          <FiCreditCard /> Pay Fine
                        </button>
                      )}
                      {row.paymentStatus === 'PAID' && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => handleDownloadReceipt(row)}
                        >
                          <FiDownload /> Receipt
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setDetailModal(row)}
                      >
                        <FiEye /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paidRows.length > 0 && (
        <div className="card table-card" style={{ marginTop: 20 }}>
          <h3>Payment History</h3>
          <ul className="simple-list payment-history-list">
            {paidRows.map((row) => (
              <li key={row.id} className="payment-history-item">
                <div>
                  <strong>{row.bookTitle}</strong>
                  <span className="muted">
                    {' '}
                    — ₹{Number(row.fine).toFixed(2)} via {row.paymentMethod || '—'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => handleDownloadReceipt(row)}
                >
                  <FiDownload /> Download Receipt
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={!!payModal}
        title="Complete Fine Payment"
        onClose={() => setPayModal(null)}
        wide
      >
        {payModal && (
          <PaymentCard
            variant="student"
            transactionId={payModal.id}
            fine={payModal.fine}
            lateDays={payModal.lateDays}
            bookName={payModal.bookTitle}
            studentName={profile?.username}
            dueDate={payModal.dueDate?.slice(0, 10)}
            onPaymentVerified={() => {
              refreshAll();
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!detailModal}
        title="Transaction Details"
        onClose={() => setDetailModal(null)}
      >
        {detailModal && (
          <div className="fine-detail-grid">
            <p>
              <span>Transaction ID</span> <strong>#{detailModal.id}</strong>
            </p>
            <p>
              <span>Book</span> <strong>{detailModal.bookTitle}</strong>
            </p>
            <p>
              <span>Issue Date</span> <strong>{detailModal.issueDate}</strong>
            </p>
            <p>
              <span>Due Date</span> <strong>{detailModal.dueDate}</strong>
            </p>
            <p>
              <span>Return Date</span>{' '}
              <strong>{detailModal.returnDate || '—'}</strong>
            </p>
            <p>
              <span>Late Days</span> <strong>{detailModal.lateDays}</strong>
            </p>
            <p>
              <span>Fine</span> <strong>₹{Number(detailModal.fine).toFixed(2)}</strong>
            </p>
            <p>
              <span>Status</span>{' '}
              <PaymentStatusBadge status={detailModal.paymentStatus} />
            </p>
            <p>
              <span>Transaction Status</span>{' '}
              <strong>{(detailModal.status || '').toUpperCase()}</strong>
            </p>
            {detailModal.paymentStatus !== 'PAID' && detailModal.fine > 0 && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setDetailModal(null);
                  setPayModal(detailModal);
                }}
              >
                Pay Fine
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
