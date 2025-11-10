import React, { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  )

  // Sempre que darkMode mudar, atualiza o HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium 
      text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 
      transition-colors"
    >
      <span className="material-symbols-outlined">
        {darkMode ? 'light_mode' : 'dark_mode'}
      </span>
      {darkMode ? 'Modo Claro' : 'Modo Escuro'}
    </button>
  )
}
