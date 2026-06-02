import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppShell from './AppShell';

export default function AdminLayout() {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <AppShell />;
}
