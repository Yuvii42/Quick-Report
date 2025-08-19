import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      await signup(email, password)
      localStorage.removeItem('access_token')
      navigate('/login?created=1')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4">
      <div className="relative w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10 bg-white/5">
        {/* Glow Border */}
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur opacity-20"></div>

        <form onSubmit={submit} className="relative z-10 space-y-6">
          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-white">Create an Account</h2>
          <p className="text-sm text-gray-400 text-center">Join us and get started in seconds 🚀</p>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 
            shadow-lg hover:scale-105 transition-transform duration-200"
          >
            Create Account
          </button>

          {/* Login Link */}
          <div className="text-sm text-center text-gray-400">
            Already have an account?{' '}
            <Link className="text-blue-400 hover:underline" to="/login">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
