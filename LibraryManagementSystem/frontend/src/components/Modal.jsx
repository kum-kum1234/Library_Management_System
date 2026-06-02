import React from 'react';
import { FiX } from 'react-icons/fi';

export default function Modal({ open, title, onClose, children, wide }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-card ${wide ? 'modal-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
