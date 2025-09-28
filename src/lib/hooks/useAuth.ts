'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { clearAuthStorage, isTokenError } from '@/lib/auth-utils'

export interface AuthUser {
  id: string
  email: string
  name?: string
  created_at: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  
  let supabase: any = null
  try {
    supabase = createClient()
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    setSupabaseError(error instanceof Error ? error.message : 'Unknown error')
  }

  useEffect(() => {
    let mounted = true

    // Simple initialization function
    const initializeAuth = async () => {
      try {
        // First, try to restore from localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('auth_user')
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              console.log('Restored user from localStorage:', parsed)
              if (mounted) {
                console.log('Setting user and loading states from localStorage')
                setUser(parsed)
                setLoading(false)
                setInitializing(false)
                console.log('States set - user:', !!parsed, 'loading: false, initializing: false')
                return
              }
            } catch (parseError) {
              console.warn('Failed to parse stored user data:', parseError)
              localStorage.removeItem('auth_user')
            }
          }
        }

        // If no localStorage user, check Supabase session
        if (supabase) {
          console.log('Checking Supabase session...')
          try {
            const { data: { session }, error } = await supabase.auth.getSession()
            
            if (error) {
              console.error('Session error:', error)
              if (isTokenError(error)) {
                clearAuthStorage()
                try {
                  await supabase.auth.signOut()
                } catch (signOutError) {
                  console.warn('Failed to sign out during error cleanup:', signOutError)
                }
              }
              if (mounted) {
                setUser(null)
                setLoading(false)
                setInitializing(false)
              }
              return
            }
            
            if (session?.user && mounted) {
              console.log('User session found:', session.user.email)
              const userFromSession = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
                created_at: session.user.created_at
              }
              setUser(userFromSession)
              localStorage.setItem('auth_user', JSON.stringify(userFromSession))
              setLoading(false)
              setInitializing(false)
            } else if (mounted) {
              console.log('No user session found')
              setUser(null)
              setLoading(false)
              setInitializing(false)
            }
          } catch (sessionError) {
            console.error('Session check failed:', sessionError)
            if (mounted) {
              setUser(null)
              setLoading(false)
              setInitializing(false)
            }
          }
        } else {
          // No Supabase, just complete initialization
          if (mounted) {
            setUser(null)
            setLoading(false)
            setInitializing(false)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (mounted) {
          setUser(null)
          setLoading(false)
          setInitializing(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    let subscription: any = null
    if (supabase) {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return

          try {
            if (event === 'TOKEN_REFRESHED' && !session) {
              setUser(null)
              localStorage.removeItem('auth_user')
              setLoading(false)
              return
            }

            if (session?.user) {
              const userFromSession = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
                created_at: session.user.created_at
              }
              setUser(userFromSession)
              localStorage.setItem('auth_user', JSON.stringify(userFromSession))
              setLoading(false)
              setInitializing(false)
            } else {
              setUser(null)
              localStorage.removeItem('auth_user')
            }
            setLoading(false)
          } catch (authError) {
            console.error('Auth state change error:', authError)
            if (mounted) {
              setUser(null)
              localStorage.removeItem('auth_user')
              setLoading(false)
              setInitializing(false)
            }
          }
        }
      )
      subscription = sub
    }

    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    if (!supabase) {
      return { data: null, error: new Error('Authentication service not available') }
    }

    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
          },
        },
      })
      
      if (error) {
        return { data: null, error }
      }

      // If sign up is successful and user is confirmed, create user object directly
      if (data.user && data.session) {
        const userFromSession = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          created_at: data.user.created_at
        }
        console.log('Setting user after sign up:', userFromSession)
        setUser(userFromSession)
        localStorage.setItem('auth_user', JSON.stringify(userFromSession))
        setLoading(false)
        setInitializing(false)
        return { data, error: null }
      }

      setLoading(false)
      return { data, error: null }
    } catch (error) {
      setLoading(false)
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: new Error('Authentication service not available') }
    }

    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return { data: null, error }
      }

      // If sign in is successful, create user object directly
      if (data.user) {
        const userFromSession = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          created_at: data.user.created_at
        }
        console.log('Setting user after sign in:', userFromSession)
        setUser(userFromSession)
        localStorage.setItem('auth_user', JSON.stringify(userFromSession))
        setLoading(false)
        setInitializing(false)
        return { data, error: null }
      }

      setLoading(false)
      return { data, error: null }
    } catch (error) {
      setLoading(false)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      // Clear local state first
      setUser(null)
      localStorage.removeItem('auth_user')
      
      // Try to sign out from Supabase if client is available
      if (supabase) {
        try {
          const { error } = await supabase.auth.signOut()
          if (error) {
            console.warn('Supabase signOut error (non-critical):', error)
            // Don't throw error here as we've already cleared local state
          }
        } catch (supabaseError) {
          console.warn('Supabase signOut failed (non-critical):', supabaseError)
          // Don't throw error here as we've already cleared local state
        }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const clearAuthData = async () => {
    try {
      clearAuthStorage()
      if (supabase) {
        await supabase.auth.signOut()
      }
      setUser(null)
      localStorage.removeItem('auth_user')
      setLoading(false)
      setInitializing(false)
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Authentication service not available') }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const updateProfile = async (updates: { name?: string }) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      // Update local state only (no database calls)
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return {
    user,
    loading,
    initializing,
    supabaseError,
    signUp,
    signIn,
    signOut,
    clearAuthData,
    resetPassword,
    updateProfile,
  }
}
