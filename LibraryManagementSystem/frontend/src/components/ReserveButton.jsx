import React from 'react';
import './ReserveButton.css';
import {
  createReservation
} from '../services/reservationApi';
import api from '../services/api';

export default function ReserveButton({

  bookId

}) {

  const handleReserve = async () => {

    try {

      let user =
        JSON.parse(
          localStorage.getItem(
            'library_user'
          )
        );

      console.log('User data from localStorage:', user);

      // If user ID is missing, fetch it from /me endpoint
      if (!user?.id) {
        try {
          const me = await api.get('/me');
          user = { ...user, id: me.data.id };
          localStorage.setItem('library_user', JSON.stringify(user));
          console.log('Updated user data:', user);
        } catch (err) {
          console.error('Failed to fetch user ID:', err);
          alert('Please log in to reserve a book');
          return;
        }
      }

      console.log('User ID:', user.id);
      console.log('Book ID:', bookId);

      await createReservation(
        user.id,
        bookId
      );

      alert(
        'Book reserved successfully'
      );

    } catch (err) {

      console.error('Reservation error:', err);
      console.error('Error response:', err.response?.data);

      alert(
        err.response?.data ||
        'Reservation failed'
      );
    }
  };

  return (

    <button
      className="reserve-btn"
      onClick={handleReserve}
    >

      Reserve Book

    </button>
  );
}