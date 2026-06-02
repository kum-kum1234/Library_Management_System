import React, {
  useEffect,
  useState
} from 'react';

import api from '../services/api';

import './AdminReservationPanel.css';

export default function AdminReservations() {

  const [reservations,
    setReservations] = useState([]);

  useEffect(() => {

    fetchReservations();

  }, []);

  const fetchReservations =
    async () => {

      try {

        const res =
          await api.get(
            '/waitlists'
          );

        console.log(res.data);

        setReservations(
          res.data.waitlists || []
        );

      } catch (err) {

        console.error(err);
      }
    };

  return (

    <div className="admin-reservations">

      {
        reservations.length === 0
        ? (

          <div className="empty-state">

            No requests in this queue

          </div>

        ) : (

          reservations.map((item) => (

            <div
              key={item.id}
              className="reservation-card"
            >

              <div>

                <h4>
                  Book ID:
                  {item.book_id}
                </h4>

                <p>
                  Student ID:
                  {item.user_id}
                </p>

              </div>

              <div>

                <span
                  className={`status-badge ${item.status}`}
                >

                  {item.status}

                </span>

              </div>

            </div>
          ))
        )
      }

    </div>
  );
}