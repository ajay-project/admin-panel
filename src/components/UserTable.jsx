import React from 'react'
import StatusBadge from './StatusBadge'
import '../styles/UserTable.css'

/**
 * UserTable — no horizontal scroll.
 * Uses table-layout:fixed + <colgroup> to keep all 8 columns within the
 * container width. Action buttons are icon + short label so they fit the
 * 17% Actions column without overflowing.
 */
export default function UserTable({
  users = [],
  currentUser,
  onApprove,
  onReject,
  onPromote,
  onDemote,
  onDelete,
  onManageSessions,
}) {
  const formatDate = (d) => {
    if (!d) return <span className="tbl-cell-never">Never</span>
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const capitalize = (str = '') => str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <div className="tbl-container">
      <div className="tbl-scroll-wrapper">
        <table className="tbl-element">

          {/* Fixed column widths — total = 100% */}
          <colgroup>
            <col className="tbl-col-user"     />  {/* 14% */}
            <col className="tbl-col-email"    />  {/* 20% */}
            <col className="tbl-col-role"     />  {/*  8% */}
            <col className="tbl-col-status"   />  {/*  9% */}
            <col className="tbl-col-sessions" />  {/* 10% */}
            <col className="tbl-col-joined"   />  {/* 11% */}
            <col className="tbl-col-active"   />  {/* 11% */}
            <col className="tbl-col-actions"  />  {/* 17% */}
          </colgroup>

          <thead>
            <tr className="tbl-header-row">
              <th className="tbl-header-cell">User</th>
              <th className="tbl-header-cell">Email</th>
              <th className="tbl-header-cell">Role</th>
              <th className="tbl-header-cell">Status</th>
              <th className="tbl-header-cell">Sessions</th>
              <th className="tbl-header-cell">Joined</th>
              <th className="tbl-header-cell">Last Active</th>
              <th className="tbl-header-cell align-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const isSelf     = currentUser?.id === user.id
              const isApproved = user.approved === true

              return (
                <tr key={user.id} className="tbl-row">

                  {/* ── User ── */}
                  <td className="tbl-cell">
                    <div className="tbl-user-wrapper">
                      <div className="tbl-user-avatar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <span className="tbl-user-name">
                        {capitalize(user.email?.split('@')[0] || 'User')}
                        {isSelf && <span className="tbl-user-self-badge">You</span>}
                      </span>
                    </div>
                  </td>

                  {/* ── Email ── */}
                  <td className="tbl-cell tbl-cell-email">
                    {user.email}
                  </td>

                  {/* ── Role ── */}
                  <td className="tbl-cell">
                    <StatusBadge type="role" value={user.role} />
                  </td>

                  {/* ── Status ── */}
                  <td className="tbl-cell">
                    <StatusBadge type="status" value={user.approved} />
                  </td>

                  {/* ── Sessions ── */}
                  <td className="tbl-cell">
                    <div className="tbl-sessions-wrapper">
                      <span className={`tbl-sessions-count ${(user.active_sessions_count || 0) > 0 ? 'active' : ''}`}>
                        {user.active_sessions_count || 0}/{user.max_sessions || (user.role === 'admin' ? 2 : 1)}
                      </span>
                      <button
                        className="tbl-sessions-btn"
                        onClick={() => onManageSessions(user)}
                        title="Manage Active Sessions"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </button>
                    </div>
                  </td>

                  {/* ── Joined ── */}
                  <td className="tbl-cell tbl-cell-joined">
                    {formatDate(user.created_at)}
                  </td>

                  {/* ── Last Active ── */}
                  <td className="tbl-cell tbl-cell-active">
                    {formatDate(user.last_login)}
                  </td>

                  {/* ── Actions ── */}
                  <td className="tbl-cell align-right">
                    <div className="tbl-actions-wrapper">

                      {/* Approve */}
                      <button
                        className="tbl-btn tbl-btn-approve"
                        onClick={() => onApprove(user)}
                        disabled={isApproved}
                        title={isApproved ? 'Already approved' : 'Approve user'}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>

                      {/* Role toggle */}
                      {user.role === 'admin' ? (
                        <button
                          className="tbl-btn tbl-btn-demote"
                          onClick={() => onDemote(user)}
                          disabled={isSelf}
                          title="Switch to standard user"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        </button>
                      ) : (
                        <button
                          className="tbl-btn tbl-btn-admin"
                          onClick={() => onPromote(user)}
                          title="Promote to admin"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                        </button>
                      )}

                      {/* Delete/Revoke */}
                      <button
                        className="tbl-btn tbl-btn-delete"
                        onClick={() => onDelete(user)}
                        disabled={isSelf || !isApproved}
                        title={!isApproved ? 'Approve first before revoking' : 'Revoke access'}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>

                    </div>
                  </td>

                </tr>
              )
            })}
          </tbody>

        </table>
      </div>
    </div>
  )
}
