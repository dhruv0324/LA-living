import { createClient } from '@supabase/supabase-js'

// These will need to be replaced with your actual Supabase project URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const authHelpers = {
  // Sign up with email and password (no email verification required)
  signUp: async (email: string, password: string, metadata: { name: string; username: string }) => {
    try {
      // First, sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: undefined // Disable email verification
        }
      })

      if (authError) {
        return { data: null, error: authError }
      }

      // If auth signup successful and user is created, add to custom users table
      if (authData.user && authData.user.id) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id, // Use the same UUID from auth.users
              name: metadata.name,
              username: metadata.username,
              email: email
            }
          ])

        if (insertError) {
          // If inserting into users table fails, we should clean up the auth user
          console.error('Failed to create user record:', insertError)
          return { data: null, error: insertError }
        }
      }

      return { data: authData, error: null }
    } catch (err) {
      console.error('Signup error:', err)
      return { data: null, error: err as any }
    }
  },

  // Sign in with email and password
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { data, error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Check if username is available
  checkUsernameAvailable: async (username: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows returned means username is available
      return { available: true, error: null }
    }

    if (error) {
      return { available: false, error }
    }

    // If we got data, username is taken
    return { available: false, error: null }
  },

  // Check if email is available
  checkEmailAvailable: async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (error && error.code === 'PGRST116') {
      // No rows returned means email is available
      return { available: true, error: null }
    }

    if (error) {
      return { available: false, error }
    }

    // If we got data, email is taken
    return { available: false, error: null }
  }
} 