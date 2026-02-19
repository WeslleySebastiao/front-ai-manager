import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import UserMenu from './UserMenu'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)

  const navItems = [
    { label: 'Dashboard',  icon: 'dashboard',  href: '/app'            },
    { label: 'Agentes',    icon: 'smart_toy',  href: '/app/agentes', exact: true },
    { label: 'Novo Agente',icon: 'add_circle', href: '/app/agentes/novo'   },
    { label: 'PR Reviews', icon: 'construction',href: '/app/pr-reviews'   },
    { label: 'Em breve',   icon: 'settings',   href: '/app/configuracoes' },
  ]

  return (
    <aside
      className={`
        flex h-screen flex-col
        ${collapsed ? 'w-20' : 'w-64'}
        bg-white dark:bg-black/20
        p-4 border-r border-gray-200 dark:border-white/10
        sticky top-0
        transition-all duration-200
      `}
    >
      <div className="flex flex-col gap-4">
        {/* Header + botão colapsar */}
        <div
          className={`
            px-3 py-2 flex gap-3
            ${collapsed ? 'flex-col items-center' : 'flex-row items-center'}
          `}
        >
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
            style={{
              backgroundImage:
                'url(https://lh3.googleusercontent.com/aida-public/AB6AXuAuwATUZfjBhYJI_D4g-StSn9I9NGmcK7WucRkXSnOmy-ukI4dHNeZ9FqyX60Bg6X0mz_juY_wz6UkGS-fDOgz6r_9_KRL9zfqJCVnBK8kSjsE9XFacf-KYhW_JGSw5qVf5mlcY6y_ROwcIH61zv55xHwbYi-YibULJPPxDUfw3F2mBsWs_AM1g_HFoPDGeIHwhgImD6x4bkdpgGWFarH5d2oM2XxZBRGzYnbplEmgWDU7D0qybSb1V-bbFiNGnoI_VIMvRFjurcjU)',
            }}
          />

          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-gray-900 dark:text-white text-base font-bold leading-normal">
                Coordina
              </h1>
            </div>
          )}

          <button
            className={`
              inline-flex items-center justify-center
              rounded-lg border border-gray-200 dark:border-white/10
              text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-white/10
              transition-colors size-9
              ${collapsed ? '' : 'ml-auto'}
            `}
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            <span className="material-symbols-outlined">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium leading-normal transition-colors
                ${collapsed ? 'justify-center' : ''}
                ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-primary/20'
                }`
              }
            >
              <span className="material-symbols-outlined shrink-0">{item.icon}</span>
              {!collapsed && <p>{item.label}</p>}
            </NavLink>
          ))}
        </nav>

        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  )
}