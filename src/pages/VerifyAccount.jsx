import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  validateSessionLimit,
  revokeOldestSession,
  createSession
} from '../services/sessionService'
import { FEATURE_FLAGS } from '../config/featureFlags'

export default function VerifyAccount() {
  const navigate = useNavigate()
  const { setVerifiedProfile, logout, setLoading } = useAuth()

  const [status, setStatus] = useState('verifying') // 'verifying' | 'approved' | 'pending' | 'error'
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const hasRun = useRef(false) // prevent double-execution in React 19 StrictMode

  const proceedWithSessionCreation = async (userId, session, authUser, profileData) => {
    setStatus('verifying')
    try {
      // 1. Establish session in DB first
      await createSession(userId)

      // 2. Write cache atomically
      if (session) {
        localStorage.setItem('admin_auth_session', JSON.stringify(session))
        localStorage.setItem('admin_auth_profile', JSON.stringify(profileData))
        localStorage.setItem('admin_verified_user', JSON.stringify(authUser))
        localStorage.setItem('admin_auth_verified_at', Date.now().toString())
      }

      // 3. Mark approved & navigate
      setVerifiedProfile(authUser, profileData)
      setStatus('approved')

      setTimeout(() => {
        if (profileData.role === 'admin') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }, 800)
    } catch (err) {
      console.error('Error creating session:', err)
      localStorage.removeItem('pending_verification_user')
      await supabase.auth.signOut()
      navigate('/login', { replace: true })
    }
  }

  const handleResolveLimit = async () => {
    setStatus('verifying')
    setShowLimitModal(false)

    const { data: { session } } = await supabase.auth.getSession()
    const authUser = session?.user
    let userId = localStorage.getItem('pending_verification_user')
    if (!userId && authUser) userId = authUser.id

    if (!userId) {
      navigate('/login', { replace: true })
      return
    }

    try {
      // Terminate oldest session to make room
      await revokeOldestSession(userId)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      await proceedWithSessionCreation(userId, session, authUser, profileData)
    } catch (err) {
      console.error('Error resolving session limit:', err)
      navigate('/login', { replace: true })
    }
  }

  const handleCancelLimit = async () => {
    setShowLimitModal(false)
    localStorage.removeItem('pending_verification_user')
    try {
      await supabase.auth.signOut()
    } catch (_) {}
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const verify = async () => {
      // Fetch session and user first
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      let userId = localStorage.getItem('pending_verification_user')
      if (!userId && user) {
        userId = user.id
      }

      if (!userId) {
        setLoading(false)
        navigate('/login', { replace: true })
        return
      }

      try {
        // Fetch profile
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (error) {
          console.error('Verification error:', error)
          localStorage.removeItem('pending_verification_user')
          setLoading(false)
          await logout()
          navigate('/login', { replace: true })
          return
        }
         // IF: !profile
        if (!profile) {
          localStorage.removeItem('pending_verification_user')
          setLoading(false)
          await logout()
          navigate('/login', { replace: true })
          return
        }

        // IF: profile.approved !== true
        if (profile.approved !== true) {
          localStorage.removeItem('pending_verification_user')
          setLoading(false)
          setStatus('pending')
          setShowPendingModal(true)
          await logout()
          return
        }

        // Enforce that only users with the 'admin' role can log in to the admin panel
        if (profile.role !== 'admin') {
          localStorage.removeItem('pending_verification_user')
          setLoading(false)
          setStatus('pending')
          setShowPendingModal(true)
          await logout()
          return
        }

        // IF: profile.approved === true
        if (profile.approved === true) {
          // PREMIUM FEATURE
          // Advanced Multi-Device Enforcement
          // Disabled via feature flag
          // To re-enable:
          // FEATURE_FLAGS.PREMIUM_DEVICE_ENFORCEMENT = true
          if (FEATURE_FLAGS.PREMIUM_DEVICE_ENFORCEMENT) {
            // ── Device Limit Validation ──────────────────────────────────────────
            const { allowed, activeCount, maxSessions } = await validateSessionLimit(userId)

            if (!allowed) {
              setLoading(false)
              setStatus('error')
              setShowLimitModal(true)
              return
            }
          }

          await proceedWithSessionCreation(userId, session, user, profile)
        }
      } catch (err) {
        console.error('Verification exception:', err)
        localStorage.removeItem('pending_verification_user')
        setLoading(false)
        try { await logout() } catch (_) {}
        navigate('/login', { replace: true })
      }
    }

    verify()
  }, [navigate, setVerifiedProfile, logout, setLoading])

  const handleGoToLogin = () => {
    setShowPendingModal(false)
    setLoading(false)
    navigate('/login', { replace: true })
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #1e293b, #0f172a)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Pending/Access Denied Modal */}
      {showPendingModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(249, 115, 22, 0.1)',
            padding: '2.5rem 2rem',
            maxWidth: '460px',
            width: '90%',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            animation: 'fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              color: '#f97316',
              marginBottom: '1.25rem',
            }}>
              {/* Clock/Warning icon */}
              <span style={{ fontSize: '2rem' }}>⏳</span>
            </div>
            
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: '#ffffff',
              margin: '0 0 0.75rem 0',
            }}>
              Approval Pending
            </h3>
            
            <p style={{
              fontSize: '0.95rem',
              color: '#cbd5e1',
              lineHeight: '1.6',
              margin: '0 0 1.25rem 0',
            }}>
              Your profile is either not approved or lacks administrator privileges. Standard users cannot access the administrator panel.
            </p>
            
            <div style={{
              fontSize: '0.85rem',
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              color: '#94a3b8',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              lineHeight: '1.45',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              textAlign: 'left',
            }}>
              💡 <strong>Note:</strong> If you just registered, please request a system administrator to set your role to <code>'admin'</code> and toggle <code>approved = true</code> in the database.
            </div>
            
            <button
              onClick={handleGoToLogin}
              style={{
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}

      {/* ── Maximum Device Limit Reached Modal ─────────────────────────────── */}
      {showLimitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(249, 115, 22, 0.1)',
            padding: '2.5rem 2rem',
            maxWidth: '460px',
            width: '90%',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            animation: 'fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              color: '#f97316',
              marginBottom: '1.25rem',
            }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: '32px', height: '32px' }}
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              fontFamily: "'Outfit', sans-serif",
              color: '#ffffff',
              margin: '0 0 0.75rem 0',
            }}>Device Limit Reached</h3>
            <p style={{
              fontSize: '0.95rem',
              color: '#cbd5e1',
              lineHeight: '1.6',
              margin: '0 0 1.25rem 0',
            }}>
              Maximum screen or device limit reached.
              <br />
              Would you like to logout from older devices to continue?
            </p>
            <div style={{
              fontSize: '0.85rem',
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              color: '#94a3b8',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              lineHeight: '1.45',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              textAlign: 'left',
            }}>
              💡 Continuing will terminate your oldest active session to make room for this new one.
            </div>
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <button
                onClick={handleCancelLimit}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  padding: '0.75rem 2rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flex: 1,
                  transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResolveLimit}
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flex: 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Verification Card */}
      {!showPendingModal && !showLimitModal && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '3rem 2.5rem 2.5rem',
          width: '100%',
          maxWidth: '420px',
          backdropFilter: 'blur(16px)',
          animation: 'fadeInUp 0.4s ease-out',
        }}>
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.75rem',
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              border: '1.5px solid rgba(249, 115, 22, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {status === 'verifying' && (
                <div style={{
                  width: '44px',
                  height: '44px',
                  border: '3px solid rgba(249, 115, 22, 0.1)',
                  borderTop: '3px solid #f97316',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              )}
              {status === 'approved' && (
                <span style={{ fontSize: '2.5rem', color: '#10b981' }}>✓</span>
              )}
            </div>
          </div>

          {status === 'verifying' && (
            <>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
                margin: '0 0 0.5rem 0',
              }}>
                Verifying Permissions
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: '#cbd5e1',
                margin: '0 0 1.5rem 0',
              }}>
                Retrieving database credentials and administrator roles...
              </p>
            </>
          )}

          {status === 'approved' && (
            <>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#34d399',
                fontFamily: "'Outfit', sans-serif",
                margin: '0 0 0.5rem 0',
              }}>
                Access Authorized
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: '#cbd5e1',
                margin: '0 0 1.5rem 0',
              }}>
                Welcome back! Opening Admin Dashboard...
              </p>
            </>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.9rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <span style={{ fontSize: '0.8rem' }}>🔒</span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              Security Verification
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
