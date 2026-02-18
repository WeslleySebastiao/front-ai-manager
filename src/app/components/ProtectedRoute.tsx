import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authContext'

/**
 * Envolve rotas que exigem autenticação.
 * - Se ainda está carregando a sessão → mostra loading
 * - Se não está logado → redireciona para /login
 * - Se está logado → renderiza os filhos (Outlet)
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark font-display">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Salva a rota original para redirecionar depois do login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}