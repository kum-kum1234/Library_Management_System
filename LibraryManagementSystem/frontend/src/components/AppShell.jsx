import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { LibraryDataProvider } from '../context/LibraryDataContext';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LibraryDataProvider>
      <div className={`layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        <div className="main-wrapper">
          <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
          <main className="page-content">
            <Outlet />
          </main>
        </div>
      </div>
    </LibraryDataProvider>
  );
}
