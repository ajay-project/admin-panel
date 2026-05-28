import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute from './routes/AdminRoute'
import Navbar from './components/Navbar'

// Import Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyAccount from './pages/VerifyAccount'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AccessDenied from './pages/AccessDenied'
import PendingApproval from './pages/PendingApproval'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Navbar handles its own visibility based on role/approval status inside AuthContext */}
        <Navbar />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Dedicated Account Verification Gate */}
          <Route path="/verify-account" element={<VerifyAccount />} />

          {/* Smart Landing Redirector Route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Secure Admin Dashboard Route */}
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
      </BrowserRouter>
    </AuthProvider>
  )
}
