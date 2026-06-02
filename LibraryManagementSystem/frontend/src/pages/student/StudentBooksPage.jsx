import React, {
  useEffect,
  useMemo,
  useState
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useStudent } from '../../context/StudentDataContext';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { bookStatus } from '../../utils/libraryData';
import { submitBookRequest } from '../../utils/bookRequests';
import { checkUnpaidFines } from '../../utils/studentData';
import {
  getWaitlists,
  addToWaitlist
}
from '../../services/waitlistApi';

export default function StudentBooksPage() {
  const [searchParams] = useSearchParams();
  const { loading, books, profile, userId } = useStudent();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [selected, setSelected] = useState(null);
  const [waitlists, setWaitlists] = useState([]);


  useEffect(() => {
    setList(books);
  }, [books]);
useEffect(() => {
  loadWaitlists();
}, []);

const loadWaitlists = async () => {

  try {

    const res = await getWaitlists();

    setWaitlists(
      res.data.waitlists || []
    );

  } catch (err) {

    console.error(
      "Failed to load waitlists:",
      err
    );

    toast.error(
      "Unable to load waitlists"
    );
  }
};

  const categories = useMemo(() => [...new Set(books.map((b) => b.category))], [books]);

  const filtered = useMemo(() => {
    return list.filter((b) => {
      if (category && b.category !== category) return false;
      const st = bookStatus(b);
      if (availability === 'available' && st !== 'available') return false;
      if (availability === 'issued' && st === 'available') return false;
      if (availability === 'unavailable' && b.available > 0) return false;
      return true;
    });
  }, [list, category, availability]);
  
  
  const runSearch = async () => {
    if (!search.trim()) {
      setList(books);
      return;
    }
    try {
      const res = await api.get('/books/search', { params: { q: search.trim() } });
      setList(res.data.books || []);
    } catch {
      toast.error('Search failed');
    }
  };

  const issueRequest = async (book) => {
    if (!userId) {
      toast.error('Could not identify your account. Please log in again.');
      return;
    }
    const blocked = await checkUnpaidFines();
    if (blocked) {
      toast.warning('Please clear pending fines before issuing new books.');
      return;
    }
    const result = submitBookRequest({
      book,
      userId,
      username: profile?.username
    });
    if (result.duplicate) {
      toast.warning('You already have a pending request for this book');
      return;
    }
    toast.success('Issue request submitted — waiting for admin approval');
  };

  const handleJoinWaitlist = async (book) => {

  if (!userId) {
    toast.error('Please log in again');
    return;
  }

  try {

    await addToWaitlist({
  user_id: userId,
  book_id: book.id
});

await loadWaitlists();

toast.success('Added to waitlist');

  } catch (err) {

    console.error(err);

    toast.error('Failed to join waitlist');
  }
};

  const renderBookActions = (book) => {
    const available = book.available > 0;
    const waitingEntries =
  waitlists.filter(
    w =>
      w.book_id === book.id &&
      w.status === "waiting"
  );

const waitingCount =
  waitingEntries.length;
     const onList =
  waitingEntries.some(
    w =>
      w.user_id === userId
  );
    const position =
  waitingEntries.findIndex(
    w =>
      w.user_id === userId
  ) + 1;
    if (!available) {
      return (
        <>
          <p className="unavailable-label">Currently Unavailable</p>
          {waitingCount > 0 && (
            <p className="waitlist-counter">{waitingCount} student(s) waiting</p>
          )}
          {onList ? (
            <p className="waitlist-joined">
              On waitlist · Position #{position} · ~{position * 3} days
            </p>
          ) : (
            <button type="button" className="btn-warning" onClick={() => handleJoinWaitlist(book)}>
              Join Waitlist
            </button>
          )}
        </>
      );
    }

    return (
      <>
        {waitingCount > 0 && (
          <p className="waitlist-counter">{waitingCount} student(s) waiting</p>
        )}
        <button type="button" className="btn-primary" onClick={() => issueRequest(book)}>
          Issue Request
        </button>
      </>
    );
  };

  if (loading) return <LoadingSpinner label="Loading books..." />;

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>Search Books</h1>
        <p>Available books use Issue Request · Unavailable books use Join Waitlist</p>
      </div>

      <div className="toolbar card">
        <input
          placeholder="Search title, author, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
        />
        <button type="button" className="btn-secondary" onClick={runSearch}>Search</button>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
          <option value="issued">Partially Issued</option>
        </select>
      </div>

      <div className="book-grid">
        {filtered.length === 0 ? (
          <EmptyState title="No books found" />
        ) : (
          filtered.map((book) => (
            <div key={book.id} className="catalog-card">
              <div className="book-thumb cover">{book.title.charAt(0)}</div>
              <h4>{book.title}</h4>
              <p>{book.author}</p>
              <p className="muted">{book.category}</p>
              <StatusBadge status={book.available > 0 ? 'available' : 'unavailable'} />
              <p className="avail">{book.available} of {book.quantity} available</p>
              <div className="btn-row catalog-actions">
                <button type="button" className="btn-secondary" onClick={() => setSelected(book)}>
                  View Details
                </button>
                {renderBookActions(book)}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={!!selected} title="Book Details" onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <h3>{selected.title}</h3>
            <p><strong>Author:</strong> {selected.author}</p>
            <p><strong>Category:</strong> {selected.category}</p>
            <p><strong>Available:</strong> {selected.available} / {selected.quantity}</p>
            {renderBookActions(selected)}
          </div>
        )}
      </Modal>
    </div>
  );
}
