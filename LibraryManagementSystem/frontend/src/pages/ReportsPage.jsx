import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
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
import { useLibrary } from '../context/LibraryDataContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  enrichTransactions,
  monthlyChartData,
  categoryDistribution,
  totalFinesCollected
} from '../utils/libraryData';

export default function ReportsPage() {
  const { loading, books, transactions, users } = useLibrary();

  const enriched = useMemo(
    () => enrichTransactions(transactions, books, users),
    [transactions, books, users]
  );

  const chartData = useMemo(() => monthlyChartData(transactions, books), [transactions, books]);
  const categories = useMemo(() => categoryDistribution(books), [books]);

  const mostIssued = useMemo(() => {
    const counts = {};
    transactions.forEach((t) => {
      counts[t.bookId] = (counts[t.bookId] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([bookId, count]) => {
        const book = books.find((b) => b.id === Number(bookId));
        return { name: book?.title || `Book ${bookId}`, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [transactions, books]);

  const topReaders = useMemo(() => {
    const counts = {};
    transactions.forEach((t) => {
      counts[t.userId] = (counts[t.userId] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([userId, count]) => {
        const user = users.find((u) => u.id === Number(userId));
        return { name: user?.username || `User ${userId}`, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [transactions, users]);

  if (loading) return <LoadingSpinner label="Loading reports..." />;

  return (
    <div className="page-reports">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Charts and statistics from live database data</p>
      </div>

      <div className="stats-grid compact">
        <div className="stat-card mini">
          <p>Total Fines</p>
          <h3>₹{totalFinesCollected(transactions).toLocaleString('en-IN')}</h3>
        </div>
        <div className="stat-card mini">
          <p>Total Issues</p>
          <h3>{transactions.length}</h3>
        </div>
        <div className="stat-card mini">
          <p>Active Loans</p>
          <h3>{enriched.filter((t) => t.displayStatus === 'issued' || t.displayStatus === 'overdue').length}</h3>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="panel-card chart-panel">
          <h3>Monthly Activity</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="issued" name="Issue Rate" fill="#22c55e" />
              <Bar dataKey="returned" name="Return Rate" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel-card">
          <h3>Category Usage</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categories} dataKey="value" nameKey="name" outerRadius={90}>
                {categories.map((c) => (
                  <Cell key={c.name} fill={c.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-row two-col">
        <div className="panel-card">
          <h3>Most Issued Books</h3>
          <ul className="rank-list">
            {mostIssued.length === 0 ? (
              <li className="muted">No issue data yet</li>
            ) : (
              mostIssued.map((item, i) => (
                <li key={item.name}>
                  <span>{i + 1}</span> {item.name} <strong>{item.count}</strong>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="panel-card">
          <h3>Top Readers</h3>
          <ul className="rank-list">
            {topReaders.length === 0 ? (
              <li className="muted">No reader data yet</li>
            ) : (
              topReaders.map((item, i) => (
                <li key={item.name}>
                  <span>{i + 1}</span> {item.name} <strong>{item.count}</strong>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
