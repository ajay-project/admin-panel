import React, { createContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { signupUser, logoutUser, fetchUserProfile } from '../services/authService'

export const AuthContext = createContext(null)

// ── Helper: read the 4 localStorage keys and return {user, profile} or null ─
function readCache() {
  try {
    const session  = localStorage.getItem('admin_auth_session')
    const profile  = localStorage.getItem('admin_auth_profile')
    const user     = localStorage.getItem('admin_verified_user')
    const verifiedAt = localStorage.getItem('admin_auth_verified_at')

    if (!session || !profile || !user) return null

    // Enforce 48-hour expiry
    if (verifiedAt) {
      const age = Date.now() - Number(verifiedAt)
      if (age > 48 * 60 * 60 * 1000) return null   // expired
    }

    return {
      user:    JSON.parse(user),
      profile: JSON.parse(profile),
    }
  } catch (_) {
    return null
  }
}

function clearCache() {
  localStorage.removeItem('admin_auth_session')
  localStorage.removeItem('admin_auth_profile')
  localStorage.removeItem('admin_verified_user')
  localStorage.removeItem('admin_auth_verified_at')
  localStorage.removeItem('pending_verification_user')
  localStorage.removeItem('current_device_session_token')
  try {
    sessionStorage.clear()
  } catch (e) {}
  try {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
  } catch (e) {}
}

function writeCache(session, userProfile, authUser) {
  localStorage.setItem('admin_auth_session',    JSON.stringify(session))
  localStorage.setItem('admin_auth_profile',    JSON.stringify(userProfile))
  localStorage.setItem('admin_verified_user',   JSON.stringify(authUser))
  if (!localStorage.getItem('admin_auth_verified_at')) {
    localStorage.setItem('admin_auth_verified_at', Date.now().toString())
  }
}

export function AuthProvider({ children }) {
  // ── Synchronous initialisation from cache ─────────────────────────────────
  // This runs before the first render so route guards already see user/profile.
  const cache = readCache()

  const [user,    setUser]    = useState(cache?.user    ?? null)
  const [profile, setProfile] = useState(cache?.profile ?? null)
  // If cache exists, start with loading=false so no spinner on refresh/back.
  const [loading, setLoading] = useState(cache === null)

  const verifiedRef = useRef(false) // true while VerifyAccount is in flight

  // ── Background validation on mount ────────────────────────────────────────
  // Re-validates the Supabase token silently.
  // NEVER clears state while a valid cache exists (prevents flash to login).
  useEffect(() => {
    let mounted = true

    const validate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          // Supabase has no active token — clear everything and log out
          clearCache()
          if (mounted) { setUser(null); setProfile(null) }
          return
        }

        // Silently refresh the profile from DB
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        // Also check if the current session token is still active and valid in active_sessions
        const currentToken = localStorage.getItem("current_device_session_token");
        const { validateCurrentSession } = await import("../services/sessionService");
        const result = await validateCurrentSession(currentToken);
        const isSessionValid = result?.isValid === true;

        if (userProfile?.approved === true && isSessionValid) {
          writeCache(session, userProfile, session.user)
          if (mounted) {
            setUser(session.user)
            setProfile(userProfile)
          }
        } else {
          // Account no longer approved or session invalid/revoked — force logout
          clearCache()
          await supabase.auth.signOut()
          if (mounted) { setUser(null); setProfile(null) }
          if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
            window.location.href = "/login"
          }
        }
      } catch (err) {
        console.error('Background validation error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    validate()

    // Listen for real auth events (token refresh, signout from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip the SIGNED_IN event fired during VerifyAccount's login call
        if (event === 'SIGNED_IN' && verifiedRef.current) {
          verifiedRef.current = false
          return
        }

        if (event === 'SIGNED_OUT') {
          clearCache()
          if (mounted) { setUser(null); setProfile(null) }
          return
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update cached session with new tokens silently
          const cachedProfile = localStorage.getItem('admin_auth_profile')
          if (cachedProfile) {
            try {
              const p = JSON.parse(cachedProfile)
              writeCache(session, p, session.user)
              if (mounted) setUser(session.user)
            } catch (_) {}
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  // ── 30-Minute Approval Security Check ──────────────────────────────────────
  useEffect(() => {
    let intervalId = null

    const runRevalidation = async () => {
      if (!user) return
      try {
        const { data: profileData, error } = await supabase
          .from("users")
          .select("approved, role")
          .eq("id", user.id)
          .maybeSingle()

        if (error) {
          console.error("Error during approval check query:", error)
          return
        }

        if (profileData?.approved === true && profileData?.role === 'admin') {
          // User remains logged in, session continues normally
          return
        }

        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }

        const currentToken = localStorage.getItem("current_device_session_token");
        if (currentToken) {
          try {
            const { logoutSession } = await import("../services/sessionService");
            await logoutSession(currentToken);
          } catch (sessErr) {
            console.error("Error deactivating session:", sessErr);
          }
        }

        clearCache()
        setUser(null)
        setProfile(null)
        await supabase.auth.signOut()

        localStorage.setItem(
          "login_error_message",
          "Your access has been revoked or administrator privileges removed. Please contact support."
        )
        window.location.href = "/login"
      } catch (err) {
        console.error("Revalidation error:", err)
      }
    }

    if (user && profile) {
      const REVALIDATION_INTERVAL = 30 * 60 * 1000
      intervalId = setInterval(runRevalidation, REVALIDATION_INTERVAL)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [user, profile])

  // ── Session Heartbeats, Cleanups, and Live Validation ──────────────────────
  useEffect(() => {
    let heartbeatId = null
    let cleanupId = null
    let validationId = null

    const currentToken = localStorage.getItem("current_device_session_token")

    if (user && profile && currentToken) {
      // 1. Heartbeat every 10 minutes
      const runHeartbeat = async () => {
        try {
          const { heartbeatSession } = await import("../services/sessionService")
          await heartbeatSession(currentToken)
        } catch (err) {
          console.error("Heartbeat error:", err)
        }
      }
      runHeartbeat()
      heartbeatId = setInterval(runHeartbeat, 10 * 60 * 1000)

      // 2. Auto Cleanup every 10 minutes
      const runCleanup = async () => {
        try {
          const { cleanupInactiveSessions } = await import("../services/sessionService")
          await cleanupInactiveSessions()
        } catch (err) {
          console.error("Cleanup error:", err)
        }
      }
      runCleanup()
      cleanupId = setInterval(runCleanup, 10 * 60 * 1000)

      // 3. Live Session Validation every 5 minutes
      const runValidation = async () => {
        try {
          const { validateCurrentSession } = await import("../services/sessionService")
          const result = await validateCurrentSession(currentToken)

          if (!result || !result.isValid) {

            clearInterval(heartbeatId)
            clearInterval(cleanupId)
            clearInterval(validationId)

            clearCache()
            setUser(null)
            setProfile(null)
            await supabase.auth.signOut()

            localStorage.setItem(
              "login_error_message",
              "Your session has been terminated (either limit exceeded, force logged out, or expired)."
            )
            window.location.href = "/login"
          } else if (result.role && result.role !== profile?.role) {
            setProfile(prev => {
              const currentProfile = prev || profile;
              if (currentProfile && currentProfile.role !== result.role) {
                const updatedProfile = { ...currentProfile, role: result.role };
                const cachedSession = JSON.parse(localStorage.getItem("admin_auth_session") || "null");
                const cachedUser = JSON.parse(localStorage.getItem("admin_verified_user") || "null");
                writeCache(cachedSession, updatedProfile, cachedUser);
                return updatedProfile;
              }
              return prev;
            });
          }
        } catch (err) {
          console.error("Session validation error:", err)
        }
      }
      validationId = setInterval(runValidation, 5 * 60 * 1000)
    }

    return () => {
      if (heartbeatId) clearInterval(heartbeatId)
      if (cleanupId) clearInterval(cleanupId)
      if (validationId) clearInterval(validationId)
    }
  }, [user, profile])

  // ── Called by VerifyAccount after successful DB verification ──────────────
  const setVerifiedProfile = (authUser, userProfile) => {
    setUser(authUser)
    setProfile(userProfile)
    setLoading(false)
  }

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true)
    verifiedRef.current = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { verifiedRef.current = false; throw error }

      const userId = data?.user?.id
      if (!userId) { verifiedRef.current = false; throw new Error('Login failed — no user returned.') }

      // Update last login in the public users profile table
      if (data.user) {
        try {
          await supabase
            .from('users')
            .update({
              last_login: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.user.id)
        } catch (updateError) {
          console.error('Error updating last login timestamp:', updateError)
        }
      }

      localStorage.setItem('pending_verification_user', userId)
      return { userId, user: data.user }
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  const signup = async (email, password, name) => {
    setLoading(true)
    try {
      const data = await signupUser(email, password, name)
      await logoutUser()
      setUser(null)
      setProfile(null)
      return data
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      const sessionToken = localStorage.getItem('current_device_session_token')
      if (sessionToken) {
        try {
          const { logoutSession } = await import('../services/sessionService')
          await logoutSession(sessionToken)
        } catch (sessErr) {
          console.error('Error logging out session:', sessErr)
        }
      }
      await logoutUser()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearCache()
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  }

  const checkApprovalStatus = async () => {
    if (!user) return false
    const p = await fetchUserProfile(user.id)
    return p?.approved === true && p?.role === 'admin'
  }

  const value = {
    user, profile, loading,
    setLoading,
    login, signup, logout,
    checkApprovalStatus,
    setVerifiedProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
