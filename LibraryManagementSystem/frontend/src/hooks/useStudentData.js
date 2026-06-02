import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  enrichStudentTransactions,
  studentStats,
  buildStudentNotifications,
  buildActivityFeed,
  getRecommendations,
  isDueSoon
} from '../utils/studentData';
import { getUserWaitlistNotifications } from '../utils/waitlist';

export default function useStudentData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [meRes, booksRes, txRes] = await Promise.all([
        api.get('/me'),
        api.get('/books'),
        api.get('/transactions')
      ]);
      setProfile(meRes.data);
      setBooks(booksRes.data.books || []);
      setTransactions(txRes.data.transactions || []);
    } catch (err) {
      setError(err?.response?.data || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const userId = profile?.id ?? user?.id;

  const enriched = useMemo(
    () => enrichStudentTransactions(transactions, books, userId),
    [transactions, books, userId]
  );

  const stats = useMemo(() => studentStats(enriched), [enriched]);
  const notifications = useMemo(() => {
    const base = buildStudentNotifications(enriched, userId);
    const waitlist = (userId ? getUserWaitlistNotifications(userId) : []).map((n) => ({
      id: `wl-n-${n.id}`,
      type: 'due',
      title: n.title,
      message: n.message,
      link: '/student/waitlist',
      read: n.read
    }));
    return [...waitlist, ...base];
  }, [enriched, userId]);
  const activity = useMemo(() => buildActivityFeed(enriched), [enriched]);
  const recommendations = useMemo(
    () => getRecommendations(books, enriched),
    [books, enriched]
  );

  const activeLoans = useMemo(
    () => enriched.filter((t) => t.displayStatus === 'issued' || t.displayStatus === 'overdue'),
    [enriched]
  );

  const dueSoonBooks = useMemo(
    () => enriched.filter((t) => isDueSoon(t)),
    [enriched]
  );

  return {
    loading,
    error,
    profile,
    books,
    transactions,
    enriched,
    stats,
    notifications,
    activity,
    recommendations,
    activeLoans,
    dueSoonBooks,
    refresh,
    userId
  };
}
