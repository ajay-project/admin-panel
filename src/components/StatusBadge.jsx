import React from 'react'
import '../styles/StatusBadge.css'

/**
 * StatusBadge — premium pill badge for role and approval status.
 * @param {'role'|'status'} type
 * @param {string|boolean} value
 */
export default function StatusBadge({ type, value }) {
  let text = '', icon = null, className = ''

  if (type === 'role') {
    if (value === 'admin') {
      text = 'Admin'
      className = 'role-admin'
      icon = (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      )
    } else {
      text = 'User'
      className = 'role-user'
      icon = (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      )
    }
  } else if (type === 'status') {
    if (value === true) {
      text = 'Approved'
      className = 'status-approved'
      icon = (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )
    } else {
      text = 'Pending'
      className = 'status-pending'
      icon = (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      )
    }
  }

  return (
    <span className={`status-badge ${className}`}>
      {icon}
      {text}
    </span>
  )
}
