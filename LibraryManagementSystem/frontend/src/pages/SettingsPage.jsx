import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState({ username: '', role: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/me');
        setProfile(res.data);
      } catch {
        setProfile({ username: user?.username, role: user?.role });
      }
    };
    load();
  }, [user]);

  const saveProfile = (e) => {
    e.preventDefault();
    toast.info('Profile update API is not available on the backend yet.');
  };

  const changePassword = (e) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    toast.info('Password change requires a backend endpoint.');
  };

  const backupData = () => {
    toast.info('Export transactions and books from the Transactions and Reports pages.');
  };

  return (
    <div className="page-settings">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Profile, theme and security preferences</p>
      </div>

      <div className="settings-grid">
        <div className="card panel-card">
          <h3>Profile</h3>
          <form className="form-grid" onSubmit={saveProfile}>
            <label>
              Name
              <input value={profile.username || ''} readOnly />
            </label>
            <label>
              Role
              <input value={profile.role || ''} readOnly />
            </label>
            <button type="submit" className="btn-secondary">Save Profile</button>
          </form>
        </div>

        <div className="card panel-card">
          <h3>Theme</h3>
          <div className="theme-toggle-row">
            <button
              type="button"
              className={theme === 'light' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setTheme('light')}
            >
              Light
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setTheme('dark')}
            >
              Dark
            </button>
          </div>
        </div>

        <div className="card panel-card">
          <h3>Password</h3>
          <form className="form-grid" onSubmit={changePassword}>
            <label>Current<input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} /></label>
            <label>New<input type="password" value={passwordForm.next} onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} /></label>
            <label>Confirm<input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} /></label>
            <button type="submit" className="btn-primary">Update Password</button>
          </form>
        </div>

        <div className="card panel-card">
          <h3>Backup</h3>
          <p className="muted">Download reports from Transactions (CSV, Excel, PDF).</p>
          <button type="button" className="btn-secondary" onClick={backupData}>Backup Data</button>
          <button type="button" className="btn-danger-outline" onClick={logout} style={{ marginTop: 12 }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
