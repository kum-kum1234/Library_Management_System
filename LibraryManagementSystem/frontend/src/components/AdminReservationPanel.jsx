import React, {

    useEffect,
    useState
  
  } from 'react';
  
  import {
  
    getReservations,
    approveReservation,
    rejectReservation
  
  } from '../services/reservationApi';
  
  import './AdminReservationPanel.css';
  
  export default function
  AdminReservationPanel() {
  
    const [
  
      reservations,
      setReservations
  
    ] = useState([]);
  
    useEffect(() => {
  
      fetchReservations();
  
    }, []);
  
    const fetchReservations =
      async () => {
  
        try {
  
          const data =
            await getReservations();
  
          setReservations(
            data.reservations || []
          );
  
        } catch (err) {
  
          console.error(err);
        }
      };

    const handleApprove =
      async (id) => {

        try {

          await approveReservation(id);

          fetchReservations();

        } catch (err) {

          console.error(err);
        }
      };

    const handleReject =
      async (id) => {

        try {

          await rejectReservation(id);

          fetchReservations();

        } catch (err) {

          console.error(err);
        }
      };
  
    return (
  
      <div className="reservation-panel">
  
        <h2>
          Reservation Requests
        </h2>
  
        {
  
          reservations.length === 0 ?
  
          (
  
            <p>
              No reservations found
            </p>
  
          ) :
  
          (
  
            reservations.map((r) => (
  
              <div
                key={r.id}
                className="reservation-card"
              >
  
                <div>
  
                  <h4>
                    {r.book_title}
                  </h4>
  
                  <p>
                    Student:
                    {r.username}
                  </p>
  
                  <span>
                    Status:
                    {r.status}
                  </span>
  
                </div>
  
                <div
                  className="reservation-actions"
                >
  
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(r.id)}
                  >
                    Approve
                  </button>
  
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(r.id)}
                  >
                    Reject
                  </button>
  
                </div>
  
              </div>
            ))
          )
        }
  
      </div>
    );
  }
