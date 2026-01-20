import React, { useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import ThemeToggle from '../components/ThemeToggle'
import { Outlet, useLocation } from 'react-router-dom'

export default function AppLayout() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  const location = useLocation()

  // ajuste esse path conforme sua rota real do chat
  const isChatRoute = location.pathname.includes('/agentes/')

  return (
    <div className="relative flex min-h-screen w-full bg-background-light dark:bg-background-dark font-display">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        {!isChatRoute && (
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
        )}

        <div className="w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
