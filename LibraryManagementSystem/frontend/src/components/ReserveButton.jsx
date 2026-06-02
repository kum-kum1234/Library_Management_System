import React from 'react';
import './ReserveButton.css';
import {
  createReservation
} from '../services/reservationApi';

export default function ReserveButton({

  bookId

}) {

  const handleReserve = async () => {

    try {

      const user =
        JSON.parse(
          localStorage.getItem(
            'library_user'
          )
        );

      await createReservation(
        user.id,
        bookId
      );

      alert(
        'Book reserved successfully'
      );

    } catch (err) {

      console.error(err);

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