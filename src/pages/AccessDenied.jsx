import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AccessDenied() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error(err)
      navigate('/login')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'radial-gradient(circle at top, #1e293b, #0f172a)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        padding: '3rem 2rem',
        borderRadius: '24px',
        background: 'rgba(30, 41, 59, 0.75)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(239, 68, 68, 0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid #ef4444',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: '#ef4444',
          marginBottom: '1.5rem',
        }}>
          🚫
        </div>
        
        <h2 style={{
          margin: '0 0 1rem 0',
          fontFamily: "'Outfit', sans-serif",
          color: '#ffffff',
          fontSize: '1.75rem',
          fontWeight: 700,
        }}>
          Access Denied
        </h2>
        
        <p style={{
          margin: '0 0 2rem 0',
          color: '#cbd5e1',
          lineHeight: '1.6',
          fontSize: '0.95rem',
        }}>
          You do not have the required administrator privileges to view this control panel. Please log in with an authorized account.
        </p>

        <button
          onClick={handleLogout}
          style={{
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            color: '#ffffff',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            width: '100%',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Return to Login
        </button>
      </div>
    </div>
  )
}
