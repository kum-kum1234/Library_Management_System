import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEye, FiUserX } from 'react-icons/fi';
import api from '../services/api';
import { useLibrary } from '../context/LibraryDataContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import {
  enrichTransactions,
  issuedCountByUser,
  userFines,
  paginate
} from '../utils/libraryData';

export default function UsersPage() {
  const { loading, users, transactions, refresh } = useLibrary();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [blocked, setBlocked] = useState(() => new Set(JSON.parse(localStorage.getItem('blocked_users') || '[]')));
  const [form, setForm] = useState({ username: '', password: '', role: 'student' });

  const enriched = useMemo(
    () => enrichTransactions(transactions, [], users),
    [transactions, users]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const { data: pageData, totalPages } = paginate(filtered, page, 8);

  const addUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/register', form);
      toast.success('User added successfully');
      setModalOpen(false);
      setForm({ username: '', password: '', role: 'student' });
      refresh();
    } catch (err) {
      toast.error(err?.response?.data || 'Failed to add user');
    }
  };

  const toggleBlock = (user) => {
    const next = new Set(blocked);
    if (next.has(user.id)) next.delete(user.id);
    else next.add(user.id);
    setBlocked(next);
    localStorage.setItem('blocked_users', JSON.stringify([...next]));
    toast.info(next.has(user.id) ? 'User blocked (local)' : 'User unblocked');
  };

  const resetPassword = () => {
    toast.info('Password reset requires backend support. Use register flow for new accounts.');
  };

  if (loading) return <LoadingSpinner label="Loading users..." />;

  return (
    <div className="page-users">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage students and administrators</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          <FiPlus /> Add User
        </button>
      </div>

      <div className="toolbar card">
        <input
          placeholder="Search by name or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card table-card">
        {pageData.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Role</th>
                <th>Issued</th>
                <th>Fine (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((user) => (
                <tr key={user.id}>
                  <td><div className="avatar sm">{user.username.charAt(0).toUpperCase()}</div></td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{issuedCountByUser(transactions, user.id)}</td>
                  <td>{userFines(transactions, user.id)}</td>
                  <td>{blocked.has(user.id) ? 'Blocked' : 'Active'}</td>
                  <td className="actions-cell">
                    <button type="button" className="icon-btn" onClick={() => setDetailUser(user)}><FiEye /></button>
                    <button type="button" className="icon-btn" onClick={() => toggleBlock(user)} title="Block"><FiUserX /></button>
                    <button type="button" className="btn-link" onClick={resetPassword}>Reset</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} title="Add User" onClose={() => setModalOpen(false)}>
        <form className="form-grid" onSubmit={addUser}>
          <label>Name / Username<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
          <label>Password<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Create User</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detailUser} title="User Details" onClose={() => setDetailUser(null)} wide>
        {detailUser && (
          <div>
            <p><strong>Username:</strong> {detailUser.username}</p>
            <p><strong>Role:</strong> {detailUser.role}</p>
            <p><strong>Active books:</strong> {issuedCountByUser(transactions, detailUser.id)}</p>
            <p><strong>Total fines:</strong> ₹{userFines(transactions, detailUser.id)}</p>
            <h4>Issue history</h4>
            <ul className="simple-list">
              {enriched.filter((t) => t.userId === detailUser.id).slice(0, 10).map((t) => (
                <li key={t.id}>{t.bookTitle} — {t.displayStatus} ({t.issueDate})</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
