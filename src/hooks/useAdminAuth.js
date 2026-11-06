import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

export function useAdminAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return undefined
    }

    let isActive = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isActive) return
        setSession(data.session ?? null)
      })
      .catch(() => {
        if (isActive) setSession(null)
      })
      .finally(() => {
        if (isActive) setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) return
      setSession(nextSession ?? null)
      setLoading(false)
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) {
      throw new Error('Supabase no está configurado.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return {
    session,
    loading,
    signIn,
    signOut,
    isDemo: !isSupabaseConfigured,
  }
}
