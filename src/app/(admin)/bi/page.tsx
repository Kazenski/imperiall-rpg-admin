'use client'

import { useEffect, useMemo, useState } from 'react'
import { countTable, listAnalyticsEvents } from '@/lib/actions/analytics'

// Simple bar without external libs.
function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label}>
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span className="truncate max-w-[70%]">{i.label}</span>
            <span className="font-mono">{i.value}</span>
          </div>
          <div className="h-2 rounded bg-zinc-800 overflow-hidden">
            <div className="h-2 bg-amber-500/80" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-zinc-500">Sem dados no período.</p>}
    </div>
  )
}

export default function BiPage() {
  const [days, setDays] = useState(30)
  const [counts, setCounts] = useState({ profiles: 0, items: 0, skills: 0, stories: 0 })
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const since = new Date(Date.now() - days * 86400000).toISOString()
    setLoading(true)
    Promise.all([
      countTable('profiles').then((n) => setCounts((c) => ({ ...c, profiles: n }))),
      countTable('items').then((n) => setCounts((c) => ({ ...c, items: n }))),
      countTable('skills').then((n) => setCounts((c) => ({ ...c, skills: n }))),
      countTable('stories').then((n) => setCounts((c) => ({ ...c, stories: n }))),
      listAnalyticsEvents(since).then(setEvents).catch(() => setEvents([])),
    ]).finally(() => setLoading(false))
  }, [days])

  const storyStarts = useMemo(() => {
    const m = new Map<string, number>()
    events
      .filter((e) => e.event_type === 'story_started')
      .forEach((e) => {
        const k = e.entity_id || 'desconhecida'
        m.set(k, (m.get(k) || 0) + 1)
      })
    return [...m.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [events])

  const choicePicks = useMemo(() => {
    const m = new Map<string, number>()
    events
      .filter((e) => e.event_type === 'story_choice_selected')
      .forEach((e) => {
        const label = (e.metadata?.choice_label as string) || e.entity_id || 'opção'
        m.set(label, (m.get(label) || 0) + 1)
      })
    return [...m.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [events])

  const activeUsers = useMemo(() => {
    const s = new Set(events.map((e) => e.player_id).filter(Boolean))
    return s.size
  }, [events])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-amber-400">BI • Visão Geral</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border rounded px-2.5 py-1.5 bg-background text-sm"
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>
      </div>

      {loading && <p className="text-sm text-zinc-400">Carregando métricas…</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-xl p-4 bg-zinc-900/60">
          <div className="text-xs text-zinc-400">Usuários (total)</div>
          <div className="text-2xl font-bold text-amber-300">{counts.profiles}</div>
        </div>
        <div className="border rounded-xl p-4 bg-zinc-900/60">
          <div className="text-xs text-zinc-400">Itens</div>
          <div className="text-2xl font-bold text-amber-300">{counts.items}</div>
        </div>
        <div className="border rounded-xl p-4 bg-zinc-900/60">
          <div className="text-xs text-zinc-400">Skills</div>
          <div className="text-2xl font-bold text-amber-300">{counts.skills}</div>
        </div>
        <div className="border rounded-xl p-4 bg-zinc-900/60">
          <div className="text-xs text-zinc-400">Histórias</div>
          <div className="text-2xl font-bold text-amber-300">{counts.stories}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-xl p-4 bg-zinc-900/60">
          <h3 className="text-sm font-semibold text-indigo-300 mb-3">
            Usuários ativos no período (eventos)
            <span className="text-xs text-zinc-500 font-normal ml-2">({activeUsers})</span>
          </h3>
          <BarList items={[{ label: 'Usuários com eventos', value: activeUsers }]} />
        </div>
        <div className="border rounded-xl p-4 bg-zinc-900/60">
          <h3 className="text-sm font-semibold text-indigo-300 mb-3">Histórias mais iniciadas</h3>
          <BarList items={storyStarts} />
        </div>
        <div className="border rounded-xl p-4 bg-zinc-900/60">
          <h3 className="text-sm font-semibold text-indigo-300 mb-3">Opções mais escolhidas (histórias)</h3>
          <BarList items={choicePicks} />
        </div>
        <div className="border rounded-xl p-4 bg-zinc-900/60">
          <h3 className="text-sm font-semibold text-indigo-300 mb-3">Eventos no período</h3>
          <div className="text-3xl font-bold text-amber-300">{events.length}</div>
          <p className="text-xs text-zinc-500 mt-1">
            Tipos: {new Set(events.map((e) => e.event_type)).size}
          </p>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        BI inicial. Eventos vêm de <code>analytics_events</code> (migration 017). Sem a migration/uso no app, os gráficos ficam vazios, mas a estrutura já sobe.
      </p>
    </div>
  )
}