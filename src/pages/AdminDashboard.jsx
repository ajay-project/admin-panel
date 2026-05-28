import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  getAllUsers,
  approveUser,
  rejectUser,
  promoteUser,
  demoteUser
} from '../services/adminService'
import AdminStats from '../components/AdminStats'
import SearchBar from '../components/SearchBar'
import UserTable from '../components/UserTable'
import UserCard from '../components/UserCard'
import ConfirmModal from '../components/ConfirmModal'
import Loader from '../components/Loader'
import ManageSessionsModal from '../components/ManageSessionsModal'
import '../styles/AdminDashboard.css'

export default function AdminDashboard() {
  const { user: currentUser } = useAuth()
  const [users,        setUsers]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false) // separate spinning state for refresh btn
  const [actionLoading, setActionLoading] = useState(false)
  const [error,        setError]        = useState('')
  const [successMsg,   setSuccessMsg]   = useState('')

  const [searchQuery,  setSearchQuery]  = useState('')
  const [roleFilter,   setRoleFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [modalOpen,    setModalOpen]    = useState(false)
  const [modalConfig,  setModalConfig]  = useState({ title: '', message: '', onConfirm: () => {}, isDanger: false })

  const [sessionUser,      setSessionUser]      = useState(null)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)

  const handleManageSessions = (targetUser) => {
    setSessionUser(targetUser)
    setSessionModalOpen(true)
  }

  const handleUpdateUser = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    setSessionUser(prev => prev && prev.id === updatedUser.id ? { ...prev, ...updatedUser } : prev)
  }

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const data = await getAllUsers()
      setUsers(data)
    } catch (err) {
      console.error('Error fetching users:', err)
      showNotification('Failed to fetch users. Check your RLS policies or database connection.', 'error')
    } finally {
      setLoading(false)
      // Keep spinning for at least 600ms so the user can see the animation
      if (isRefresh) setTimeout(() => setRefreshing(false), 600)
    }
  }, [])

  useEffect(() => {
    fetchUsers()

    // Auto-refresh users list silently in background every 5 minutes
    const intervalId = setInterval(async () => {
      try {
        const data = await getAllUsers()
        setUsers(data)
      } catch (err) {
        console.error('Silent auto-refresh error:', err)
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [fetchUsers])

  const showNotification = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(''), 4000)
    } else {
      setError(msg)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleApprove = async (targetUser) => {
    setActionLoading(true)
    try {
      const updated = await approveUser(targetUser.id)
      if (updated) {
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, approved: true } : u))
        showNotification(`✓ Approved ${targetUser.email}`)
      }
    } catch (err) {
      showNotification(`Failed to approve: ${err.message}`, 'error')
    } finally { bookkeeping => {}
      setActionLoading(false) }
  }

  const handleReject = (targetUser) => {
    setModalConfig({
      title: 'Revoke Access',
      message: `Revoke approval for ${targetUser.email}? They will be locked out of all sessions immediately.`,
      isDanger: true,
      onConfirm: async () => {
        setModalOpen(false); setActionLoading(true)
        try {
          const updated = await rejectUser(targetUser.id)
          if (updated) {
            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, approved: false } : u))
            showNotification(`Revoked access for ${targetUser.email}`)
          }
        } catch (err) { showNotification(`Failed: ${err.message}`, 'error') }
        finally { setActionLoading(false) }
      }
    })
    setModalOpen(true)
  }

  const handlePromote = async (targetUser) => {
    setActionLoading(true)
    try {
      const updated = await promoteUser(targetUser.id)
      if (updated) {
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, ...updated } : u))
        showNotification(`✓ Promoted ${targetUser.email} to Admin`)
      }
    } catch (err) { showNotification(`Failed: ${err.message}`, 'error') }
    finally { setActionLoading(false) }
  }

  const handleDemote = (targetUser) => {
    setModalConfig({
      title: 'Demote Administrator',
      message: `Demote ${targetUser.email} to standard user? They will lose dashboard access.`,
      isDanger: true,
      onConfirm: async () => {
        setModalOpen(false); setActionLoading(true)
        try {
          const updated = await demoteUser(targetUser.id)
          if (updated) {
            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, ...updated } : u))
            showNotification(`Demoted ${targetUser.email} to User`)
          }
        } catch (err) { showNotification(`Failed: ${err.message}`, 'error') }
        finally { setActionLoading(false) }
      }
    })
    setModalOpen(true)
  }

  const handleDelete = (targetUser) => {
    setModalConfig({
      title: 'Revoke User Access',
      message: `This will set ${targetUser.email}'s status to Pending (approved = false). They will lose access immediately but their data will remain. You can re-approve them anytime.`,
      isDanger: true,
      onConfirm: async () => {
        setModalOpen(false); setActionLoading(true)
        try {
          const updated = await rejectUser(targetUser.id)
          if (updated) {
            // Keep user in table — just update approved to false
            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, approved: false } : u))
            showNotification(`Access revoked for ${targetUser.email}. Status set to Pending.`)
          }
        } catch (err) { showNotification(`Failed: ${err.message}`, 'error') }
        finally { setActionLoading(false) }
      }
    })
    setModalOpen(true)
  }

  const handleResetFilters = () => {
    setSearchQuery(''); setRoleFilter('all'); setStatusFilter('all')
  }

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.id    && u.id.toLowerCase().includes(q))
    const matchesRole   = roleFilter   === 'all' || u.role === roleFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && u.approved === true) ||
      (statusFilter === 'pending'  && u.approved !== true)
    return matchesSearch && matchesRole && matchesStatus
  })

  const pendingCount = users.filter(u => !u.approved).length

  return (
    <>
      {/* Full-screen loader (initial load only) */}
      {loading && users.length === 0 && <Loader message="Loading user database…" />}
      {actionLoading && <Loader message="Updating record…" />}

      <ConfirmModal
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalOpen(false)}
        isLoading={actionLoading}
        isDanger={modalConfig.isDanger}
      />

      <ManageSessionsModal
        isOpen={sessionModalOpen}
        user={sessionUser}
        onClose={() => setSessionModalOpen(false)}
        onUpdateUser={handleUpdateUser}
      />

      <div className="dashboard-page">
        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="dashboard-header">
          <div>
            <div className="dashboard-subtitle-accent">
              <span className="pulse-dot" />
              Control Center
            </div>
            <h1 className="dashboard-title">
              Administrator Dashboard
            </h1>
            <p className="dashboard-desc">
              Manage users · Approve access · Control roles
            </p>
          </div>

          <div className="dashboard-actions-row">
            {/* User count badge */}
            <div className="dashboard-user-count">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {users.length} users
            </div>

            {/* Spinning Refresh button */}
            <button
              className="refresh-btn"
              onClick={() => fetchUsers(true)}
              disabled={refreshing || loading}
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={refreshing ? 'refresh-icon-spinning' : ''}
                style={{ transition: 'none' }}
              >
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* ── Pending banner ───────────────────────────────────────────── */}
        {pendingCount > 0 && (
          <div className="pending-banner">
            <div className="pending-banner-icon-container">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div className="pending-banner-title">
                {pendingCount} user{pendingCount > 1 ? 's' : ''} awaiting approval
              </div>
              <div className="pending-banner-desc">
                Review and approve or delete their access requests below.
              </div>
            </div>
          </div>
        )}

        {/* ── Notifications ─────────────────────────────────────────────── */}
        {error && (
          <div className="notif-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="notif-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {successMsg}
          </div>
        )}

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <AdminStats users={users} />

        {/* ── Search & Filters ──────────────────────────────────────────── */}
        <SearchBar
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          roleFilter={roleFilter}   setRoleFilter={setRoleFilter}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          onReset={handleResetFilters}
          totalCount={filteredUsers.length}
        />

        {/* ── Desktop Table ─────────────────────────────────────────────── */}
        <div className="desktop-view-container">
          {filteredUsers.length > 0 ? (
            <UserTable
              users={filteredUsers}
              currentUser={currentUser}
              onApprove={handleApprove}
              onReject={handleReject}
              onPromote={handlePromote}
              onDemote={handleDemote}
              onDelete={handleDelete}
              onManageSessions={handleManageSessions}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p className="empty-state-title">
                No users match your filters
              </p>
              <p className="empty-state-desc">
                Try refining your search or{' '}
                <button onClick={handleResetFilters} className="empty-state-reset-btn">
                  reset all filters
                </button>
              </p>
            </div>
          )}
        </div>

        {/* ── Mobile Cards ─────────────────────────────────────────────── */}
        <div className="mobile-view-container">
          {filteredUsers.length > 0
            ? filteredUsers.map(user => (
                <UserCard
                  key={user.id} user={user} currentUser={currentUser}
                  onApprove={handleApprove} onReject={handleReject}
                  onPromote={handlePromote} onDemote={handleDemote}
                  onDelete={handleDelete}
                  onManageSessions={handleManageSessions}
                />
              ))
            : (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <p className="empty-state-title">No users match your filters</p>
              </div>
            )
          }
        </div>
      </div>
    </>
  )
}
