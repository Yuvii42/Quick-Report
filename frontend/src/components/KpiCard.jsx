import React from 'react'

export default function KpiCard({ title, value, suffix }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{formatValue(value)}{suffix ? ` ${suffix}` : ''}</div>
    </div>
  )
}

function formatValue(val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'number') return Intl.NumberFormat().format(val)
  return String(val)
}


