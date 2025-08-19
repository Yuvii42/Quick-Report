import React from 'react'
import { palettes, categoricalColors } from '../colors'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Bar,
  BarChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'

export default function ChartCard({ title, type, config, palette = 'indigo' }) {
  const theme = palettes[palette] || palettes.indigo
  return (
    <div className="card p-4 overflow-hidden">
      <div
        className="rounded-lg p-3 mb-3 text-white"
        style={{
          background: `linear-gradient(135deg, ${theme.gradientFrom}33, ${theme.gradientTo}33)`
        }}
      >
        <div className="font-medium">{title}</div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(type, config, theme)}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function renderChart(type, cfg, theme) {
  if (!cfg) return null
  switch (type) {
    case 'bar':
      return (
        <BarChart data={cfg.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={cfg.xKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={cfg.yKey} fill={theme.primary} />
        </BarChart>
      )
    case 'pie':
      return (
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie
            data={cfg.data}
            dataKey={cfg.valueKey}
            nameKey={cfg.nameKey}
            label
          >
          </Pie>
          {/* Recharts auto-colors; categories colored by categoricalColors in Dashboard */}
        </PieChart>
      )
    case 'line':
      return (
        <LineChart data={cfg.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={cfg.xKey} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={cfg.yKey} stroke={theme.primary} dot={false} strokeWidth={2} />
        </LineChart>
      )
    case 'scatter':
      return (
        <ScatterChart>
          <CartesianGrid />
          <XAxis dataKey={cfg.xKey} name={cfg.xLabel || 'x'} />
          <YAxis dataKey={cfg.yKey} name={cfg.yLabel || 'y'} />
          <ZAxis range={[60, 60]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={cfg.data} fill={theme.primary} />
        </ScatterChart>
      )
    default:
      return null
  }
}


