import React from 'react'
import '../styles/AdminStats.css'

const STATS_CONFIG = [
  {
    key: 'total',
    label: 'Total Users',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: 'admins',
    label: 'Administrators',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    key: 'approved',
    label: 'Active Users',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    key: 'pending',
    label: 'Pending Approval',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
]

export default function AdminStats({ users = [] }) {
  const values = {
    total:    users.length,
    admins:   users.filter(u => u.role === 'admin' && u.approved).length,
    approved: users.filter(u => u.role === 'user'  && u.approved).length,
    pending:  users.filter(u => !u.approved).length,
  }

  return (
    <div className="stat-grid">
      {STATS_CONFIG.map(cfg => {
        const val = values[cfg.key]
        const isAlert = cfg.key === 'pending' && val > 0
        const cardClass = `stat-card ${cfg.key} ${isAlert ? 'is-alert' : ''}`

        return (
          <div key={cfg.key} className={cardClass}>
            {/* Icon */}
            <div className="stat-card-icon">
              {cfg.icon}
            </div>

            {/* Text */}
            <div className="stat-info">
              <div className="stat-label">
                {cfg.label}
              </div>
              <div className="stat-value">
                {val}
              </div>
              {isAlert && val > 0 && (
                <div className="stat-action-badge">
                  <span className="stat-action-dot" />
                  Action required
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
