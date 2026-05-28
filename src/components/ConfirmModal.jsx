import React, { useEffect } from 'react'
import '../styles/ConfirmModal.css'

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading   = false,
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  isDanger    = false,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    };
  }, [isOpen]);

  if (!isOpen) return null

  const themeClass = isDanger ? 'danger-theme' : ''

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget && !isLoading) onCancel() }}
    >
      <div className={`modal-card ${themeClass}`}>
        {/* Icon */}
        <div className={`modal-icon-wrap ${themeClass}`}>
          {isDanger ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>

        {/* Title */}
        <h3 className={`modal-title ${themeClass}`}>
          {title}
        </h3>

        {/* Message */}
        <p className="modal-message">
          {message}
        </p>

        {/* Actions */}
        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </button>
          <button className={`modal-confirm-btn ${themeClass}`} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="modal-btn-spinner" />
                Processing…
              </>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
