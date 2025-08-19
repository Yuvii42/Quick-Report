import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login, signup } from '../api'
import { DatasetContext } from '../App'

export default function Login() {
  const location = useLocation()
  const search = useMemo(() => new URLSearchParams(location.search), [location.search])
  const initialMode = search.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setDataset } = useContext(DatasetContext)

  // Keep mode in sync with URL (e.g., /login?mode=signup)
  useEffect(() => {
    const m = search.get('mode') === 'signup' ? 'signup' : 'login'
    setMode(m)
    if (m === 'login' && search.get('created') === '1') {
      setMessage('Account created. Please log in.')
    }
  }, [location.search])

  async function submitLogin(e) {
    e.preventDefault()
    setError(''); setMessage('')
    try {
      const res = await login(email, password)
      localStorage.setItem('access_token', res.access_token)
      setDataset(null)
      navigate('/upload')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed')
    }
  }

  async function submitSignup(e) {
    e.preventDefault()
    setError(''); setMessage('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    try {
      const res = await signup(email, password)
      if (res?.access_token) {
        localStorage.setItem('access_token', res.access_token)
        setDataset(null)
        navigate('/upload')
        return
      }
      // Fallback: show message if token not returned
      setPassword(''); setConfirm('')
      setMode('login')
      setMessage('Account created. Please log in.')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Signup failed')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-6">
        <div className="flex gap-2 mb-4">
          <button className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMode('login'); setError(''); setMessage('') }}>Login</button>
          <button className={`btn ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Sign up</button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={submitLogin} className="space-y-4">
            <div className="text-xl font-semibold">Login</div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900" value={password} onChange={e => setPassword(e.target.value)} type="password" required />
            </div>
            {message && <div className="text-sm text-green-600">{message}</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button className="btn btn-primary w-full" type="submit">Login</button>
          </form>
        ) : (
          <form onSubmit={submitSignup} className="space-y-4">
            <div className="text-xl font-semibold">Create your account</div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900" value={password} onChange={e => setPassword(e.target.value)} type="password" required />
            </div>
            <div>
              <label className="block text-sm mb-1">Confirm Password</label>
              <input className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900" value={confirm} onChange={e => setConfirm(e.target.value)} type="password" required />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <button className="btn btn-primary w-full" type="submit">Sign up</button>
          </form>
        )}
      </div>
    </div>
  )
}


