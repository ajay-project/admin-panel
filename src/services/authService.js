import { supabase } from '../lib/supabase'
import { isCapacityAvailable } from './platformCapacityService'

/**
 * Signs up a new user using Supabase Auth.
 * Note: The public.users profile row is created automatically by a database trigger.
 * @param {string} email
 * @param {string} password
 * @param {string} name
 */
export const signupUser = async (email, password, name) => {
  // 0. Check capacity first
  const capacityAvailable = await isCapacityAvailable()
  if (!capacityAvailable) {
    throw new Error('CAPACITY_FULL')
  }

  // 1. Check signup status via RPC function
  try {
    const { data: statusData, error: statusError } = await supabase.rpc(
      'check_signup_status',
      { p_email: email }
    );
    
    if (statusError) {
      console.error('RPC check_signup_status failed:', statusError);
    } else if (statusData && statusData.length > 0) {
      const { user_exists, is_approved } = statusData[0];
      if (user_exists) {
        if (is_approved) {
          throw new Error('This email is already registered. Please login.');
        } else {
          throw new Error('You have already registered. Please wait for admin approval.');
        }
      }
    }
  } catch (rpcErr) {
    // If it's one of our custom error messages, rethrow it.
    if (rpcErr.message && (
      rpcErr.message.includes('already registered') || 
      rpcErr.message.includes('wait for admin approval')
    )) {
      throw rpcErr;
    }
    // Otherwise, log other database errors and proceed gracefully to standard auth.signUp
    console.error('Gracefully proceeding to signup despite RPC check error:', rpcErr);
  }

  // 2. Sign up the user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (error) throw error
  return data
}

/**
 * Signs in a user and updates their last login timestamp.
 * @param {string} email
 * @param {string} password
 */
export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Update last login in the public users profile table
  if (data?.user) {
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

  return data
}

/**
 * Logs out the current authenticated user.
 */
export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Fetches the user profile from public.users table.
 * @param {string} userId
 */
export const fetchUserProfile = async (userId) => {
  if (!userId) return null
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}
