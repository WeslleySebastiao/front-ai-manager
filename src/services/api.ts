import axios from 'axios'
const apiUrl = import.meta.env.VITE_BACK_URL;
console.log("🔍 VITE_API_URL =", import.meta.env.VITE_BACK_URL);
const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default api
