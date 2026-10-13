'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Search } from 'lucide-react'

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
    <div className="relative max-w-xs">
      <Search size={14} className="absolute left-2 top-2.5 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded pl-8 pr-2 py-1.5 text-sm"
      />
    </div>
  )
}

/** Cabeçalho clicável que ordena. */
export function Th({ label, k, active, dir, onClick }: {
  label: string; k: string; active: boolean; dir: 1 | -1; onClick: (k: string) => void;
}) {
  return (
    <th className="p-2 text-left cursor-pointer select-none hover:text-primary" onClick={() => onClick(k)} title="Clique para ordenar">
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className={active ? 'text-primary' : 'text-muted-foreground'} />
        {active && <span className="text-[10px]">{dir === 1 ? '▲' : '▼'}</span>}
      </span>
    </th>
  )
}

/** Linha de contadores: total, ativos/inativos e resultado da busca. */
export function Counters({ total, active, shown, totalLabel = 'registros' }: {
  total: number; active?: number; shown?: number; totalLabel?: string;
}) {
  return (
    <p className="text-xs text-muted-foreground">
      {total} {totalLabel} no total
      {active !== undefined && <> • {active} ativos • {total - active} inativos</>}
      {shown !== undefined && shown !== total && <> • mostrando {shown}</>}
    </p>
  )
}
