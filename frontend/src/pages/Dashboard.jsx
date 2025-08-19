import React, { useContext, useEffect, useMemo, useState } from 'react'
import { DatasetContext } from '../App'
import ChartCard from '../components/ChartCard'
import { palettes, categoricalColors } from '../colors'
import Heatmap from '../components/Heatmap'
import { fetchCustomChart } from '../api'

export default function Dashboard() {
  const { dataset } = useContext(DatasetContext)
  const [custom, setCustom] = useState({ chart: 'bar', x: '', y: '', agg: 'sum' })
  const [customData, setCustomData] = useState(null)

  const columns = useMemo(() => dataset?.columns || [], [dataset])
  const numericCols = useMemo(() => columns.filter(c => c.type === 'numeric').map(c => c.name), [columns])
  const categoricalCols = useMemo(() => columns.filter(c => ['categorical','boolean','text'].includes(c.type)).map(c => c.name), [columns])
  const datetimeCols = useMemo(() => columns.filter(c => c.type === 'datetime').map(c => c.name), [columns])

  useEffect(() => {
    if (!dataset?.datasetId) return
    if (custom.chart === 'bar' || custom.chart === 'pie') {
      if (!custom.x && categoricalCols.length) setCustom(s => ({ ...s, x: categoricalCols[0] }))
    }
    if (custom.chart === 'line') {
      if (!custom.x && datetimeCols.length) setCustom(s => ({ ...s, x: datetimeCols[0] }))
      if (!custom.y && numericCols.length) setCustom(s => ({ ...s, y: numericCols[0] }))
    }
    if (custom.chart === 'scatter') {
      if (!custom.x && numericCols.length) setCustom(s => ({ ...s, x: numericCols[0] }))
      if (!custom.y && numericCols.length > 1) setCustom(s => ({ ...s, y: numericCols[1] }))
    }
  }, [dataset, custom.chart])

  async function runCustom() {
    if (!dataset?.datasetId) return
    const res = await fetchCustomChart(dataset.datasetId, custom)
    setCustomData(res.data)
  }

  if (!dataset) {
    return (
      <div className="text-center py-20 text-gray-400 text-lg">
        🚀 Please upload a dataset to unlock your dashboard.
      </div>
    )
  }

  const charts = dataset.charts || {}
  const order = [
    { key: 'bar_top_categories', type: 'bar', palette: 'indigo' },
    { key: 'pie_top_categories', type: 'pie', palette: 'amber' },
    { key: 'line_trend', type: 'line', palette: 'emerald' },
    { key: 'scatter_correlation', type: 'scatter', palette: 'rose' },
  ]

  return (
    <div className="space-y-10">
      {/* Section: Prebuilt Charts */}
      <div>
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          📈 Insights Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {order.map(({ key, type, palette }) => {
            const cfg = charts[key]
            if (!cfg) return null
            // For pie/bar category colors, annotate colors array
            if (type === 'pie' || type === 'bar') {
              const n = (cfg.data || []).length
              cfg.colors = categoricalColors(Math.max(6, n))
            }
            const title =
              key === 'bar_top_categories'
                ? `Top ${cfg.column}`
                : key === 'pie_top_categories'
                ? `Distribution of ${cfg.column}`
                : key === 'line_trend'
                ? `Trend (${cfg.xLabel} vs ${cfg.yLabel})`
                : `Scatter (${cfg.xLabel} vs ${cfg.yLabel})`
            return (
              <ChartCard key={key} title={title} type={type} config={cfg} palette={palette} />
            )
          })}
        </div>
      </div>

      {/* Section: Heatmap */}
      <div className="rounded-2xl shadow-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">🔥 Correlation Heatmap</h3>
          <p className="text-sm text-gray-400">Explore relationships between numeric features</p>
        </div>
        <div className="p-4">
          <Heatmap data={charts.heatmap_correlation} />
        </div>
      </div>

      {/* Section: Custom Chart Builder */}
      <div className="rounded-2xl shadow-xl border border-white/10 bg-gradient-to-br from-gray-900/70 to-gray-800/70 backdrop-blur-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">🛠️ Build Your Own Chart</h3>
          <p className="text-sm text-gray-400">Select parameters and generate a custom visualization</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Chart Type">
              <select
                className="w-full border rounded-xl px-3 py-2 bg-gray-900/80 text-white"
                value={custom.chart}
                onChange={(e) => setCustom(s => ({ ...s, chart: e.target.value }))}
              >
                <option value="bar">Bar</option>
                <option value="pie">Pie</option>
                <option value="line">Line</option>
                <option value="scatter">Scatter</option>
                <option value="heatmap">Heatmap</option>
              </select>
            </Field>

            <Field label="X Column">
              <select
                className="w-full border rounded-xl px-3 py-2 bg-gray-900/80 text-white"
                value={custom.x}
                onChange={(e) => setCustom(s => ({ ...s, x: e.target.value }))}
              >
                <option value="">(auto)</option>
                {(custom.chart === 'line' ? datetimeCols : custom.chart === 'scatter' ? numericCols : categoricalCols).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Y Column">
              <select
                className="w-full border rounded-xl px-3 py-2 bg-gray-900/80 text-white"
                value={custom.y}
                onChange={(e) => setCustom(s => ({ ...s, y: e.target.value }))}
              >
                <option value="">(auto)</option>
                {(custom.chart === 'line' ? numericCols : custom.chart === 'scatter' ? numericCols : []).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <div className="flex flex-col gap-2">
              {custom.chart === 'line' && (
                <select
                  className="border rounded-xl px-3 py-2 bg-gray-900/80 text-white"
                  value={custom.agg}
                  onChange={(e) => setCustom(s => ({ ...s, agg: e.target.value }))}
                >
                  <option value="sum">Sum</option>
                  <option value="mean">Average</option>
                  <option value="count">Count</option>
                </select>
              )}
              <button
                className="btn btn-primary w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-semibold py-2 rounded-xl shadow-md transition"
                onClick={runCustom}
              >
                🚀 Generate
              </button>
            </div>
          </div>

          {customData && (
            <div className="mt-6">
              {custom.chart === 'heatmap' ? (
                <Heatmap data={customData} />
              ) : (
                <ChartCard title="Custom Chart" type={custom.chart} config={customData} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-300 block mb-1">{label}</label>
      {children}
    </div>
  )
}
