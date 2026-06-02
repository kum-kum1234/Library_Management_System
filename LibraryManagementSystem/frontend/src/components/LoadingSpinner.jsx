import React from 'react';

export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="loading-spinner" role="status">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}
