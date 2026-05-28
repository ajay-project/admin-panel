import React, { useState, useEffect, useRef, memo } from 'react'
import { useAuth } from '../hooks/useAuth'
import '../styles/Navbar.css'

// Separate and memoized Brand Logo component to prevent re-renders when profile menu toggles
const BrandLogo = memo(() => {
  return (
    <div className="nav-left">
      <div className="logo-icon" aria-hidden="true">
        <span className="logo-emoji">🛡️</span>
        <span className="logo-pulse"></span>
      </div>
      <div className="brand-text">
        <span className="nav-brand-title">
          Admin<span>Panel</span>
        </span>
        <div className="nav-brand-subtitle">
          Control Center
        </div>
      </div>
    </div>
  )
})

BrandLogo.displayName = 'BrandLogo'

export default function Navbar() {
  const { profile, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("modal-open");
      document.documentElement.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (!event.target.closest('.mobile-toggle-btn')) {
          setMenuOpen(false);
        }
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen]);

  if (!profile || profile.approved !== true || profile.role !== 'admin') return null

  const adminName = profile.name || profile.email?.split('@')[0] || 'Admin'
  const initials   = (profile.email || 'AD').substring(0, 2).toUpperCase()

  const handleLogout = async () => {
    setLoggingOut(true)
    try { await logout() } finally { setLoggingOut(false) }
  }

  return (
    <>
      {menuOpen && (
        <div 
          className="nav-menu-overlay" 
          onClick={() => setMenuOpen(false)}
        />
      )}

      <nav className={`admin-navbar ${menuOpen ? 'menu-active' : ''}`}>
        <div className="nav-container">
          {/* Separated and Memoized Logo Component */}
          <BrandLogo />

          {/* Right section: User info, Logout */}
          <div className="nav-right">
            <div className="user-block">
              <span className="user-name">{adminName}</span>
              <span className="user-role-badge">
                {profile?.role || "admin"}
              </span>
            </div>
            <button className="nav-logout-btn" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}>
                {initials}
              </div>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ 
                  color: '#94a3b8', 
                  transition: 'transform 0.2s', 
                  transform: menuOpen ? 'rotate(180deg)' : 'none' 
                }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </button>

          {/* Mobile Dropdown Menu */}
          <div ref={menuRef} className={`mobile-dropdown-menu ${menuOpen ? "open" : ""}`}>
            <div className="mobile-user-info" style={{ paddingBottom: '0.85rem' }}>
              <span className="mobile-user-name" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>
                {adminName}
              </span>
              {profile?.email && (
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', wordBreak: 'break-all', marginTop: '0.1rem' }}>
                  {profile.email}
                </span>
              )}
              <span
                className="mobile-user-role"
                style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.15)',
                  color: '#f97316',
                  marginTop: '0.5rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  alignSelf: 'flex-start',
                  border: '1px solid rgba(249, 115, 22, 0.2)'
                }}
              >
                {profile?.role || "admin"}
              </span>
            </div>

            <button
              className="mobile-logout-btn"
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              disabled={loggingOut}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log Out
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
