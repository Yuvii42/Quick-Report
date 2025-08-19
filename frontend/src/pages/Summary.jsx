import React, { useContext, useMemo } from 'react'
import { DatasetContext } from '../App'
import KpiCard from '../components/KpiCard'

export default function Summary() {
  const { dataset } = useContext(DatasetContext)
  if (!dataset) {
    return (
      <div className="text-center py-16 text-gray-400 text-lg">
        🚀 Please upload a dataset to see the summary.
      </div>
    )
  }

  const cols = dataset.summary?.columns_meta || []

  // Heuristics to identify business roles
  const roles = useMemo(() => inferRoles(cols), [cols])

  // KPIs: prefer semantically meaningful columns if present
  const totalSales = roles.sales?.sum ?? pickFirstNumeric(cols, 'sum')
  const avgOrderValue = roles.sales && roles.orders ? safeDivide(roles.sales.sum, roles.orders.count) : undefined
  const totalOrders = roles.orders?.count
  const uniqueCustomers = roles.customer?.unique

  return (
    <div className="space-y-10">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Sales" value={totalSales} color="from-emerald-500 to-green-500" />
        <StatCard title="Total Orders" value={totalOrders} color="from-indigo-500 to-blue-500" />
        <StatCard title="Avg Order Value" value={avgOrderValue} color="from-fuchsia-500 to-purple-500" />
        <StatCard title="Unique Customers" value={uniqueCustomers} color="from-amber-500 to-orange-500" />
      </div>

      {/* Columns Table */}
      <div className="rounded-2xl shadow-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">📊 Dataset Columns</h2>
          <p className="text-sm text-gray-400">Detected roles help you choose better charts and KPIs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-300">
            <thead>
              <tr className="bg-white/10 text-gray-200 uppercase tracking-wider text-xs">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Role (suggested)</th>
                <th className="px-4 py-3 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cols.map((c) => (
                <tr
                  key={c.name}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 capitalize">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-white/10">
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300">
                      {roles.byName[c.name] || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{renderDetails(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br ${color} text-white p-6`}>
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
      <div className="relative">
        <div className="text-sm font-medium uppercase tracking-wide opacity-80">{title}</div>
        <div className="mt-2 text-3xl font-bold">{fmt(value)}</div>
      </div>
    </div>
  )
}

function renderDetails(c) {
  if (c.type === 'numeric') {
    return ` mean: ${fmt(c.mean)}, median: ${fmt(c.median)}, min: ${fmt(c.min)}, max: ${fmt(c.max)}`
  }
  if (['categorical', 'boolean', 'text'].includes(c.type)) {
    const top = c.top?.map(t => `${t.value} (${t.count})`).join(', ')
    return `unique: ${c.unique ?? '—'}${top ? `, top: ${top}` : ''}`
  }
  if (c.type === 'datetime') {
    return `min: ${c.min ?? '—'}, max: ${c.max ?? '—'}`
  }
  return ''
}

function fmt(v) {
  if (v === null || v === undefined) return '—'
  return Intl.NumberFormat().format(v)
}

function safeDivide(a, b) {
  if (!a || !b) return undefined
  return a / b
}

function pickFirstNumeric(cols, key = 'sum') {
  const c = cols.find(c => c.type === 'numeric' && c[key] != null)
  return c?.[key]
}

function inferRoles(cols) {
  const byName = {}
  const lc = (s) => s.toLowerCase()
  const findBy = (words, type) => cols.find(c => c.type === type && words.some(w => lc(c.name).includes(w)))

  const salesCol = findBy(['sales', 'amount', 'revenue', 'price', 'total'], 'numeric')
  const orderIdCol = findBy(['order id', 'order_id', 'orderid', 'invoice', 'receipt'], 'text') || findBy(['order', 'invoice'], 'categorical')
  const qtyCol = findBy(['qty', 'quantity', 'units'], 'numeric')
  const dateCol = findBy(['date', 'order date', 'created', 'time'], 'datetime')
  const customerCol = findBy(['customer', 'client', 'buyer', 'account'], 'text') || findBy(['customer', 'client', 'buyer', 'account'], 'categorical')

  const roles = {
    sales: salesCol ? { name: salesCol.name, sum: salesCol.sum } : undefined,
    orders: orderIdCol ? { name: orderIdCol.name, count: undefined } : undefined,
    quantity: qtyCol ? { name: qtyCol.name, sum: qtyCol.sum } : undefined,
    date: dateCol ? { name: dateCol.name } : undefined,
    customer: customerCol ? { name: customerCol.name, unique: undefined } : undefined,
    byName,
  }

  cols.forEach(c => {
    const name = lc(c.name)
    if (roles.sales && c.name === roles.sales.name) byName[c.name] = 'Sales'
    else if (roles.quantity && c.name === roles.quantity.name) byName[c.name] = 'Quantity'
    else if (roles.date && c.name === roles.date.name) byName[c.name] = 'Date'
    else if (roles.customer && c.name === roles.customer.name) byName[c.name] = 'Customer'
    else if (name.includes('id')) byName[c.name] = 'Identifier'
    else if (c.type === 'numeric') byName[c.name] = 'Metric'
    else if (c.type === 'categorical' || c.type === 'boolean') byName[c.name] = 'Category'
    else if (c.type === 'text') byName[c.name] = 'Text'
  })

  // Populate counts/uniques if available
  if (roles.orders) {
    const col = cols.find(c => c.name === roles.orders.name)
    roles.orders.count = col?.count || undefined
  }
  if (roles.customer) {
    const col = cols.find(c => c.name === roles.customer.name)
    roles.customer.unique = col?.unique || undefined
  }

  return roles
}
