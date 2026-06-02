import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBook,
  FiUsers,
  FiRefreshCw,
  FiCalendar,
  FiPlus,
  FiRepeat,
  FiUserPlus,
  FiFileText,
  FiDatabase
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryDataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import LowStockAlert from "../components/LowStockAlert";
import AdminReservationPanel from '../components/AdminReservationPanel';
import {
  enrichTransactions,
  countOverdue,
  countIssuedToday,
  countReturnedToday,
  totalFinesCollected,
  monthlyChartData,
  categoryDistribution,
  buildNotifications
} from '../utils/libraryData';
import BookRequestsPanel from '../components/BookRequestsPanel';
import WaitlistManagementPanel from '../components/WaitlistManagementPanel';
import { getMostWaitlistedBooks } from '../utils/waitlist';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, stats, books, transactions, users, refresh } = useLibrary();

  const enriched = useMemo(
    () => enrichTransactions(transactions, books, users),
    [transactions, books, users]
  );

  const chartData = useMemo(
    () => monthlyChartData(transactions, books),
    [transactions, books]
  );

  const categories = useMemo(() => categoryDistribution(books), [books]);
  const overdueCount = countOverdue(transactions);
  const alerts = buildNotifications({ transactions, books, users });

  const issuedThisMonth = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const d = new Date(t.issueDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [transactions]);

  const recent = enriched.slice(0, 5);
  const topWaitlisted = useMemo(() => getMostWaitlistedBooks(5), [transactions, books]);

  if (loading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.username || 'Admin'}! 👋</h1>
          <p>Here's what's happening in your library today.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={refresh}>
          Refresh
        </button>
      </div>
      <LowStockAlert />
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FiBook /></div>
          <div>
            <p>Total Books</p>
            <h2>{stats?.totalBooks ?? books.length}</h2>
            <span className="stat-meta positive">+{issuedThisMonth} issued this month</span>
            <Link to="/books" className="stat-link">View Books →</Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple"><FiUsers /></div>
          <div>
            <p>Total Users</p>
            <h2>{stats?.totalUsers ?? users.length}</h2>
            <span className="stat-meta positive">
              {users.filter((u) => u.role === 'student').length} students
            </span>
            <Link to="/users" className="stat-link">Manage Users →</Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><FiRefreshCw /></div>
          <div>
            <p>Active Transactions</p>
            <h2>{stats?.activeTransactions ?? 0}</h2>
            <span className="stat-meta">Currently Issued</span>
            <Link to="/transactions?filter=issued" className="stat-link">View Transactions →</Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red"><FiCalendar /></div>
          <div>
            <p>Overdue Books</p>
            <h2>{overdueCount}</h2>
            <span className="stat-meta danger">Require Attention</span>
            <Link to="/transactions?filter=overdue" className="stat-link">View Overdue →</Link>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="panel-card chart-panel">
          <div className="panel-header">
            <h3>Library Overview</h3>
            <select defaultValue="year" className="select-sm">
              <option value="year">This Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="added" name="Books Added" stroke="#4f6ef7" strokeWidth={2} />
              <Line type="monotone" dataKey="issued" name="Books Issued" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="returned" name="Books Returned" stroke="#a855f7" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Recent Transactions</h3>
            <Link to="/transactions" className="btn-link">View All</Link>
          </div>
          {recent.length === 0 ? (
            <p className="muted">No transactions found</p>
          ) : (
            <ul className="transaction-list">
              {recent.map((tx) => (
                <li key={tx.id} className="transaction-item">
                  <div className="book-thumb">{tx.bookTitle.charAt(0)}</div>
                  <div className="transaction-info">
                    <strong>{tx.bookTitle}</strong>
                    <span>{tx.bookAuthor}</span>
                    <small>
                      {tx.displayStatus === 'returned'
                        ? `Returned by ${tx.username}`
                        : `Issued to ${tx.username}`}
                    </small>
                  </div>
                  <div className="transaction-meta">
                    <StatusBadge status={tx.displayStatus} />
                    <span>{tx.issueDate?.slice(0, 10) || tx.returnDate?.slice(0, 10)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <AdminReservationPanel />
      <BookRequestsPanel onRefresh={refresh} />

      <WaitlistManagementPanel />

      {topWaitlisted.length > 0 && (
        <div className="panel-card">
          <h3>Most Waitlisted Books</h3>
          <ul className="rank-list">
            {topWaitlisted.map((item, i) => (
              <li key={item.bookId}>
                <span>{i + 1}</span> {item.title} <strong>{item.count} waiting</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dashboard-row three-col">
        <div className="panel-card">
          <h3>Top Categories</h3>
          {categories.length === 0 ? (
            <p className="muted">No books in catalog</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {categories.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ul className="category-legend">
                {categories.map((c) => (
                  <li key={c.name}>
                    <span style={{ background: c.fill }} />
                    {c.name} ({c.percent}%)
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="panel-card">
          <h3>Issue / Return Summary</h3>
          <div className="mini-stats">
            <div>
              <p>Issued Today</p>
              <h3>{countIssuedToday(transactions)}</h3>
            </div>
            <div>
              <p>Returned Today</p>
              <h3>{countReturnedToday(transactions)}</h3>
            </div>
          </div>
          <div className="fine-bar">
            Total Fine Collected: <strong>₹ {totalFinesCollected(transactions).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div className="panel-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button type="button" onClick={() => navigate('/issue-return')}>
              <FiRepeat /> Issue Book
            </button>
            <button type="button" onClick={() => navigate('/issue-return')}>
              <FiRefreshCw /> Return Book
            </button>
            <button type="button" onClick={() => navigate('/books')}>
              <FiPlus /> Add Book
            </button>
            <button type="button" onClick={() => navigate('/users')}>
              <FiUserPlus /> Add User
            </button>
            <button type="button" onClick={() => navigate('/reports')}>
              <FiFileText /> Generate Report
            </button>
            <button type="button" onClick={() => navigate('/settings')}>
              <FiDatabase /> Backup Data
            </button>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="alerts-bar">
          {alerts.map((alert) => (
            <div key={alert.id} className="alert-item">
              <span>{alert.message}</span>
              <Link to={alert.link}>View →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
