import React from 'react';

import {
  Outlet
} from 'react-router-dom';

import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppShell() {

  return (

    <div className="layout">

      <Sidebar />

      <div className="content-area">

        <Navbar />

        <main className="main-content">

          <Outlet />

        </main>

      </div>

    </div>
  );
}