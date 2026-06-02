import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBook, FiCalendar, FiDollarSign, FiClock, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../context/StudentDataContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { renewBook } from '../../utils/studentData';
import { toast } from 'react-toastify';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    loading,
    enriched,
    stats,
    activeLoans,
    dueSoonBooks,
    recommendations,
    activity,
    refresh
  } = useStudent();

  const handleRenew = (tx) => {
    renewBook(tx.id);
    toast.success('Book renewed — due date extended');
    refresh();
  };

  if (loading) return <LoadingSpinner label="Loading your dashboard..." />;

  const displayLoans = enriched
    .filter((t) => t.displayStatus !== 'returned')
    .slice(0, 5)
    .concat(enriched.filter((t) => t.displayStatus === 'returned').slice(0, 3))
    .slice(0, 5);

  const topDue = dueSoonBooks[0];

  return (
    <div className="student-dashboard">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.username || 'Student'}! 👋</h1>
          <p>Track your borrowed books, fines, and library activity.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><FiBook /></div>
          <div>
            <p>Currently Issued</p>
            <h2>{stats.currentlyIssued + stats.overdueCount}</h2>
            <Link to="/student/my-books" className="stat-link">View My Books →</Link>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiCalendar /></div>
          <div>
            <p>Due Soon</p>
            <h2>{stats.dueSoonCount}</h2>
            <Link to="/student/my-books" className="stat-link">View Due Books →</Link>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiDollarSign /></div>
          <div>
            <p>Total Fine</p>
            <h2>₹ {stats.totalFine}</h2>
            <Link to="/student/fines-payments" className="stat-link">View Fine Details →</Link>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiClock /></div>
          <div>
            <p>Total Borrowed</p>
            <h2>{stats.totalBorrowed}</h2>
            <Link to="/student/transactions" className="stat-link">View My History →</Link>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="panel-card">
          <div className="panel-header">
            <h3>My Issued Books</h3>
            <Link to="/student/my-books" className="btn-link">View All</Link>
          </div>
          {displayLoans.length === 0 ? (
            <p className="muted">No books issued yet</p>
          ) : (
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Issued On</th>
                  <th>Due On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayLoans.map((tx) => (
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
                    <td>
                      <StatusBadge status={tx.displayStatus} />
                      {tx.displayStatus === 'overdue' && (
                        <span className="fine-text">Fine: ₹ {tx.fine}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="info-banner">
            Please return books on time to avoid additional fines.
          </div>
        </div>

        <div className="panel-card due-soon-panel">
          <h3>Due Soon</h3>
          {topDue ? (
            <>
              <div className="due-soon-card">
                <div className="book-thumb large">{topDue.bookTitle.charAt(0)}</div>
                <div>
                  <h4>{topDue.bookTitle}</h4>
                  <p>{topDue.bookAuthor}</p>
                  <p className="due-date">Due On: <strong>{topDue.dueDate}</strong></p>
                  <span className="badge badge-danger">{topDue.daysLeft} Days Left</span>
                </div>
              </div>
              <div className="warning-box">
                You have {stats.dueSoonCount} book(s) due soon. Return before the due date to avoid fine.
              </div>
              <div className="btn-row">
                <button type="button" className="btn-primary" onClick={() => handleRenew(topDue)}>
                  <FiRefreshCw /> Renew Book
                </button>
                <button type="button" className="btn-secondary" onClick={() => navigate('/student/my-books')}>
                  View My Books
                </button>
              </div>
            </>
          ) : (
            <p className="muted">No books due in the next 3 days</p>
          )}
        </div>
      </div>

      <div className="dashboard-row">
        <div className="panel-card">
          <h3>Recommended Books for You</h3>
          <div className="book-cards-row">
            {recommendations.length === 0 ? (
              <p className="muted">Browse the catalog to get recommendations</p>
            ) : (
              recommendations.map((book) => (
                <div key={book.id} className="recommend-card">
                  <div className="book-thumb cover">{book.title.charAt(0)}</div>
                  <h4>{book.title}</h4>
                  <p>{book.author}</p>
                  <div className="stars">{'★'.repeat(Math.round(book.rating))}</div>
                  <button type="button" className="btn-link" onClick={() => navigate('/student/books')}>
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel-card">
          <h3>Recent Activity</h3>
          <ul className="activity-feed">
            {activity.length === 0 ? (
              <li className="muted">No recent activity</li>
            ) : (
              activity.map((item) => (
                <li key={item.id} className={`activity-item type-${item.type}`}>
                  <span className="activity-dot" />
                  <div>
                    <p>{item.text}</p>
                    <small>{item.date?.slice(0, 10) || ''}</small>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
