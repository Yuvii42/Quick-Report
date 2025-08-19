import React, { createContext, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Upload from './pages/Upload'
import Dashboard from './pages/Dashboard'
import Summary from './pages/Summary'
import ExportPage from './pages/Export'
import Login from './pages/Login'
import Signup from './pages/Signup'

export const DatasetContext = createContext({
  dataset: null,
  setDataset: () => {},
})

export default function App() {
  const [dataset, setDataset] = useState(null)
  const value = useMemo(() => ({ dataset, setDataset }), [dataset])

  return (
    <DatasetContext.Provider value={value}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to={localStorage.getItem('access_token') ? '/upload' : '/login'} replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Navigate to="/login?mode=signup" replace />} />
          <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/summary" element={<RequireAuth><Summary /></RequireAuth>} />
          <Route path="/export" element={<RequireAuth><ExportPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </DatasetContext.Provider>
  )
}

function RequireAuth({ children }) {
  const token = localStorage.getItem('access_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}


