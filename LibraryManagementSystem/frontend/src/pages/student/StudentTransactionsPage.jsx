import React, { useMemo, useState } from 'react';
import { useStudent } from '../../context/StudentDataContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { paginate } from '../../utils/libraryData';

export default function StudentTransactionsPage() {
  const { loading, enriched } = useStudent();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!filter) return enriched;
    return enriched.filter((t) => t.displayStatus === filter);
  }, [enriched, filter]);

  const { data: pageData, totalPages } = paginate(filtered, page, 10);

  if (loading) return <LoadingSpinner label="Loading transactions..." />;

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>My Transactions</h1>
        <p>Complete issue, return, and overdue history</p>
      </div>

      <div className="toolbar card">
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="issued">Issued</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="card table-card">
        {pageData.length === 0 ? (
          <EmptyState title="No transactions found" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Book</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Fine</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>{tx.bookTitle}</td>
                  <td>{tx.issueDate || '-'}</td>
                  <td>{tx.dueDate || '-'}</td>
                  <td>{tx.returnDate || '-'}</td>
                  <td>₹{tx.fine || 0}</td>
                  <td><StatusBadge status={tx.displayStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
