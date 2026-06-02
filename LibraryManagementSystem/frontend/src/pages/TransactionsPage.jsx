import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useLibrary } from '../context/LibraryDataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { enrichTransactions, paginate } from '../utils/libraryData';

export default function TransactionsPage() {
  const [searchParams] = useSearchParams();
  const { loading, books, users, transactions } = useLibrary();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('filter') || '');
  const [page, setPage] = useState(1);

  const enriched = useMemo(
    () => enrichTransactions(transactions, books, users),
    [transactions, books, users]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter((tx) => {
      if (statusFilter && tx.displayStatus !== statusFilter) return false;
      return (
        String(tx.id).includes(q) ||
        tx.username.toLowerCase().includes(q) ||
        tx.bookTitle.toLowerCase().includes(q)
      );
    });
  }, [enriched, search, statusFilter]);

  const { data: pageData, totalPages } = paginate(filtered, page, 10);

  const exportCsv = () => {
    const header = ['ID', 'Student', 'Book', 'Issue', 'Due', 'Return', 'Fine', 'Status'];
    const rows = filtered.map((t) => [
      t.id, t.username, t.bookTitle, t.issueDate, t.dueDate, t.returnDate || '', t.fine, t.displayStatus
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    toast.success('CSV exported');
  };

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(
      filtered.map((t) => ({
        ID: t.id,
        Student: t.username,
        Book: t.bookTitle,
        IssueDate: t.issueDate,
        DueDate: t.dueDate,
        ReturnDate: t.returnDate,
        Fine: t.fine,
        Status: t.displayStatus
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Transactions');
    XLSX.writeFile(wb, 'transactions.xlsx');
    toast.success('Excel exported');
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Library Transactions', 14, 16);
    doc.setFontSize(9);
    let y = 26;
    filtered.slice(0, 40).forEach((t) => {
      doc.text(`#${t.id} ${t.username} - ${t.bookTitle} [${t.displayStatus}]`, 14, y);
      y += 6;
      if (y > 280) return;
    });
    doc.save('transactions.pdf');
    toast.success('PDF exported');
  };

  if (loading) return <LoadingSpinner label="Loading transactions..." />;

  return (
    <div className="page-transactions">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Full issue-return history</p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn-secondary" onClick={exportCsv}><FiDownload /> CSV</button>
          <button type="button" className="btn-secondary" onClick={exportExcel}><FiDownload /> Excel</button>
          <button type="button" className="btn-secondary" onClick={exportPdf}><FiDownload /> PDF</button>
        </div>
      </div>

      <div className="toolbar card">
        <input
          placeholder="Search student, book, transaction ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
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
                <th>Student</th>
                <th>Book</th>
                <th>Issue</th>
                <th>Due</th>
                <th>Return</th>
                <th>Fine</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>{tx.username}</td>
                  <td>{tx.bookTitle}</td>
                  <td>{tx.issueDate || '-'}</td>
                  <td>{tx.dueDate || '-'}</td>
                  <td>{tx.returnDate || '-'}</td>
                  <td>₹{tx.fine}</td>
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
