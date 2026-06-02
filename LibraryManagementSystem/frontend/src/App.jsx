import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import BooksPage from './pages/BooksPage';
import UsersPage from './pages/UsersPage';
import IssueReturnPage from './pages/IssueReturnPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import WaitlistsPage from './pages/WaitlistsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentBooksPage from './pages/student/StudentBooksPage';
import StudentMyBooksPage from './pages/student/StudentMyBooksPage';
import StudentTransactionsPage from './pages/student/StudentTransactionsPage';
import StudentFinesPage from './pages/student/StudentFinesPage';
import StudentNotificationsPage from './pages/student/StudentNotificationsPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentChangePasswordPage from './pages/student/StudentChangePasswordPage';
import StudentWaitlistPage from './pages/student/StudentWaitlistPage';
import StudentReservationsPage from './pages/student/StudentReservationsPage';
import ProtectedRoute from './components/ProtectedRoute';
import StudentRoute from './components/StudentRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import StudentShell from './components/student/StudentShell';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />

          <Route
             path="/"
             element={
               <ProtectedRoute role="admin">
                 <AdminLayout />
               </ProtectedRoute>
          }
       >
            <Route index element={<Dashboard />} />
            <Route path="books" element={<BooksPage />} />
            <Route path="waitlists" element={<WaitlistsPage />} />
            <Route
              path="users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />
            <Route path="issue-return" element={<IssueReturnPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/student"
            element={
              <StudentRoute>
                <StudentShell />
              </StudentRoute>
            }
          >
            <Route
                path="*"
                  element={<Navigate to="/login" replace />}
            />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="books" element={<StudentBooksPage />} />
            <Route path="my-books" element={<StudentMyBooksPage />} />
            <Route path="reservations" element={<StudentReservationsPage />} />
            <Route path="waitlist" element={<StudentWaitlistPage />} />
            <Route path="transactions" element={<StudentTransactionsPage />} />
            <Route path="fines" element={<Navigate to="/student/fines-payments" replace />} />
            <Route path="fines-payments" element={<StudentFinesPage />} />
            <Route path="notifications" element={<StudentNotificationsPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="change-password" element={<StudentChangePasswordPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
