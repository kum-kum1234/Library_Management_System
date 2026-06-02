import React from 'react';

const MAP = {
  issued: 'warning',
  returned: 'success',
  payment_pending: 'warning',
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
  overdue: 'danger',
  available: 'success',
  unavailable: 'danger',
  approved: 'success',
  rejected: 'danger',
  waitlist: 'warning',
  waiting: 'warning',
  notified: 'primary',
  reserved: 'success',
  expired: 'neutral',
  cancelled: 'neutral',
  removed: 'neutral',
  warning: 'warning'
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const variant = MAP[key] || 'neutral';

  return (
    <span className={`badge badge-${variant}`}>
      {key.toUpperCase()}
    </span>
  );
}
