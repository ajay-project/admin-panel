import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Loader from '../components/Loader'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // Only block+show spinner if genuinely loading with no user at all
  if (loading && !user) {
    return <Loader message="Checking session..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
