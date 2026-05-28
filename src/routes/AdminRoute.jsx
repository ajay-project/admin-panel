import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Loader from '../components/Loader'

/**
 * AdminRoute — grants access only to approved admins.
 *
 * Priority order:
 *  1. If loading AND no cache → show spinner (first-ever page load with no data)
 *  2. Read profile from context (already populated from cache synchronously)
 *  3. Gate on approved + admin role
 */
export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()

  // Only show spinner when we genuinely have nothing yet (no cache, first load)
  if (loading && !user && !profile) {
    return <Loader message="Loading admin panel..." />
  }

  if (!user && !profile) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (profile.approved !== true) {
    return <Navigate to="/pending-approval" replace />
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/access-denied" replace />
  }

  return children
}
