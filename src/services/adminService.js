import { supabase } from '../lib/supabase'
import { syncUserActiveSessionCount } from './sessionService'

/**
 * Fetches all user profiles in the system.
 * Only accessible if the admin has appropriate select permissions/policies.
 */
export const getAllUsers = async () => {
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (userError) throw userError
  if (!users) return []

  const { data: activeSessions, error: sessionError } = await supabase
    .from('active_sessions')
    .select('user_id')
    .eq('is_active', true)

  if (sessionError) {
    console.error('Error fetching active sessions for count mapping:', sessionError)
    return users
  }

  const sessionCounts = {}
  activeSessions.forEach(s => {
    sessionCounts[s.user_id] = (sessionCounts[s.user_id] || 0) + 1
  })

  // Self-heal/repair incorrect database active_sessions_count columns asynchronously
  users.forEach(async (u) => {
    const realCount = sessionCounts[u.id] || 0
    if (u.active_sessions_count !== realCount) {
      try {
        await supabase
          .from('users')
          .update({ active_sessions_count: realCount })
          .eq('id', u.id)
      } catch (err) {
        console.error('Error repairing session count in DB for:', u.id, err)
      }
    }
  })

  return users.map(user => ({
    ...user,
    active_sessions_count: sessionCounts[user.id] || 0
  }))
}

/**
 * Approves a user's access request.
 * @param {string} userId
 */
export const approveUser = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      approved: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()

  if (error) throw error
  return data?.[0] || null
}

export const rejectUser = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      approved: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()

  if (error) throw error

  await supabase
    .from('active_sessions')
    .update({ 
      is_active: false,
      last_activity: new Date().toISOString()
    })
    .eq('user_id', userId)

  await syncUserActiveSessionCount(userId)

  return data?.[0] || null
}

/**
 * Deletes a user profile.
 * Note: Real deletion of auth user is usually handled via admin auth APIs,
 * but this deletes the public profile row.
 * @param {string} userId
 */
export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) throw error
  return true
}

/**
 * Promotes a user to the 'admin' role.
 * @param {string} userId
 */
export const promoteUser = async (userId) => {
  // First, fetch current max_sessions
  const { data: userProfile, error: fetchError } = await supabase
    .from('users')
    .select('max_sessions')
    .eq('id', userId)
    .maybeSingle()

  if (fetchError) throw fetchError

  const currentMax = userProfile?.max_sessions ?? 0 // if null, treat as 0
  const targetMax = currentMax < 2 ? 2 : currentMax

  const { data, error } = await supabase
    .from('users')
    .update({
      role: 'admin',
      max_sessions: targetMax,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()

  if (error) throw error
  return data?.[0] || null
}

/**
 * Demotes an admin to the 'user' role.
 * @param {string} userId
 */
export const demoteUser = async (userId) => {
  // 1. Update role = 'user' and max_sessions = 1
  const { data, error } = await supabase
    .from('users')
    .update({
      role: 'user',
      max_sessions: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()

  if (error) throw error

  // 2. Fetch all active sessions, ordered by last_activity descending (latest first)
  const { data: activeSessions, error: fetchSessError } = await supabase
    .from('active_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('last_activity', { ascending: false })

  if (!fetchSessError && activeSessions && activeSessions.length > 1) {
    const olderSessionIds = activeSessions.slice(1).map(s => s.id)
    
    // Invalidate older sessions
    await supabase
      .from('active_sessions')
      .update({
        is_active: false,
        last_activity: new Date().toISOString()
      })
      .in('id', olderSessionIds)
  }

  // 3. Recalculate active_sessions_count in users table
  await syncUserActiveSessionCount(userId)

  return data?.[0] || null
}

export const toggleApproval = async (userId, currentStatus) => {
  const newStatus = !currentStatus;
  
  const { data, error } = await supabase
    .from('users')
    .update({
      approved: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()

  if (error) throw error

  if (newStatus === false) {
    await supabase
      .from('active_sessions')
      .update({ 
        is_active: false,
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId)

    await syncUserActiveSessionCount(userId)
  }

  return data?.[0] || null
}

/**
 * Updates a user's maximum session limit.
 * @param {string} userId
 * @param {number} maxSessions
 */
export const updateMaxSessions = async (userId, maxSessions) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      max_sessions: maxSessions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()

  if (error) throw error
  return data?.[0] || null
}

/**
 * Fetches all active sessions for a specific user.
 * @param {string} userId
 */
export const getUserSessions = async (userId) => {
  const { data, error } = await supabase
    .from('active_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Force logout a specific session.
 * @param {string} sessionId
 * @param {string} userId
 */
export const forceLogoutSession = async (sessionId, userId) => {
  const { error } = await supabase
    .from('active_sessions')
    .update({ 
      is_active: false,
      last_activity: new Date().toISOString()
    })
    .eq('id', sessionId)

  if (error) throw error
  if (userId) {
    await syncUserActiveSessionCount(userId)
  }
  return true
}

/**
 * Force logout all active sessions for a specific user.
 * @param {string} userId
 */
export const forceLogoutAllSessions = async (userId) => {
  const { error } = await supabase
    .from('active_sessions')
    .update({ 
      is_active: false,
      last_activity: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (error) throw error
  if (userId) {
    await syncUserActiveSessionCount(userId)
  }
  return true
}
