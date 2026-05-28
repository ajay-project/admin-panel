import React, { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState(() => {
    const msg = localStorage.getItem('login_error_message')
    if (msg) {
      localStorage.removeItem('login_error_message')
      return msg
    }
    return ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPwd,     setShowPwd]     = useState(false)
  const { login, user, profile }      = useAuth()
  const navigate                      = useNavigate()

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  if (user && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setIsSubmitting(true)
    setError('')
    try {
      await login(email, password)
      navigate('/verify-account')
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          font-family: var(--font-sans);
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 500px) {
          .login-page {
            padding: 1rem !important;
            min-height: calc(100vh - 62px) !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .login-card {
            padding: 2rem 1.25rem !important;
            border-radius: var(--radius-lg) !important;
            margin: 0 !important;
          }
        }
        /* Animated background orbs */
        .login-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: orbFloat 12s ease-in-out infinite;
        }
        .login-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(249,115,22,0.12), transparent 70%);
          top: -150px; right: -100px;
          animation-delay: 0s;
        }
        .login-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%);
          bottom: -100px; left: -100px;
          animation-delay: -4s;
        }
        .login-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -8s;
        }
        /* Main card */
        .login-card {
          background: rgba(13, 20, 40, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: var(--radius-2xl);
          padding: 2.75rem 2.5rem;
          width: 100%;
          max-width: 440px;
          margin: auto;
          position: relative;
          z-index: 1;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(249,115,22,0.06);
          animation: fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        /* Input field */
        .login-input {
          width: 100%;
          background: rgba(7,12,28,0.7);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--radius-md);
          padding: 0.8rem 1rem;
          color: var(--text-primary);
          font-size: 0.9rem;
          font-family: var(--font-sans);
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .login-input:focus {
          border-color: var(--brand-primary);
          background: rgba(7,12,28,0.9);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
        }
        .login-input::placeholder { color: var(--text-muted); }
        /* Submit button */
        .login-submit-btn {
          width: 100%;
          padding: 0.9rem;
          border-radius: var(--radius-md);
          border: none;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 20px rgba(249,115,22,0.35);
          font-family: var(--font-display);
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(249,115,22,0.5);
        }
        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-submit-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }
        /* Password toggle */
        .pwd-toggle {
          position: absolute;
          right: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 0.2rem;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .pwd-toggle:hover { color: var(--text-secondary); }
        /* Divider */
        .login-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.5rem 0;
          color: var(--text-muted);
          font-size: 0.78rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .login-divider::before, .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        /* Social-style info row */
        .login-security-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        @keyframes orbFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(20px,-15px) scale(1.04); }
          66%      { transform: translate(-10px,10px) scale(0.97); }
        }
      `}</style>

      <div className="login-page">
        {/* Background orbs */}
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />

        {/* Grid overlay */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />

        <div className="login-card">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
            {/* Logo badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f97316, #c2410c)',
              marginBottom: '1.25rem',
              boxShadow: '0 6px 24px rgba(249,115,22,0.4)',
              fontSize: '1.75rem',
              animation: 'pulseGlow 3s ease-in-out infinite',
            }}>
              🛡️
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.85rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.4rem',
            }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Sign in to your administrator account
            </p>

            {/* "Admin access only" badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '0.75rem',
              padding: '0.3rem 0.8rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(249,115,22,0.08)',
              border: '1px solid rgba(249,115,22,0.2)',
              fontSize: '0.72rem',
              color: '#fb923c',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              <span style={{
                width: '5px', height: '5px',
                borderRadius: '50%',
                background: '#f97316',
                boxShadow: '0 0 6px #f97316',
                animation: 'pulse 2s infinite',
              }} />
              Admin Access Only
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              fontSize: '0.84rem',
              marginBottom: '1.5rem',
              animation: 'slideDown 0.2s ease-out',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.45rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Email Address
              </label>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.45rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="login-input"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  style={{ paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                >
                  {showPwd ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={isSubmitting}
              style={{ marginTop: '0.5rem' }}
            >
              {isSubmitting ? (
                <>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Authenticating…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            Need an admin account?{' '}
            <Link
              to="/signup"
              style={{ color: '#f97316', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => e.target.style.color = '#fdba74'}
              onMouseOut={e => e.target.style.color = '#f97316'}
            >
              Request Access →
            </Link>
          </div>

          {/* Security note */}
          <div className="login-security-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>End-to-end encrypted · Supabase Auth</span>
          </div>
        </div>
      </div>
    </>
  )
}
