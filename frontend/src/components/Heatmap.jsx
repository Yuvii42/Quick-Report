import React from 'react'

export default function Heatmap({ data }) {
  if (!data || !data.columns || !data.matrix || data.matrix.length === 0) {
    return <div className="text-sm text-gray-500">Not enough numeric columns for correlation heatmap.</div>
  }

  const cols = data.columns
  const matrix = data.matrix
  const n = cols.length

  const maxAbs = matrix.reduce((m, row) => Math.max(m, ...row.map(v => Math.abs(v))), 0.0001)

  return (
    <div className="overflow-auto">
      <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1"><Swatch color="rgba(16,185,129,0.7)" /> positive</span>
        <span className="inline-flex items-center gap-1"><Swatch color="rgba(239,68,68,0.7)" /> negative</span>
      </div>
      <table className="text-sm border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left sticky left-0 bg-white dark:bg-gray-800 z-10"> </th>
            {cols.map((c) => (
              <th key={c} className="p-2 text-left">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={cols[i]}>
              <th className="p-2 text-left sticky left-0 bg-white dark:bg-gray-800 z-10">{cols[i]}</th>
              {row.map((v, j) => (
                <td key={j} className="w-12 h-12 text-center align-middle">
                  <Cell value={v} maxAbs={maxAbs} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Cell({ value, maxAbs }) {
  const ratio = Math.min(1, Math.abs(value) / maxAbs)
  const color = value >= 0 ? `rgba(16,185,129,${ratio})` : `rgba(239,68,68,${ratio})`
  return (
    <div className="w-12 h-12 flex items-center justify-center rounded" style={{ backgroundColor: color }}>
      <span className="text-[10px] font-medium">{value.toFixed(2)}</span>
    </div>
  )
}

function Swatch({ color }) {
  return <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: color }} />
}


