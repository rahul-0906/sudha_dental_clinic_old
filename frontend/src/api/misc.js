import api from './axios'

export const getTransactions = (startDate, endDate) =>
  api.get(`/transactions?startDate=${startDate}&endDate=${endDate}`)
export const addExpense = (data) => api.post('/transactions', data)
export const getDailyReport = (date) => api.get(`/reports/daily?date=${date}`)
export const uploadXray = (formData) =>
  api.post('/xrays/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getPatientXrays = (patientId) => api.get(`/xrays/patient/${patientId}`)
export const getXrayFileUrl = (fileName) => `/api/xrays/files/${fileName}`
export const deleteXray = (id) => api.delete(`/xrays/${id}`)
export const verifyPin = (pin) => api.post('/auth/verify-pin', { pin })
