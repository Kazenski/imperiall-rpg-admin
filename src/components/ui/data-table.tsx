'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Search, CheckCircle2, XCircle, Database } from 'lucide-react'

/** Estado de busca + ordenação para as listagens do admin. */
export function useTable<T>(rows: T[], opts: {
  search: (r: T) => string;
  sort: Record<string, (r: T) => string | number>;
  initial?: string;
}) {
  const [q, setQ] = useState('')
  const [key, setKey] = useState(opts.initial ?? 'name')
  const [dir, setDir] = useState<1 | -1>(1)

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    const out = s ? rows.filter((r) => opts.search(r).toLowerCase().includes(s)) : [...rows]
    const get = opts.sort[key] ?? Object.values(opts.sort)[0]
    out.sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      const c = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'pt-BR')
      return c * dir
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, key, dir])

  const toggle = (k: string) => {
    if (k === key) setDir(dir === 1 ? -1 : 1)
    else { setKey(k); setDir(1) }
  }

  return { q, setQ, sortKey: key, sortDir: dir, toggle, visible }
}

export function SearchBox({ value, onChange, placeholder = 'Pesquisar...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative max-w-xs w-64">
      <Search size={14} className="absolute left-2.5 top-2.5 text-amber-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-700 bg-slate-900 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:border-amber-400"
      />
    </div>
  )
}

/** Cabeçalho clicável que ordena. */
export function Th({ label, k, active, dir, onClick }: {
  label: string; k: string; active: boolean; dir: 1 | -1; onClick: (k: string) => void;
}) {
  return (
    <th
      className="p-2.5 text-left cursor-pointer select-none hover:text-amber-300 transition"
      onClick={() => onClick(k)}
      title="Clique para ordenar"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className={active ? 'text-amber-400' : 'text-slate-400'} />
        {active && <span className="text-[10px] text-amber-300">{dir === 1 ? '▲' : '▼'}</span>}
      </span>
    </th>
  )
}

/** Linha de contadores colorida: total, ativos/inativos e resultado da busca. */
const CHIPS = [
  'px-2.5 py-1 rounded-full inline-flex items-center gap-1 border font-medium',
  'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'bg-purple-500/15 text-purple-300 border-purple-500/30',
]

export function Counters({ total, active, shown, totalLabel = 'registros', items }: {
  total?: number; active?: number; shown?: number; totalLabel?: string;
  items?: Array<{ label: string; value: string | number }>;
}) {
  if (items) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {items.map((it, i) => (
          <span key={it.label} className={CHIPS[i % CHIPS.length]}>
            {it.label}: <b className="text-white">{it.value}</b>
          </span>
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1 font-medium">
        <Database size={11} /> {total} {totalLabel}
      </span>
      {active !== undefined && (
        <>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1 font-medium">
            <CheckCircle2 size={11} /> {active} ativos
          </span>
          {(total ?? 0) - active > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1 font-medium">
              <XCircle size={11} /> {(total ?? 0) - active} inativos
            </span>
          )}
        </>
      )}
      {shown !== undefined && total !== undefined && shown !== total && (
        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
          Filtrados: {shown}
        </span>
      )}
    </div>
  )
}
