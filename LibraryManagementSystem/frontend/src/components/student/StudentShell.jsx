import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StudentDataProvider } from '../../context/StudentDataContext';
import StudentSidebar from './StudentSidebar';
import StudentNavbar from './StudentNavbar';

export default function StudentShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <StudentDataProvider>
      <div className={`layout student-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <StudentSidebar />
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        <div className="main-wrapper">
          <StudentNavbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
          <main className="page-content">
            <Outlet />
          </main>
          <footer className="student-footer">
            Happy Reading! Keep learning and explore more books.
          </footer>
        </div>
      </div>
    </StudentDataProvider>
  );
}
