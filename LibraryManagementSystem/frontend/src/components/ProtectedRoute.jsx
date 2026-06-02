import React from 'react';

import {
  Navigate
} from 'react-router-dom';

import {
  useAuth
} from '../context/AuthContext';

export default function ProtectedRoute({

  children,
  role

}) {

  const { user } = useAuth();

  // =========================
  // NOT LOGGED IN
  // =========================

  if (!user) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // =========================
  // ROLE CHECK
  // =========================

  if (role && user.role !== role) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // =========================
  // ACCESS GRANTED
  // =========================

  return children;
}