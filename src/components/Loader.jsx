import React from 'react'
import '../styles/Loader.css'

/**
 * Premium full-screen loading overlay with triple-ring spinner.
 * @param {string} message - Optional message to display.
 */
export default function Loader({ message = 'Loading…' }) {
  return (
    <div className="loader-overlay">
      {/* Triple ring spinner */}
      <div className="loader-spinner-container">
        {/* Outer ring */}
        <div className="loader-spinner-outer" />
        {/* Middle ring */}
        <div className="loader-spinner-middle" />
        {/* Inner dot */}
        <div className="loader-spinner-inner" />
      </div>

      {/* Card */}
      <div className="loader-card">
        <p className="loader-message">
          {message}
        </p>
        {/* Animated dots */}
        <div className="loader-dots">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="loader-dot"
              style={{ animation: `loaderDot 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
