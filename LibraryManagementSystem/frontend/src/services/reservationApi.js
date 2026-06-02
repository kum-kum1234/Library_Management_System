import api from './api';

// ========================================
// CREATE RESERVATION
// ========================================

export const createReservation = async (
  user_id,
  book_id
) => {

  const res = await api.post(
    '/reservations',
    {
      user_id,
      book_id
    }
  );

  return res.data;
};

// ========================================
// GET ALL RESERVATIONS
// ========================================

export const getReservations = async () => {

  const res = await api.get(
    '/reservations'
  );

  return res.data;
};

// ========================================
// APPROVE RESERVATION
// ========================================

export const approveReservation = async (id) => {
  const res = await api.put(
    `/reservations/${id}/approve`
  );
  return res.data;
};

// ========================================
// REJECT RESERVATION
// ========================================

export const rejectReservation = async (id) => {
  const res = await api.put(
    `/reservations/${id}/reject`
  );
  return res.data;
};

// ========================================
// GET STUDENT RESERVATIONS
// ========================================

export const getStudentReservations = async () => {
  const res = await api.get(
    '/student/reservations'
  );
  return res.data;
};