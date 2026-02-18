import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
}

type AuthContextType = AuthState & {
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** Nome do usuário extraído dos user_metadata do Supabase */
  displayName: string | null
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  // ──────────────────────────────────────────────
  // Nome do usuário (vem do user_metadata.full_name)
  // ──────────────────────────────────────────────
  const displayName: string | null =
    state.user?.user_metadata?.full_name ??
    state.user?.user_metadata?.name ??
    null

  // ──────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: translateError(error.message) }
    return { error: null }
  }

  async function signUpWithEmail(email: string, password: string, name?: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name?.trim() || null,
        },
      },
    })
    if (error) return { error: translateError(error.message) }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        displayName,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ──────────────────────────────────────────────
// Helper: traduz erros comuns do Supabase
// ──────────────────────────────────────────────

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials'))
    return 'Email ou senha incorretos.'
  if (msg.includes('User already registered'))
    return 'Este email já está cadastrado.'
  if (msg.includes('Password should be at least'))
    return 'A senha precisa ter no mínimo 6 caracteres.'
  if (msg.includes('Unable to validate email'))
    return 'Email inválido.'
  if (msg.includes('Email rate limit exceeded'))
    return 'Muitas tentativas. Aguarde um momento.'
  return msg
}