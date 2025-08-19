import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function uploadFile(file, onUploadProgress) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
  return data
}

export async function fetchCharts(datasetId) {
  const { data } = await api.get(`/charts/${datasetId}`)
  return data
}

export async function fetchSummary(datasetId) {
  const { data } = await api.get(`/summary/${datasetId}`)
  return data
}

export function downloadCsvUrl(datasetId) {
  return `${baseURL}/download/${datasetId}`
}

export async function fetchCustomChart(datasetId, params) {
  const { data } = await api.get(`/chart-data/${datasetId}`, { params })
  return data
}

export async function signup(email, password) {
  const { data } = await api.post('/auth/signup', { email, password })
  return data
}

export async function login(email, password) {
  const form = new URLSearchParams()
  form.set('grant_type', 'password')
  form.set('username', email)
  form.set('password', password)
  form.set('scope', '')
  form.set('client_id', '')
  form.set('client_secret', '')
  const { data } = await api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}


