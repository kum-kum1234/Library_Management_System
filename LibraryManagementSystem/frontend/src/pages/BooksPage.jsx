import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiSearch } from 'react-icons/fi';
import api from '../services/api';
import { useLibrary } from '../context/LibraryDataContext';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { bookStatus, paginate } from '../utils/libraryData';

const CATEGORIES = ['Computer Science', 'Mathematics', 'Physics', 'Engineering', 'Others'];
const EMPTY_BOOK = { title: '', author: '', category: 'Computer Science', quantity: 1, available: 1 };

export default function BooksPage() {
  const [searchParams] = useSearchParams();
  const { loading, books, refresh } = useLibrary();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState(searchParams.get('filter') || '');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_BOOK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setList(books);
  }, [books]);

  const runSearch = async () => {
    if (!search.trim()) {
      refresh();
      return;
    }
    try {
      const res = await api.get('/books/search', { params: { q: search.trim() } });
      setList(res.data.books || []);
    } catch {
      toast.error('Search failed');
    }
  };

  const filtered = useMemo(() => {
    return list.filter((book) => {
      if (categoryFilter && book.category !== categoryFilter) return false;
      const status = bookStatus(book);
      if (availabilityFilter === 'available' && status !== 'available') return false;
      if (availabilityFilter === 'issued' && status !== 'issued') return false;
      if (availabilityFilter === 'unavailable' && status !== 'unavailable') return false;
      return true;
    });
  }, [list, categoryFilter, availabilityFilter]);

  const { data: pageData, totalPages } = paginate(filtered, page, 8);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_BOOK);
    setModalOpen(true);
  };

  const openEdit = (book) => {
    setEditing(book);
    setForm({ ...book });
    setModalOpen(true);
  };

  const openDetail = async (book) => {
    try {
      const res = await api.get(`/books/${book.id}`);
      setSelected(res.data);
      setDetailOpen(true);
    } catch {
      toast.error('Could not load book details');
    }
  };

  const saveBook = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/books/${editing.id}`, form);
        toast.success('Book updated successfully');
      } else {
        await api.post('/books', {
          title: form.title,
          author: form.author,
          category: form.category,
          quantity: Number(form.quantity)
        });
        toast.success('Book added successfully');
      }
      await refresh();
      setList([]);
      const updated = await api.get('/books');
      setList(updated.data.books || updated.data);
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async (book) => {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    try {
      await api.delete(`/books/${book.id}`);
      toast.success('Book deleted');
      refresh();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading books..." />;

  return (
    <div className="page-books">
      <div className="page-header">
        <div>
          <h1>Books Management</h1>
          <p>Add, edit, search and manage library catalog</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAdd}>
          <FiPlus /> Add Book
        </button>
      </div>

      <div className="toolbar card">
        <div className="search-inline">
          <FiSearch />
          <input
            placeholder="Search title, author, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          />
          <button type="button" className="btn-secondary" onClick={runSearch}>Search</button>
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
          <option value="">All Availability</option>
          <option value="available">Available</option>
          <option value="issued">Partially Issued</option>
          <option value="unavailable">Out of Stock</option>
        </select>
      </div>

      <div className="card table-card">
        {pageData.length === 0 ? (
          <EmptyState title="No books found" message="Try adjusting filters or add a new book." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Available</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((book) => (
                <tr key={book.id}>
                  <td><div className="book-thumb">{book.title.charAt(0)}</div></td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.category}</td>
                  <td>{book.quantity}</td>
                  <td>{book.available}</td>
                  <td><StatusBadge status={bookStatus(book)} /></td>
                  <td className="actions-cell">
                    <button type="button" className="icon-btn" onClick={() => openDetail(book)} title="View">
                      <FiEye />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => openEdit(book)} title="Edit">
                      <FiEdit2 />
                    </button>
                    <button type="button" className="icon-btn danger" onClick={() => deleteBook(book)} title="Delete">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Book' : 'Add Book'} onClose={() => setModalOpen(false)}>
        <form className="form-grid" onSubmit={saveBook}>
          <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Author<input required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></label>
          <label>
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Quantity<input type="number" min="0" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value, available: editing ? form.available : e.target.value })} /></label>
          {editing && (
            <label>Available<input type="number" min="0" required value={form.available} onChange={(e) => setForm({ ...form, available: e.target.value })} /></label>
          )}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={detailOpen} title="Book Details" onClose={() => setDetailOpen(false)} wide>
        {selected && (
          <div className="book-detail">
            <div className="book-thumb large">{selected.title?.charAt(0)}</div>
            <div>
              <h3>{selected.title}</h3>
              <p><strong>Author:</strong> {selected.author}</p>
              <p><strong>Category:</strong> {selected.category}</p>
              <p><strong>Quantity:</strong> {selected.quantity}</p>
              <p><strong>Available:</strong> {selected.available}</p>
              <p><strong>Status:</strong> <StatusBadge status={bookStatus(selected)} /></p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
