import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

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
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '6rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
          fontFamily: "'Outfit', sans-serif",
        }}>
          404
        </div>
        
        <h2 style={{
          margin: '0 0 1rem 0',
          fontFamily: "'Outfit', sans-serif",
          color: '#ffffff',
          fontSize: '1.75rem',
          fontWeight: 700,
        }}>
          Page Not Found
        </h2>
        
        <p style={{
          margin: '0 0 2rem 0',
          color: '#cbd5e1',
          lineHeight: '1.6',
          fontSize: '0.95rem',
        }}>
          The page you are looking for doesn't exist or has been moved to another location.
        </p>

        <button
          onClick={() => navigate('/admin')}
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
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}
