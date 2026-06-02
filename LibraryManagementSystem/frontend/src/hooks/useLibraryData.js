import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function useLibraryData({ includeUsers = false } = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const requests = [
        api.get('/stats'),
        api.get('/books'),
        api.get('/transactions')
      ];

      if (includeUsers && user?.role === 'admin') {
        requests.push(api.get('/users'));
      }

      const results = await Promise.all(requests);
      setStats(results[0].data);
      setBooks(results[1].data.books || []);
      setTransactions(results[2].data.transactions || []);

      if (results[3]) {
        setUsers(results[3].data.users || []);
      }
    } catch (err) {
      setError(err?.response?.data || 'Failed to load library data');
    } finally {
      setLoading(false);
    }
  }, [includeUsers, user?.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    error,
    stats,
    books,
    transactions,
    users,
    refresh
  };
}
