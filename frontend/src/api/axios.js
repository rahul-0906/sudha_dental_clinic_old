import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach PIN header on every request
api.interceptors.request.use((config) => {
  const pin = localStorage.getItem('clinicPin')
  if (pin) {
    config.headers['X-Clinic-Pin'] = pin
  }
  return config
})

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred'
    console.error('[API Error]', message, error.config?.url)
    toast.error(message)
    return Promise.reject(error)
  }
)

export default api
