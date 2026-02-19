import axios from 'axios'
import { supabase } from '../lib/supabase'

const apiUrl = import.meta.env.VITE_BACK_URL

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ──────────────────────────────────────────────
// ✅ Interceptor: injeta o token JWT do Supabase
// em toda requisição ao backend.
//
// O backend (FastAPI) vai ler esse header e validar
// o JWT usando o JWT secret do Supabase.
// ──────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (err) {
    console.error('Erro ao obter token da sessão:', err)
  }

  return config
})

// ──────────────────────────────────────────────
// ✅ Interceptor de resposta: se o backend retorna 401,
// faz logout e redireciona para login.
// ──────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut()
      // O AuthProvider vai detectar o signOut e o ProtectedRoute
      // redireciona para /login automaticamente
    }
    return Promise.reject(error)
  }
)

export default api