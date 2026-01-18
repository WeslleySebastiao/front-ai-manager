import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', href: '/' },
    { label: 'Agentes', icon: 'smart_toy', href: '/agentes', exact: true },
    { label: 'Novo Agente', icon: 'add_circle', href: '/agentes/novo' },
    { label: 'Em breve', icon: 'construction', href: '/ferramentas' },
    { label: 'Em breve', icon: 'settings', href: '/configuracoes' },
  ]

  return (
    <aside className="flex h-screen w-64 flex-col bg-white dark:bg-black/20 p-4 border-r border-gray-200 dark:border-white/10 sticky top-0">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
            style={{
              backgroundImage:
                'url(https://lh3.googleusercontent.com/aida-public/AB6AXuAuwATUZfjBhYJI_D4g-StSn9I9NGmcK7WucRkXSnOmy-ukI4dHNeZ9FqyX60Bg6X0mz_juY_wz6UkGS-fDOgz6r_9_KRL9zfqJCVnBK8kSjsE9XFacf-KYhW_JGSw5qVf5mlcY6y_ROwcIH61zv55xHwbYi-YibULJPPxDUfw3F2mBsWs_AM1g_HFoPDGeIHwhgImD6x4bkdpgGWFarH5d2oM2XxZBRGzYnbplEmgWDU7D0qybSb1V-bbFiNGnoI_VIMvRFjurcjU)',
            }}
          ></div>
          <div>
            <h1 className="text-gray-900 dark:text-white text-base font-bold leading-normal">
              AI Platform
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
              Management
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium leading-normal transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-primary/20'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <p>{item.label}</p>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
