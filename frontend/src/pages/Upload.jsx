import React, { useContext, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DatasetContext } from '../App'
import { uploadFile } from '../api'

export default function Upload() {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const { setDataset } = useContext(DatasetContext)
  const navigate = useNavigate()

  async function handleFiles(files) {
    const file = files?.[0]
    if (!file) return
    setError('')
    try {
      const data = await uploadFile(file, (e) => {
        if (e.total) setProgress(Math.round((e.loaded * 100) / e.total))
      })
      setDataset(data)
      navigate('/dashboard')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Upload failed')
    } finally {
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4">
      <div
        className={`relative w-full max-w-2xl p-10 rounded-2xl shadow-2xl backdrop-blur-lg border transition-all duration-300 
        ${dragOver ? 'border-blue-500 bg-white/10' : 'border-white/20 bg-white/5'}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20" />

        {/* Content */}
        <div className="relative z-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Upload your Excel / CSV</h2>
          <p className="text-sm text-gray-400 mb-6">
            Drag & drop your file here or click to browse (.xlsx, .xls, .csv)
          </p>

          {/* File Upload */}
          <div className="flex items-center justify-center gap-3">
            <button
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 
              text-white font-medium shadow-lg hover:scale-105 transition-transform"
              onClick={() => inputRef.current?.click()}
            >
              Choose File
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="mt-8">
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-2">{progress}%</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 px-4 py-2 bg-red-500/20 border border-red-400/40 text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
