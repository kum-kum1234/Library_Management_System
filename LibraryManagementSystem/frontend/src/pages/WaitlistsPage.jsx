import React from 'react';
import WaitlistManagementPanel from '../components/WaitlistManagementPanel';

export default function WaitlistsPage() {
  return (
    <div className="page-waitlists">
      <div className="page-header">
        <h1>Waitlist Management</h1>
        <p>Manage queues, reservations, and student notifications</p>
      </div>
      <WaitlistManagementPanel fullPage />
    </div>
  );
}
