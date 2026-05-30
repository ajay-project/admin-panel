import React, { useState, useEffect, useRef } from 'react'
import { FEATURE_FLAGS } from '../config/featureFlags'
import {
  getUserSessions,
  forceLogoutSession,
  forceLogoutAllSessions,
  updateMaxSessions
} from '../services/adminService'
import '../styles/ManageSessionsModal.css'

export default function ManageSessionsModal({
  isOpen,
  user,
  onClose,
  onUpdateUser,
}) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [limit, setLimit] = useState(1)
  const [savingLimit, setSavingLimit] = useState(false)
  const [terminatingAll, setTerminatingAll] = useState(false)
  const [actionSessionId, setActionSessionId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && user) {
      setLimit(user.max_sessions || (user.role === 'admin' ? FEATURE_FLAGS.DEFAULT_MAX_SESSIONS_ADMIN : FEATURE_FLAGS.DEFAULT_MAX_SESSIONS_USER))
      fetchSessions()
    } else {
      setSessions([])
      setError('')
      setSuccess('')
    }
  }, [isOpen, user])

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

  const fetchSessions = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const activeSessions = await getUserSessions(user.id)
      setSessions(activeSessions)
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Failed to load active sessions.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLimit = async () => {
    if (!user) return
    setSavingLimit(true)
    setError('')
    setSuccess('')
    try {
      const updatedUser = await updateMaxSessions(user.id, limit)
      if (updatedUser) {
        setSuccess('Session limit updated successfully.')
        if (onUpdateUser) {
          onUpdateUser(updatedUser)
        }
      }
    } catch (err) {
      console.error('Error updating session limit:', err)
      setError('Failed to update session limit.')
    } finally {
      setSavingLimit(false)
    }
  }

  const handleForceLogout = async (sessionId) => {
    if (!user) return
    setActionSessionId(sessionId)
    setError('')
    setSuccess('')
    try {
      await forceLogoutSession(sessionId, user.id)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      setSuccess('Session terminated successfully.')
      // Notify parent to update counts
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          active_sessions_count: Math.max(0, (user.active_sessions_count || 1) - 1)
        })
      }
    } catch (err) {
      console.error('Error forcing logout:', err)
      setError('Failed to terminate session.')
    } finally {
      setActionSessionId(null)
    }
  }

  const handleForceLogoutAll = async () => {
    if (!user) return
    setTerminatingAll(true)
    setError('')
    setSuccess('')
    try {
      await forceLogoutAllSessions(user.id)
      setSessions([])
      setSuccess('All sessions terminated successfully.')
      // Notify parent to update counts
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          active_sessions_count: 0
        })
      }
    } catch (err) {
      console.error('Error forcing logout all:', err)
      setError('Failed to terminate all sessions.')
    } finally {
      setTerminatingAll(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown'
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (!isOpen || !user) return null

  const isUserAdmin = user.role === 'admin'
  const minLimit = 1
  const maxLimit = FEATURE_FLAGS.DROPDOWN_MAX_LIMIT

  return (
    <div
      className="sessions-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && !savingLimit && !terminatingAll && !actionSessionId) {
          onClose()
        }
      }}
    >
      <div className="sessions-modal-card">
        {/* Header */}
        <div className="sessions-modal-header">
          <div className="sessions-modal-header-text">
            <div className="sessions-modal-label">
              Session Control
            </div>
            <h3 className="sessions-modal-title">
              Manage Active Sessions
            </h3>
            <p className="sessions-modal-subtitle">
              User: <span className="user-email">{user.email}</span> · Role: <span className={user.role === 'admin' ? 'user-role-admin' : 'user-role-user'}>{user.role}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="sessions-modal-close-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body Content - Scrollable */}
        <div className="sessions-modal-body">
          {/* Status Messages */}
          {error && (
            <div className="sessions-modal-alert-error">
              {error}
            </div>
          )}
          {success && (
            <div className="sessions-modal-alert-success">
              {success}
            </div>
          )}

          {/* Session Limit Configurator */}
          <div className="sessions-limit-label">
            CONCURRENT SESSION LIMIT
          </div>
          <div className="limit-input-container">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            <div className="limit-info">
              <div className="limit-info-title">Max Allowed Devices</div>
              <div className="limit-info-desc">
                Limit concurrent logged-in screens ({minLimit} to {maxLimit} screens based on role).
              </div>
            </div>
            <div className="custom-select-container" ref={dropdownRef}>
              <button
                type="button"
                className="custom-select-trigger"
                onClick={() => !savingLimit && setShowDropdown(!showDropdown)}
                disabled={savingLimit}
              >
                <span>{limit}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`chevron-icon ${showDropdown ? 'open' : ''}`}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {showDropdown && (
                <div className="custom-select-options">
                  {Array.from({ length: maxLimit - minLimit + 1 }, (_, i) => minLimit + i).map(n => (
                    <div
                      key={n}
                      className={`custom-select-option ${limit === n ? 'selected' : ''}`}
                      onClick={() => {
                        setLimit(n)
                        setShowDropdown(false)
                      }}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              className="limit-save-btn"
              onClick={handleSaveLimit}
              disabled={savingLimit || limit === (user.max_sessions || (user.role === 'admin' ? FEATURE_FLAGS.DEFAULT_MAX_SESSIONS_ADMIN : FEATURE_FLAGS.DEFAULT_MAX_SESSIONS_USER))}
            >
              {savingLimit ? 'Saving…' : 'Save Limit'}
            </button>
          </div>

          {/* Active Sessions Header */}
          <div className="sessions-active-header">
            <div className="sessions-active-label">
              ACTIVE SESSIONS ({sessions.length})
            </div>
            {sessions.length > 0 && (
              <button
                onClick={handleForceLogoutAll}
                disabled={terminatingAll}
                className="sessions-logout-all-btn"
              >
                {terminatingAll ? 'Logging Out All…' : 'Force Logout All'}
              </button>
            )}
          </div>

          {/* Sessions List */}
          {loading ? (
            <div className="sessions-loading-wrapper">
              <span className="sessions-loading-spinner" />
              <span className="sessions-loading-text">Retrieving active sessions…</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="sessions-empty-state">
              <div className="sessions-empty-icon">🔒</div>
              <div className="sessions-empty-title">No active sessions</div>
              <div className="sessions-empty-desc">This user has no active logins.</div>
            </div>
          ) : (
            sessions.map((sess) => {
              const isPending = actionSessionId === sess.id

              return (
                <div key={sess.id} className="session-item">
                  <div className="session-item-left">
                    {/* OS Icon container */}
                    <div className="session-os-icon">
                      {sess.platform?.toLowerCase().includes('mac') || sess.platform?.toLowerCase().includes('ios') ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/>
                          <path d="M12 6V12L16 14"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                          <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                      )}
                    </div>

                    {/* Session Metadata */}
                    <div className="session-meta">
                      <div className="session-meta-title">
                        {sess.browser || 'Browser'} on {sess.platform || 'Unknown OS'}
                      </div>
                      <div className="session-meta-dates">
                        <span>Logged in: {formatDate(sess.created_at)}</span>
                        <span>Last Activity: {formatDate(sess.last_activity)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <button
                    className="session-logout-btn"
                    onClick={() => handleForceLogout(sess.id)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <span style={{
                          width: '10px', height: '10px',
                          border: '1.5px solid rgba(239, 68, 68, 0.3)',
                          borderTop: '1.5px solid #f87171',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                        }} />
                        Terminating…
                      </>
                    ) : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                        </svg>
                        Force Logout
                      </>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="sessions-modal-footer">
          <button
            onClick={onClose}
            className="sessions-modal-footer-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
