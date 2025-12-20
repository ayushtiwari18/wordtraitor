import { create } from 'zustand'
import { supabase, authHelpers } from '@/lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  // Initialize auth state
  initialize: async () => {
    try {
      set({ loading: true })
      
      // Get current session
      const session = await authHelpers.getSession()
      
      if (session?.user) {
        // Fetch profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (error) throw error
        
        set({ 
          user: session.user, 
          profile,
          loading: false 
        })
      } else {
        set({ 
          user: null, 
          profile: null,
          loading: false 
        })
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          set({ 
            user: session.user, 
            profile 
          })
        } else {
          set({ 
            user: null, 
            profile: null 
          })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ 
        error: error.message, 
        loading: false 
      })
    }
  },

  // Sign up new user
  signUp: async (email, password, username) => {
    try {
      set({ loading: true, error: null })
      
      const data = await authHelpers.signUp(email, password, username)
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      set({ 
        user: data.user, 
        profile,
        loading: false 
      })
      
      return { success: true }
    } catch (error) {
      console.error('Sign up error:', error)
      set({ 
        error: error.message, 
        loading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Sign in existing user
  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null })
      
      const data = await authHelpers.signIn(email, password)
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      set({ 
        user: data.user, 
        profile,
        loading: false 
      })
      
      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      set({ 
        error: error.message, 
        loading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await authHelpers.signOut()
      set({ 
        user: null, 
        profile: null, 
        error: null 
      })
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Update profile
  updateProfile: async (updates) => {
    try {
      const userId = get().user?.id
      if (!userId) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      
      set({ profile: data })
      return { success: true }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: error.message }
    }
  },

  // Clear error
  clearError: () => set({ error: null })
}))