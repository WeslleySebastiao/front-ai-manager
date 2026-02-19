import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext'

type Mode = 'login' | 'signup'

export default function Login() {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const res = await signInWithEmail(email.trim(), password)
        if (res.error) {
          setError(res.error)
        } else {
          // ✅ redireciona para /app (app protegido)
          navigate('/app', { replace: true })
        }
      } else {
        const res = await signUpWithEmail(email.trim(), password, name.trim())
        if (res.error) {
          setError(res.error)
        } else {
          setSuccess('Conta criada! Verifique seu email para confirmar.')
        }
      }
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'))
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark font-display px-4 relative">
      {/* Theme Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-5 right-5 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10
          border border-gray-200 dark:border-white/10 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">
          {darkMode ? 'light_mode' : 'dark_mode'}
        </span>
        {darkMode ? 'Claro' : 'Escuro'}
      </button>

      {/* ✅ Botão voltar para landing */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-5 left-5 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10
          border border-gray-200 dark:border-white/10 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        Voltar
      </button>

      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">
              smart_toy
            </span>
          </div>
          <h1 className="text-gray-900 dark:text-white text-2xl font-bold">
            Coordina
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login'
              ? 'Entre na sua conta para continuar'
              : 'Crie sua conta para começar'}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="flex flex-col">
                <label htmlFor="name" className="text-gray-800 dark:text-white text-sm font-medium pb-2">
                  Nome completo
                </label>
                <input
                  id="name" type="text" required autoComplete="name"
                  placeholder="Seu nome" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg text-gray-800 dark:text-white
                    focus:outline-0 focus:ring-2 focus:ring-primary/50
                    border border-gray-300 dark:border-[#3b4354]
                    bg-background-light dark:bg-[#101622]
                    focus:border-primary h-12
                    placeholder:text-gray-400 dark:placeholder:text-[#9da6b9]
                    px-4 text-base"
                />
              </div>
            )}

            <div className="flex flex-col">
              <label htmlFor="email" className="text-gray-800 dark:text-white text-sm font-medium pb-2">
                Email
              </label>
              <input
                id="email" type="email" required autoComplete="email"
                placeholder="seu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg text-gray-800 dark:text-white
                  focus:outline-0 focus:ring-2 focus:ring-primary/50
                  border border-gray-300 dark:border-[#3b4354]
                  bg-background-light dark:bg-[#101622]
                  focus:border-primary h-12
                  placeholder:text-gray-400 dark:placeholder:text-[#9da6b9]
                  px-4 text-base"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="password" className="text-gray-800 dark:text-white text-sm font-medium pb-2">
                Senha
              </label>
              <input
                id="password" type="password" required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••" minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg text-gray-800 dark:text-white
                  focus:outline-0 focus:ring-2 focus:ring-primary/50
                  border border-gray-300 dark:border-[#3b4354]
                  bg-background-light dark:bg-[#101622]
                  focus:border-primary h-12
                  placeholder:text-gray-400 dark:placeholder:text-[#9da6b9]
                  px-4 text-base"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                {success}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-lg
                bg-primary px-6 py-3 text-base font-medium text-white shadow-sm
                transition-colors hover:bg-primary/90
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                dark:focus:ring-offset-background-dark
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
              <button type="button" onClick={toggleMode} className="text-primary font-medium hover:underline">
                {mode === 'login' ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}