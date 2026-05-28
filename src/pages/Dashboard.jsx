import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Loader from '../components/Loader'

/**
 * Dashboard is a smart redirector based on user role.
 * Redirect happens synchronously using cached profile — no spinner on refresh.
 */
export default function Dashboard() {
  const { user, profile, loading } = useAuth()

  // Only show loader when genuinely loading with nothing cached
  if (loading && !user && !profile) {
    return <Loader message="Redirecting..." />
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

  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/access-denied" replace />
}
