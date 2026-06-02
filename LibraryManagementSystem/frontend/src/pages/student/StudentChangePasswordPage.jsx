import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function StudentChangePasswordPage() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    toast.info('Password change requires a backend API endpoint.');
  };

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>Change Password</h1>
        <p>Update your account password securely</p>
      </div>

      <div className="card panel-card" style={{ maxWidth: 480 }}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Current Password
            <input
              type="password"
              required
              value={form.current}
              onChange={(e) => setForm({ ...form, current: e.target.value })}
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              required
              value={form.next}
              onChange={(e) => setForm({ ...form, next: e.target.value })}
            />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-primary">Update Password</button>
        </form>
      </div>
    </div>
  );
}
