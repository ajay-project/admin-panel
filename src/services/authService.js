import { supabase } from '../lib/supabase'

/**
 * Signs up a new user using Supabase Auth.
 * Note: The public.users profile row is created automatically by a database trigger.
 * @param {string} email
 * @param {string} password
 * @param {string} name
 */
export const signupUser = async (email, password, name) => {
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
