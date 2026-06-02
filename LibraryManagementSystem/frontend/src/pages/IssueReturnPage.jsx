import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import { useLibrary } from '../context/LibraryDataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import {
  addDays,
  LOAN_PERIOD_DAYS,
  FINE_RATE,
  enrichTransactions
} from '../utils/libraryData';
import { processBookReturned } from '../utils/waitlist';

function computeLateDays(daysKept) {
  const kept = Number(daysKept) || 0;
  return kept > LOAN_PERIOD_DAYS ? kept - LOAN_PERIOD_DAYS : 0;
}

function computeFineFromDays(daysKept) {
  return computeLateDays(daysKept) * FINE_RATE;
}

function PaymentStatusBadge({ status }) {
  const key = (status || 'PENDING').toUpperCase();
  const variant = key === 'PAID' ? 'success' : key === 'FAILED' ? 'danger' : 'warning';
  return <span className={`badge badge-${variant}`}>{key}</span>;
}

export default function IssueReturnPage() {
  const { loading, books, users, transactions, refresh } = useLibrary();
  const [issueForm, setIssueForm] = useState({
    bookId: '',
    userId: '',
    issueDate: new Date().toISOString().slice(0, 10)
  });
  const [returnForm, setReturnForm] = useState({
    transactionId: '',
    returnDate: new Date().toISOString().slice(0, 10),
    daysKept: ''
  });
  const [verifyForm, setVerifyForm] = useState({ transactionId: '' });
  const [searchTx, setSearchTx] = useState('');
  const [returning, setReturning] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const enriched = useMemo(
    () => enrichTransactions(transactions, books, users),
    [transactions, books, users]
  );

  const activeIssued = enriched.filter(
    (t) => t.displayStatus === 'issued' || t.displayStatus === 'overdue'
  );

  const pendingPayments = enriched.filter((t) => t.displayStatus === 'payment_pending');

  const selectedTx = enriched.find((t) => String(t.id) === String(returnForm.transactionId));
  const verifyTx = enriched.find((t) => String(t.id) === String(verifyForm.transactionId));

  const lateDays = computeLateDays(returnForm.daysKept);
  const calculatedFine = computeFineFromDays(returnForm.daysKept);

  const issueBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/issue', {
        bookId: Number(issueForm.bookId),
        userId: Number(issueForm.userId),
        issueDate: issueForm.issueDate
      });
      toast.success('Book issued successfully');
      refresh();
    } catch (err) {
      const data = err?.response?.data;
      toast.error(data?.error || data || 'Issue failed');
    }
  };

  const returnBook = async (e) => {
    e.preventDefault();
    setReturning(true);
    try {
      const res = await api.post('/return', {
        transactionId: Number(returnForm.transactionId),
        returnDate: returnForm.returnDate,
        daysKept: Number(returnForm.daysKept)
      });

      const tx = enriched.find((t) => t.id === Number(returnForm.transactionId));
      if (tx) {
        const next = processBookReturned(tx.bookId, {
          title: tx.bookTitle,
          author: tx.bookAuthor,
          category: tx.bookCategory
        });
        if (next) {
          toast.info(`Waitlist: ${next.username} notified for "${tx.bookTitle}"`);
        }
      }

      const fine = res.data?.fine ?? 0;
      if (fine > 0) {
        toast.info(
          `Book received. Fine ₹${fine} pending — student will pay from Fines & Payments.`
        );
      } else {
        toast.success('Return completed successfully');
      }

      setReturnForm({
        transactionId: '',
        returnDate: new Date().toISOString().slice(0, 10),
        daysKept: ''
      });
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data || 'Return failed');
    } finally {
      setReturning(false);
    }
  };

  const verifyAndComplete = async (e) => {
    e.preventDefault();
    if (!verifyForm.transactionId) return;
    setVerifying(true);
    try {
      await api.post('/return/complete', {
        transactionId: Number(verifyForm.transactionId)
      });
      toast.success('Payment verified — return transaction completed');
      setVerifyForm({ transactionId: '' });
      refresh();
    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 402 || data?.requiresPayment) {
        toast.warning(data?.error || 'Waiting for student payment');
      } else {
        toast.error(data?.error || 'Verification failed');
      }
    } finally {
      setVerifying(false);
    }
  };

  const filteredTx = activeIssued.filter((t) => {
    const q = searchTx.toLowerCase();
    return (
      String(t.id).includes(q) ||
      String(t.userId).includes(q) ||
      t.username.toLowerCase().includes(q) ||
      t.bookTitle.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingSpinner label="Loading issue/return..." />;

  if (users.length === 0) {
    return (
      <div className="page-issue-return">
        <div className="page-header">
          <h1>Issue / Return</h1>
        </div>
        <div className="card">
          <p className="muted">Sign in as an admin to load students for issuing books.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-issue-return">
      <div className="page-header">
        <h1>Issue / Return</h1>
        <p>Issue books and process returns — students pay fines from their dashboard</p>
      </div>

      <div className="card-grid two-col">
        <div className="card panel-card">
          <h2>Issue Book</h2>
          <form className="form-grid" onSubmit={issueBook}>
            <label>
              Student
              <select
                required
                value={issueForm.userId}
                onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
              >
                <option value="">Select student</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.role})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Book
              <select
                required
                value={issueForm.bookId}
                onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
              >
                <option value="">Select book</option>
                {books
                  .filter((b) => b.available > 0)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} — {b.available} available
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Issue Date
              <input
                type="date"
                required
                value={issueForm.issueDate}
                onChange={(e) => setIssueForm({ ...issueForm, issueDate: e.target.value })}
              />
            </label>
            <label>
              Due Date
              <input
                type="date"
                value={issueForm.issueDate ? addDays(issueForm.issueDate, LOAN_PERIOD_DAYS) : ''}
                readOnly
              />
            </label>
            <button type="submit" className="btn-primary">
              Issue Book
            </button>
          </form>
        </div>

        <div className="card panel-card return-book-panel">
          <h2>Return Book</h2>
          <form className="form-grid" onSubmit={returnBook}>
            <label>
              Search active loan
              <input
                placeholder="Transaction ID, student or book..."
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
              />
            </label>
            <label>
              Transaction
              <select
                required
                value={returnForm.transactionId}
                onChange={(e) =>
                  setReturnForm({ ...returnForm, transactionId: e.target.value })
                }
              >
                <option value="">Select transaction</option>
                {filteredTx.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} — {t.bookTitle} → {t.username}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Return Date
              <input
                type="date"
                required
                value={returnForm.returnDate}
                onChange={(e) =>
                  setReturnForm({ ...returnForm, returnDate: e.target.value })
                }
              />
            </label>
            <label>
              Days Kept
              <input
                type="number"
                min="0"
                required
                value={returnForm.daysKept}
                onChange={(e) =>
                  setReturnForm({ ...returnForm, daysKept: e.target.value })
                }
              />
            </label>
            {returnForm.transactionId && returnForm.daysKept !== '' && (
              <div className="fine-preview">
                <p>
                  Late days: <strong>{lateDays}</strong>
                </p>
                <p>
                  Calculated fine: <strong>₹{calculatedFine}</strong>
                </p>
                {calculatedFine > 0 && (
                  <p className="hint payment-return-hint">
                    Student will be notified to pay via Fines &amp; Payments.
                  </p>
                )}
              </div>
            )}
            <p className="hint">
              Fine: ₹{FINE_RATE}/day after {LOAN_PERIOD_DAYS} days
            </p>
            <button type="submit" className="btn-primary" disabled={returning}>
              {returning ? 'Processing Return...' : 'Process Return'}
            </button>
          </form>
        </div>
      </div>

      {pendingPayments.length > 0 && (
        <div className="card panel-card admin-payment-panel" style={{ marginTop: 24 }}>
          <h2>
            <FiCheckCircle style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Payment Verification
          </h2>
          <p className="hint">
            Verify student payment and complete return transactions.
          </p>

          <table className="data-table" style={{ marginBottom: 20 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Book</th>
                <th>Fine</th>
                <th>Payment Status</th>
                <th>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>{t.username}</td>
                  <td>{t.bookTitle}</td>
                  <td>₹{Number(t.fine).toFixed(2)}</td>
                  <td>
                    <PaymentStatusBadge status={t.paymentStatus} />
                  </td>
                  <td>
                    <StatusBadge status="overdue" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form className="form-grid admin-verify-form" onSubmit={verifyAndComplete}>
            <label>
              Transaction to verify
              <select
                required
                value={verifyForm.transactionId}
                onChange={(e) =>
                  setVerifyForm({ transactionId: e.target.value })
                }
              >
                <option value="">Select pending return</option>
                {pendingPayments.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} — {t.bookTitle} ({t.username}) — ₹{t.fine} —{' '}
                    {t.paymentStatus}
                  </option>
                ))}
              </select>
            </label>

            {verifyTx && (
              <div className="fine-preview admin-fine-status">
                <p>
                  Student: <strong>{verifyTx.username}</strong>
                </p>
                <p>
                  Fine amount: <strong>₹{Number(verifyTx.fine).toFixed(2)}</strong>
                </p>
                <p>
                  Payment status:{' '}
                  <PaymentStatusBadge status={verifyTx.paymentStatus} />
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={verifying || verifyTx?.paymentStatus !== 'PAID'}
            >
              {verifying ? 'Verifying...' : 'Verify Payment & Complete Return'}
            </button>
            {verifyTx && verifyTx.paymentStatus !== 'PAID' && (
              <p className="hint payment-return-hint">
                Student must complete payment before you can verify and close this return.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
