import React from 'react';

export default function ReservationStatusBadge({ status }) {
  const getStatusStyle = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'badge-warning';
      case 'approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusLabel = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status || 'Unknown';
    }
  };

  return (
    <span className={`badge ${getStatusStyle()}`}>
      {getStatusLabel()}
    </span>
  );
}
