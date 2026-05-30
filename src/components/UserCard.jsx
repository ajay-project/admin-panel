import React from 'react'
import StatusBadge from './StatusBadge'
import { FEATURE_FLAGS } from '../config/featureFlags'
import '../styles/UserCard.css'

// ── Helpers ──────────────────────────────────────────────────────────────────
function avatarGradient(email = '') {
  const s  = email.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const h1 = s % 360
  const h2 = (h1 + 45) % 360
  return `linear-gradient(135deg, hsl(${h1},65%,52%), hsl(${h2},65%,42%))`
}

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Reusable icon-button inside a card ───────────────────────────────────────
function CardAction({ className, onClick, disabled, title, icon, label }) {
  return (
    <button
      className={`uc-action-btn ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// ── Icons (inline so no extra dep needed) ─────────────────────────────────────
const icons = {
  check: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  shield: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  user: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  trash: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  lock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  clock: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  calendar: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
}

// ── UserCard ─────────────────────────────────────────────────────────────────
export default function UserCard({
  user,
  currentUser,
  onApprove,
  onReject,
  onPromote,
  onDemote,
  onDelete,
  onManageSessions,
}) {
  const isSelf     = currentUser?.id === user.id
  const isApproved = user.approved === true
  const initials   = (user.email || 'US').substring(0, 2).toUpperCase()

  const activeSessions = user.active_sessions_count || 0
  const maxSessions    = user.max_sessions || (user.role === 'admin' ? FEATURE_FLAGS.DEFAULT_MAX_SESSIONS_ADMIN : FEATURE_FLAGS.DEFAULT_MAX_SESSIONS_USER)
  const sessionsFull   = activeSessions >= maxSessions

  const joined    = formatDate(user.created_at)
  const lastLogin = formatDate(user.last_login)

  return (
    <div className={`uc-card ${isApproved ? 'uc-approved' : 'uc-pending'}`}>
      {/* Left accent stripe */}
      <span className="uc-stripe" aria-hidden="true" />

      {/* ── Header ──────────────────────────────────── */}
      <div className="uc-header">
        <div
          className="uc-avatar"
          style={{ background: avatarGradient(user.email) }}
          aria-label={initials}
        >
          {initials}
        </div>

        <div className="uc-header-info">
          <div className="uc-name-row">
            <span className="uc-name">
              {user.email?.split('@')[0] || 'User'}
            </span>
            {isSelf && <span className="uc-self-chip">You</span>}
          </div>
          <span className="uc-email" title={user.email}>
            {user.email}
          </span>
        </div>

        {/* Status dot top-right */}
        <div className={`uc-status-dot ${isApproved ? 'green' : 'amber'}`}
          title={isApproved ? 'Approved' : 'Pending approval'} />
      </div>

      {/* ── Badges ──────────────────────────────────── */}
      <div className="uc-badges">
        <StatusBadge type="role"   value={user.role}     />
        <StatusBadge type="status" value={user.approved} />
      </div>

      {/* ── Sessions bar ────────────────────────────── */}
      <div className="uc-sessions-row">
        <div className="uc-sessions-info">
          {icons.lock}
          <span className="uc-sessions-label">Sessions</span>
          <span className={`uc-sessions-count ${sessionsFull ? 'full' : activeSessions > 0 ? 'active' : ''}`}>
            {activeSessions}/{maxSessions}
          </span>
          {/* Progress bar */}
          <div className="uc-sessions-bar-track">
            <div
              className={`uc-sessions-bar-fill ${sessionsFull ? 'full' : ''}`}
              style={{ width: `${Math.min((activeSessions / maxSessions) * 100, 100)}%` }}
            />
          </div>
        </div>
        <button
          className="uc-manage-btn"
          onClick={() => onManageSessions(user)}
          type="button"
          title="Manage active sessions"
        >
          Manage
        </button>
      </div>

      {/* ── Meta dates ──────────────────────────────── */}
      <div className="uc-meta-grid">
        <div className="uc-meta-item">
          {icons.calendar}
          <div>
            <div className="uc-meta-label">Joined</div>
            <div className="uc-meta-val">{joined || 'Unknown'}</div>
          </div>
        </div>
        <div className="uc-meta-item">
          {icons.clock}
          <div>
            <div className="uc-meta-label">Last Login</div>
            <div className="uc-meta-val">{lastLogin || 'Never'}</div>
          </div>
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────── */}
      <div className="uc-actions">
        <CardAction
          className="uc-btn-approve"
          onClick={() => onApprove(user)}
          disabled={isApproved}
          title={isApproved ? 'Already approved' : 'Approve user access'}
          icon={icons.check}
          label="Approve"
        />

        {user.role === 'admin' ? (
          <CardAction
            className="uc-btn-demote"
            onClick={() => onDemote(user)}
            disabled={isSelf}
            title="Switch to standard user role"
            icon={icons.user}
            label="Make User"
          />
        ) : (
          <CardAction
            className="uc-btn-admin"
            onClick={() => onPromote(user)}
            title="Promote to admin role"
            icon={icons.shield}
            label="Make Admin"
          />
        )}

        <CardAction
          className="uc-btn-delete"
          onClick={() => onDelete(user)}
          disabled={isSelf || !isApproved}
          title={!isApproved ? 'Approve user before revoking' : 'Revoke access'}
          icon={icons.trash}
          label="Revoke"
        />
      </div>
    </div>
  )
}
