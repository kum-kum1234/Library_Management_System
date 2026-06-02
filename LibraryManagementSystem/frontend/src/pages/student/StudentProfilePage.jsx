import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../context/StudentDataContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const { loading, profile, stats } = useStudent();
  const [avatar, setAvatar] = useState(localStorage.getItem('student_avatar') || '');

  const saveProfile = (e) => {
    e.preventDefault();
    if (avatar) localStorage.setItem('student_avatar', avatar);
    toast.info('Profile image saved locally. Backend profile update not available yet.');
  };

  if (loading) return <LoadingSpinner label="Loading profile..." />;

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Your library account information</p>
      </div>

      <div className="card panel-card profile-card">
        <div className="avatar large">
          {avatar ? <img src={avatar} alt="" /> : (profile?.username || user?.username)?.charAt(0).toUpperCase()}
        </div>
        <form className="form-grid" onSubmit={saveProfile}>
          <label>
            Username
            <input value={profile?.username || user?.username || ''} readOnly />
          </label>
          <label>
            Role
            <input value={profile?.role || 'student'} readOnly />
          </label>
          <label>
            Profile image URL
            <input
              placeholder="Paste image URL"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </label>
          <div className="profile-stats">
            <span>Books borrowed: <strong>{stats.totalBorrowed}</strong></span>
            <span>Active loans: <strong>{stats.currentlyIssued + stats.overdueCount}</strong></span>
          </div>
          <button type="submit" className="btn-primary">Save Profile</button>
        </form>
      </div>
    </div>
  );
}
