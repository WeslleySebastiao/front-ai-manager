import axios from 'axios'

const api = axios.create({
  baseURL: 'https://chatllm-api.vercel.app',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
