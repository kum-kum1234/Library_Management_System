import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getStudentReservations } from '../../services/reservationApi';

export default function StudentReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getStudentReservations();
      setReservations(data.reservations || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="student-page">
        <div className="page-header">
          <h1>My Reservations</h1>
        </div>
        <div className="card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>My Reservations</h1>
        <p>View your book reservation requests and their status</p>
      </div>

      <div className="card table-card">
        {reservations.length === 0 ? (
          <div className="empty-state">
            <p>No reservations found</p>
            <Link to="/student/books" className="btn-primary">
              Browse Books
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.title}</strong>
                    <span className="muted block">{r.author}</span>
                  </td>
                  <td>
                    {r.status}
                  </td>
                  <td>{r.reserved_at}</td>
                  <td className="actions-cell">
                    {r.status === 'approved' && (
                      <Link
                        to="/student/my-books"
                        className="btn-primary btn-sm"
                      >
                        Issue Book
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
