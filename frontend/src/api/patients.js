import api from './axios'

export const searchPatients = (query) => api.get(`/patients?query=${encodeURIComponent(query)}`)
export const registerPatient = (data) => api.post('/patients', data)
export const getPatientById = (id) => api.get(`/patients/${id}`)

