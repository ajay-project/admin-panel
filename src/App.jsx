import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute from './routes/AdminRoute'
import Navbar from './components/Navbar'
import Loader from './components/Loader'

/**
 * Route-level code splitting via React.lazy().
 *
 * Each page becomes its own chunk in the build output.
 * The browser only downloads a page's JS when the user first navigates to it.
 *
 * Routes/Navbar/AuthContext stay in the main chunk because they are needed
 * immediately on every page load.
 */
const Login          = lazy(() => import('./pages/Login'))
const Signup         = lazy(() => import('./pages/Signup'))
const VerifyAccount  = lazy(() => import('./pages/VerifyAccount'))
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AccessDenied   = lazy(() => import('./pages/AccessDenied'))
const PendingApproval = lazy(() => import('./pages/PendingApproval'))
const NotFound       = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Navbar renders immediately — not lazy-loaded */}
        <Navbar />

        {/*
          Single Suspense boundary covering all routes.
          Loader is a lightweight spinner already in the main chunk.
        */}
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login"            element={<Login />} />
            <Route path="/signup"           element={<Signup />} />
            <Route path="/access-denied"    element={<AccessDenied />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Account Verification Gate */}
            <Route path="/verify-account" element={<VerifyAccount />} />

            {/* Smart Landing Redirector */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Secure Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Base Redirection */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
