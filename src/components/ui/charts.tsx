'use client'

import { useMemo } from 'react'

const COLORS = ['#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#eab308', '#6366f1', '#84cc16']

export type ChartDatum = { label: string; value: number }

export function HorizontalBars({ data, color = '#f59e0b' }: { data: ChartDatum[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span className="truncate max-w-[75%]">{d.label}</span>
            <span className="font-mono">{d.value}</span>
          </div>
          <div className="h-2 rounded bg-zinc-800 overflow-hidden">
            <div className="h-2" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-xs text-zinc-500">Sem dados no período.</p>}
    </div>
  )
}

export function VerticalBars({ data, height = 220 }: { data: ChartDatum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const width = Math.max(240, data.length * 44)
  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="block">
        {data.map((d, i) => {
          const barH = (d.value / max) * (height - 40)
          const x = i * (width / Math.max(1, data.length)) + 6
          const w = width / Math.max(1, data.length) - 12
          return (
            <g key={d.label}>
              <rect x={x} y={height - 24 - barH} width={Math.max(4, w)} height={barH} fill={COLORS[i % COLORS.length]} rx={3} />
              <text x={x + w / 2} y={height - 8} textAnchor="middle" fontSize={9} fill="#a1a1aa" className="truncate">
                {d.label.length > 8 ? d.label.slice(0, 8) + '…' : d.label}
              </text>
              <text x={x + w / 2} y={height - 28 - barH} textAnchor="middle" fontSize={9} fill="#fbbf24">
                {d.value}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function PieChart({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = 70
  const cx = 90
  const cy = 90
  const fracs = data.map((d) => d.value / total)
  const accs = fracs.reduce<number[]>((arr, f) => {
    const prev = arr.length ? arr[arr.length - 1] : 0
    arr.push(prev + f)
    return arr
  }, [])
  const slices = data.map((d, i) => {
    const frac = fracs[i]
    const start = i === 0 ? 0 : accs[i - 1]
    const end = accs[i]
    const a0 = start * Math.PI * 2 - Math.PI / 2
    const a1 = end * Math.PI * 2 - Math.PI / 2
    const x0 = cx + r * Math.cos(a0)
    const y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    const large = frac > 0.5 ? 1 : 0
    const path = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
    return { ...d, path, color: COLORS[i % COLORS.length], pct: Math.round(frac * 100) }
  })
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg width={180} height={180}>
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color} stroke="#18181b" strokeWidth={1} />
        ))}
      </svg>
      <div className="space-y-1 text-xs">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
            <span className="text-zinc-300 truncate max-w-[140px]">{s.label}</span>
            <span className="font-mono text-amber-300">{s.value}</span>
            <span className="text-zinc-500">({s.pct}%)</span>
          </div>
        ))}
        {data.length === 0 && <p className="text-xs text-zinc-500">Sem dados.</p>}
      </div>
    </div>
  )
}

export function LineChart({ data, height = 200 }: { data: ChartDatum[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const w = Math.max(260, data.length * 26)
  const pts = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * (w - 20) + 10
    const y = height - 20 - (d.value / max) * (height - 40)
    return `${x},${y}`
  })
  return (
    <div className="overflow-x-auto">
      <svg width={w} height={height}>
        <polyline points={pts.join(' ')} fill="none" stroke="#f59e0b" strokeWidth={2} />
        {data.map((d, i) => {
          const x = (i / Math.max(1, data.length - 1)) * (w - 20) + 10
          const y = height - 20 - (d.value / max) * (height - 40)
          return <circle key={i} cx={x} cy={y} r={3} fill="#fbbf24" />
        })}
        {data.map((d, i) => {
          const x = (i / Math.max(1, data.length - 1)) * (w - 20) + 10
          return (
            <text key={`l${i}`} x={x} y={height - 4} textAnchor="middle" fontSize={8} fill="#a1a1aa">
              {d.label.length > 6 ? d.label.slice(0, 6) : d.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export function ScatterPlot({ points, height = 220 }: { points: { x: number; y: number; label?: string }[]; height?: number }) {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs, 0)
  const maxX = Math.max(...xs, 1)
  const minY = Math.min(...ys, 0)
  const maxY = Math.max(...ys, 1)
  const w = 320
  const pad = 24
  return (
    <svg width={w} height={height}>
      <line x1={pad} y1={height - pad} x2={w - pad} y2={height - pad} stroke="#3f3f46" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#3f3f46" />
      {points.map((p, i) => {
        const x = pad + ((p.x - minX) / Math.max(1, maxX - minX)) * (w - pad * 2)
        const y = height - pad - ((p.y - minY) / Math.max(1, maxY - minY)) * (height - pad * 2)
        return <circle key={i} cx={x} cy={y} r={4} fill="#f59e0b" opacity={0.75} />
      })}
      <text x={w / 2} y={height - 4} textAnchor="middle" fontSize={9} fill="#a1a1aa">X</text>
      <text x={8} y={height / 2} textAnchor="middle" fontSize={9} fill="#a1a1aa" transform={`rotate(-90 8 ${height / 2})`}>Y</text>
    </svg>
  )
}

export function StatCard({ title, value, hint, tooltip }: { title: string; value: string | number; hint?: string; tooltip?: string }) {
  return (
    <div className="border rounded-xl p-4 bg-zinc-900/60">
      <div className="text-xs text-zinc-400 flex items-center">
        {title}
        {tooltip && <span className="ml-1 text-zinc-500" title={tooltip}>?</span>}
      </div>
      <div className="text-2xl font-bold text-amber-300">{value}</div>
      {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </div>
  )
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, n) => s + n, 0) / arr.length
}

export function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const s = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}