import React, { useContext, useRef } from 'react'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { DatasetContext } from '../App'
import { downloadCsvUrl } from '../api'
import { Download, Image, FileDown } from 'lucide-react'

export default function ExportPage() {
  const { dataset } = useContext(DatasetContext)
  const dashboardRef = useRef(null)

  async function exportPNG() {
    if (!dashboardRef.current) return
    const dataUrl = await toPng(dashboardRef.current, { pixelRatio: 2 })
    const link = document.createElement('a')
    link.download = 'dashboard.png'
    link.href = dataUrl
    link.click()
  }

  async function exportPDF() {
    if (!dashboardRef.current) return
    const dataUrl = await toPng(dashboardRef.current, { pixelRatio: 2 })
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight)
    pdf.save('dashboard.pdf')
  }

  if (!dataset) {
    return (
      <div className="text-center text-gray-500 text-sm mt-10 animate-pulse">
        🚀 Please upload a dataset first.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Export Actions */}
      <div className="flex flex-wrap gap-3">
        <a
          href={downloadCsvUrl(dataset.datasetId)}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] transition"
        >
          <Download size={18} /> Download CSV
        </a>
        <button
          onClick={exportPNG}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] transition"
        >
          <Image size={18} /> Export PNG
        </button>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] transition"
        >
          <FileDown size={18} /> Export PDF
        </button>
      </div>

      {/* Dashboard Preview Area */}
      <div
        ref={dashboardRef}
        className="rounded-2xl p-6 bg-white/60 dark:bg-gray-900/70 backdrop-blur-lg border border-gray-200 dark:border-gray-800 shadow-lg transition hover:shadow-2xl"
      >
        <div className="text-gray-500 text-sm flex items-center gap-2">
          📊 This preview will be captured when exporting.
        </div>
        <div className="mt-3">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Dataset: <span className="text-indigo-600 dark:text-indigo-400">{dataset.filename}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Rows: <span className="font-medium">{dataset.rowCount}</span> • Columns:{' '}
            <span className="font-medium">{dataset.columns.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
