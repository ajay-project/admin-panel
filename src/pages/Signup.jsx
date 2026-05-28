import React, { useState, useEffect } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Signup() {
  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPwd,      setShowPwd]      = useState(false)
  const [strength,     setStrength]     = useState(0)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countdown,    setCountdown]    = useState(5)
  const { signup, user, profile }       = useAuth()
  const navigate                        = useNavigate()

  if (user && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  const calcStrength = (pwd) => {
    let s = 0
    if (pwd.length >= 6)  s++
    if (pwd.length >= 10) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
  }

  const handlePasswordChange = (v) => {
    setPassword(v)
    setStrength(calcStrength(v))
  }

  useEffect(() => {
    let t
    if (success && countdown > 0) t = setTimeout(() => setCountdown(c => c - 1), 1000)
    else if (success && countdown === 0) navigate('/login')
    return () => clearTimeout(t)
  }, [success, countdown, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setIsSubmitting(true)
    setError('')
    try {
      await signup(email, password, name)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const strengthColor = ['#ef4444','#f97316','#f59e0b','#10b981','#10b981'][strength] || '#ef4444'
  const strengthLabel = ['','Weak','Fair','Good','Strong','Very Strong'][strength] || ''

  if (success) {
    return (
      <>
        <style>{`
          .success-check circle { animation: none; }
          .success-check polyline { stroke-dasharray: 60; stroke-dashoffset: 0; animation: checkDraw 0.6s ease 0.3s both; }
          @keyframes countdownBar {
            from { width: 100%; }
            to   { width: 0%; }
          }
          @media (max-width: 500px) {
            .admin-signup-container {
              padding: 1rem !important;
              min-height: calc(100vh - 62px) !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .admin-signup-card {
              padding: 2rem 1.25rem !important;
              border-radius: var(--radius-lg) !important;
            }
          }
        `}</style>
        <div className="admin-signup-container" style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.06), transparent)',
          }} />
          <div className="admin-signup-card" style={{
            background: 'rgba(13,20,40,0.85)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 'var(--radius-2xl)',
            padding: '3rem 2.5rem',
            maxWidth: '460px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(16,185,129,0.07)',
            animation: 'fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            {/* Animated check */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)',
              border: '2px solid rgba(16,185,129,0.4)',
              marginBottom: '1.5rem',
              boxShadow: '0 0 30px rgba(16,185,129,0.2)',
            }}>
              <svg className="success-check" width="36" height="36" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="25" stroke="#10b981" strokeWidth="2" fill="none"/>
                <polyline fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="60" strokeDashoffset="0"
                  style={{ animation: 'checkDraw 0.6s ease 0.2s both' }}
                  points="14,27 23,36 38,18"/>
              </svg>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800,
              color: '#f1f5f9', marginBottom: '0.75rem',
            }}>
              Request Submitted!
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.9rem', marginBottom: '1rem' }}>
              Your profile has been created and is <strong style={{ color: '#f97316' }}>pending approval</strong>.
              An administrator must approve your account before you can sign in.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.75rem' }}>
              You'll be notified once access is granted.
            </p>

            {/* Countdown bar */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem 1rem',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Redirecting to login in <strong style={{ color: '#f97316', fontFamily: 'var(--font-mono)' }}>{countdown}s</strong>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #f97316, #ea580c)',
                  borderRadius: '999px',
                  animation: `countdownBar ${countdown + 1}s linear forwards`,
                  boxShadow: '0 0 8px rgba(249,115,22,0.5)',
                }} />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        .signup-input {
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
        .signup-input:focus {
          border-color: var(--brand-primary);
          background: rgba(7,12,28,0.9);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
        }
        .signup-input::placeholder { color: var(--text-muted); }
        .signup-submit {
          width: 100%; padding: 0.9rem;
          border-radius: var(--radius-md); border: none;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: #fff; font-size: 0.95rem; font-weight: 700; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 20px rgba(249,115,22,0.35);
          font-family: var(--font-display);
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .signup-submit:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 8px 30px rgba(249,115,22,0.5);
        }
        .signup-submit:disabled { opacity: 0.75; cursor: not-allowed; }
        .pwd-eye {
          position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--text-muted);
          padding: 0.2rem; display: flex; align-items: center; transition: color 0.2s;
        }
        .pwd-eye:hover { color: var(--text-secondary); }
        @media (max-width: 500px) {
          .admin-signup-container {
            padding: 1rem !important;
            min-height: calc(100vh - 62px) !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .admin-signup-card {
            padding: 2rem 1.25rem !important;
            border-radius: var(--radius-lg) !important;
          }
        }
      `}</style>

      <div className="admin-signup-container" style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
        <div style={{
          position: 'fixed', top: '-200px', left: '-100px',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(249,115,22,0.07), transparent 65%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        <div className="admin-signup-card" style={{
          background: 'rgba(13,20,40,0.88)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 'var(--radius-2xl)',
          padding: '2.75rem 2.5rem',
          width: '100%', maxWidth: '440px',
          position: 'relative', zIndex: 1,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(249,115,22,0.05)',
          animation: 'fadeInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #f97316, #c2410c)',
              marginBottom: '1.25rem',
              boxShadow: '0 6px 24px rgba(249,115,22,0.4)', fontSize: '1.65rem',
            }}>
              📋
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800,
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: '0.35rem',
            }}>
              Request Access
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem' }}>
              Submit your administrator account request
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5', borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem', fontSize: '0.84rem',
              marginBottom: '1.5rem', animation: 'slideDown 0.2s ease-out',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Full Name
              </label>
              <input className="signup-input" type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Alex Administrator" required disabled={isSubmitting} />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Email Address
              </label>
              <input className="signup-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="alex@company.com" required disabled={isSubmitting} />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input className="signup-input" type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => handlePasswordChange(e.target.value)} placeholder="Min. 6 characters"
                  required disabled={isSubmitting} style={{ paddingRight: '2.8rem' }} />
                <button type="button" className="pwd-eye" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                  {showPwd
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {/* Strength meter */}
              {password && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '0.25rem' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '3px', borderRadius: '999px',
                        background: i <= strength ? strengthColor : 'rgba(255,255,255,0.06)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: strengthColor, fontWeight: 500 }}>
                    {strengthLabel}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="signup-submit" disabled={isSubmitting} style={{ marginTop: '0.5rem' }}>
              {isSubmitting ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Submitting…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Submit Request
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#f97316', fontWeight: 600, textDecoration: 'none' }}
              onMouseOver={e => e.target.style.color = '#fdba74'}
              onMouseOut={e => e.target.style.color = '#f97316'}>
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
