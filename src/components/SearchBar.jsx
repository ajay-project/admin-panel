import React, { useState, useRef, useEffect, useCallback } from 'react'
import '../styles/SearchBar.css'

// ── Custom Dropdown ──────────────────────────────────────────────────────────
// Replaces native <select> entirely so backdrop-filter on parent containers
// never breaks dropdown positioning.
function CustomSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  const selected = options.find(o => o.value === value) || options[0]

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [open])

  const handleSelect = useCallback((val) => {
    onChange(val)
    setOpen(false)
  }, [onChange])

  return (
    <div className="sbc-select-group" ref={wrapRef}>
      <span className="sbc-label">{label}</span>

      <button
        type="button"
        className={`sbc-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="sbc-trigger-text">{selected.label}</span>
        <svg
          className={`sbc-chevron ${open ? 'rotated' : ''}`}
          width="12" height="12"
          viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="sbc-dropdown" role="listbox">
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`sbc-option ${opt.value === value ? 'selected' : ''}`}
              onMouseDown={() => handleSelect(opt.value)}
            >
              {opt.label}
              {opt.value === value && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Role options ─────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: 'all',   label: 'All Roles' },
  { value: 'admin', label: 'Admins'    },
  { value: 'user',  label: 'Users'     },
]

const STATUS_OPTIONS = [
  { value: 'all',      label: 'All Status' },
  { value: 'approved', label: 'Approved'   },
  { value: 'pending',  label: 'Pending'    },
]

// ── SearchBar ────────────────────────────────────────────────────────────────
export default function SearchBar({
  searchQuery,    setSearchQuery,
  roleFilter,     setRoleFilter,
  statusFilter,   setStatusFilter,
  onReset,
  totalCount,
}) {
  const hasFilters = searchQuery || roleFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="sbc-container">
      <div className="sbc-row">

        {/* Search input */}
        <div className="sbc-search-group">
          <span className="sbc-label">Search</span>
          <div className="sbc-input-wrap">
            <svg className="sbc-input-icon" width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="sbc-input"
              type="text"
              placeholder="Search by email or ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoComplete="off"
              spellCheck="false"
            />
            {searchQuery && (
              <button
                className="sbc-input-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                type="button"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Role dropdown */}
        <CustomSelect
          label="Role"
          value={roleFilter}
          onChange={setRoleFilter}
          options={ROLE_OPTIONS}
        />

        {/* Status dropdown */}
        <CustomSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />

        {/* Right cluster: result count + optional clear */}
        <div className="sbc-end-cluster">
          <div className="sbc-results-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {totalCount ?? 0} result{totalCount !== 1 ? 's' : ''}
          </div>

          {hasFilters && (
            <button className="sbc-clear-btn" onClick={onReset} type="button">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear filters
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
