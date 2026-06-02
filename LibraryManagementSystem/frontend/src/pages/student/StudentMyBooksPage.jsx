import React from 'react';
import { toast } from 'react-toastify';
import { FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';
import { useStudent } from '../../context/StudentDataContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { renewBook, checkUnpaidFines, hasUnpaidFine } from '../../utils/studentData';
import { processBookReturned } from '../../utils/waitlist';

export default function StudentMyBooksPage() {
  const { loading, activeLoans, enriched, refresh } = useStudent();

  const handleRenew = async (tx) => {
    const blocked = await checkUnpaidFines();
    if (blocked || hasUnpaidFine(tx)) {
      toast.warning('Please clear pending fines before renewing books.');
      return;
    }
    renewBook(tx.id);
    toast.success('Book renewed successfully');
    refresh();
  };

  const handleReturn = async (tx) => {
    const daysKept = Math.max(
      1,
      Math.ceil((new Date() - new Date(tx.issueDate)) / (1000 * 60 * 60 * 24))
    );
    try {
      const res = await api.post('/return', {
        transactionId: tx.id,
        returnDate: new Date().toISOString().slice(0, 10),
        daysKept
      });
      const next = processBookReturned(tx.bookId, {
        title: tx.bookTitle,
        author: tx.bookAuthor,
        category: tx.bookCategory
      });
      if (next) {
        toast.info(`📚 "${tx.bookTitle}" — next waitlist student notified`);
      }
      toast.success(`Returned. Fine: ₹${res.data.fine ?? 0}`);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data || 'Return failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading your books..." />;

  const allMine = enriched.filter((t) => t.displayStatus !== 'returned' || t.returnDate);

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>My Books</h1>
        <p>Currently issued, due dates, and returns</p>
      </div>

      <div className="card table-card">
        {activeLoans.length === 0 && enriched.filter((t) => t.displayStatus === 'returned').length === 0 ? (
          <EmptyState title="No books issued yet" message="Search books to borrow from the library." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Issued On</th>
                <th>Due On</th>
                <th>Status</th>
                <th>Fine</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allMine.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <div className="book-row">
                      <div className="book-thumb">{tx.bookTitle.charAt(0)}</div>
                      <div>
                        <strong>{tx.bookTitle}</strong>
                        <span>{tx.bookAuthor}</span>
                      </div>
                    </div>
                  </td>
                  <td>{tx.issueDate?.slice(0, 10)}</td>
                  <td>{tx.dueDate}</td>
                  <td><StatusBadge status={tx.displayStatus} /></td>
                  <td>{tx.fine > 0 ? `₹${tx.fine}` : '-'}</td>
                  <td className="actions-cell">
                    {(tx.displayStatus === 'issued' || tx.displayStatus === 'overdue') && (
                      <>
                        <button type="button" className="btn-secondary btn-sm" onClick={() => handleRenew(tx)}>
                          <FiRefreshCw /> Renew
                        </button>
                        <button type="button" className="btn-primary btn-sm" onClick={() => handleReturn(tx)}>
                          Return
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
