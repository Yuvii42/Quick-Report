import React from 'react'
import { NavLink } from 'react-router-dom'
import DarkModeToggle from './DarkModeToggle'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] grid-rows-[auto_1fr]">
      <aside className="row-span-2 border-r border-gray-200 dark:border-gray-800 p-4">
        <div className="text-xl font-semibold mb-6">Excel Insights</div>
        <nav className="flex flex-col gap-1">
          <NavLink to="/upload" className={({ isActive }) => navCls(isActive)}>
            Upload
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => navCls(isActive)}>
            Charts
          </NavLink>
          <NavLink to="/summary" className={({ isActive }) => navCls(isActive)}>
            Summary
          </NavLink>
          <NavLink to="/export" className={({ isActive }) => navCls(isActive)}>
            Export
          </NavLink>
        </nav>
      </aside>
      <header className="border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 py-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">Upload. Analyze. Decide.</div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={() => { localStorage.removeItem('access_token'); window.location.href = '/login' }}>Logout</button>
          <DarkModeToggle />
        </div>
      </header>
      <main className="p-6 bg-gray-50 dark:bg-gray-900">{children}</main>
    </div>
  )
}

function navCls(isActive) {
  return (
    'px-3 py-2 rounded-lg text-sm ' +
    (isActive
      ? 'bg-blue-600 text-white'
      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200')
  )
}


