import React from 'react'
import { useAuth } from '../../context/authContext'

/**
 * Mostra nome/email do usuário logado + botão de logout.
 * Pensado para ser usado no Sidebar.
 */
export default function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { user, displayName, signOut } = useAuth()

  if (!user) return null

  // Primeira letra do nome (ou email) para o avatar
  const initial = (displayName ?? user.email ?? '?')[0].toUpperCase()

  return (
    <div
      className={`
        mt-auto border-t border-gray-200 dark:border-white/10 pt-4
        flex flex-col gap-2
        ${collapsed ? 'items-center' : ''}
      `}
    >
      {/* Avatar + info */}
      <div
        className={`
          flex items-center gap-3 px-3
          ${collapsed ? 'justify-center' : ''}
        `}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold shrink-0">
          {initial}
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            {displayName && (
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {displayName}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={signOut}
        title={collapsed ? 'Sair' : undefined}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
          text-gray-700 dark:text-gray-300
          hover:bg-red-50 dark:hover:bg-red-500/10
          hover:text-red-600 dark:hover:text-red-400
          transition-colors
          ${collapsed ? 'justify-center' : ''}
        `}
      >
        <span className="material-symbols-outlined shrink-0">logout</span>
        {!collapsed && <span>Sair</span>}
      </button>
    </div>
  )
}