'use client'

import { useEffect, useMemo, useState } from 'react'
import { countTable, listAnalyticsEvents } from '@/lib/actions/analytics'
import { listItems } from '@/lib/actions/items'
import { listStages } from '@/lib/actions/stages'
import { listRecipes } from '@/lib/actions/crafting'
import { listStories } from '@/lib/actions/stories'

function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label}>
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span className="truncate max-w-[75%]">{i.label}</span>
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

type NamedMap = Record<string, string>

export default function BiPage() {
  const [days, setDays] = useState(30)
  const [view, setView] = useState<'overview' | 'stories' | 'items' | 'battles' | 'crafting'>('overview')
  const [counts, setCounts] = useState({ profiles: 0, items: 0, skills: 0, stories: 0 })
  const [events, setEvents] = useState<any[]>([])
  const [itemsMap, setItemsMap] = useState<NamedMap>({})
  const [stagesMap, setStagesMap] = useState<NamedMap>({})
  const [recipesMap, setRecipesMap] = useState<NamedMap>({})
  const [storiesMap, setStoriesMap] = useState<NamedMap>({})
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
      listItems()
        .then((rows: any[]) => {
          const m: NamedMap = {}
          rows.forEach((r) => { m[String(r.id)] = String(r.name || r.id) })
          setItemsMap(m)
        })
        .catch(() => {}),
      listStages()
        .then((rows: any[]) => {
          const m: NamedMap = {}
          rows.forEach((r) => { m[String(r.id)] = String(r.title || `Etapa #${r.order_index}` || r.id) })
          setStagesMap(m)
        })
        .catch(() => {}),
      listRecipes()
        .then((rows: any[]) => {
          const m: NamedMap = {}
          rows.forEach((r: any) => {
            const name = r.name || r.items?.name || r.id
            m[String(r.id)] = String(name)
          })
          setRecipesMap(m)
        })
        .catch(() => {}),
      listStories()
        .then((rows: any[]) => {
          const m: NamedMap = {}
          rows.forEach((r: any) => { m[String(r.id)] = String(r.name || r.id) })
          setStoriesMap(m)
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [days])

  const storyStarts = useMemo(() => {
    const m = new Map<string, number>()
    events
      .filter((e) => e.event_type === 'story_started')
      .forEach((e) => {
        const id = e.entity_id || 'desconhecida'
        const k = storiesMap[id] || id
        m.set(k, (m.get(k) || 0) + 1)
      })
    return [...m.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [events, storiesMap])

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

  const battleStats = useMemo(() => {
    const m = new Map<string, number>()
    events
      .filter((e) => e.event_type === 'battle_completed')
      .forEach((e) => {
        const id = e.entity_id || 'desconhecido'
        const label = stagesMap[id] || `Stage ${id.slice(0, 8)}`
        m.set(label, (m.get(label) || 0) + 1)
      })
    return [...m.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [events, stagesMap])

  const equippedStats = useMemo(() => {
    const m = new Map<string, number>()
    events
      .filter((e) => e.event_type === 'item_equipped')
      .forEach((e) => {
        const id = e.entity_id || 'desconhecido'
        const label = itemsMap[id] || `Item ${id.slice(0, 8)}`
        m.set(label, (m.get(label) || 0) + 1)
      })
    return [...m.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [events, itemsMap])

  const craftStats = useMemo(() => {
    const total = new Map<string, number>()
    const success = new Map<string, number>()
    events
      .filter((e) => e.event_type === 'craft_attempt')
      .forEach((e) => {
        const id = e.entity_id || 'desconhecido'
        const label = recipesMap[id] || `Receita ${id.slice(0, 8)}`
        total.set(label, (total.get(label) || 0) + 1)
        if (e.metadata?.succeeded === true) {
          success.set(label, (success.get(label) || 0) + 1)
        }
      })
    return [...total.entries()]
      .map(([label, value]) => ({
        label: `${label} (${success.get(label) || 0} ok)`,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [events, recipesMap])

  const activeUsers = useMemo(() => {
    const s = new Set(events.map((e) => e.player_id).filter(Boolean))
    return s.size
  }, [events])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-amber-400">BI • Visão Geral</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={view}
            onChange={(e) => setView(e.target.value as any)}
            className="border rounded px-2.5 py-1.5 bg-background text-sm"
          >
            <option value="overview">Visão geral</option>
            <option value="stories">Histórias</option>
            <option value="items">Itens</option>
            <option value="battles">Batalhas / Zonas</option>
            <option value="crafting">Crafting</option>
          </select>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded px-2.5 py-1.5 bg-background text-sm"
          >
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
        </div>
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
        {(view === 'overview' || view === 'stories') && (
          <>
            <div className="border rounded-xl p-4 bg-zinc-900/60">
              <h3 className="text-sm font-semibold text-indigo-300 mb-3">Usuários ativos (eventos) • {activeUsers}</h3>
            </div>
            <div className="border rounded-xl p-4 bg-zinc-900/60">
              <h3 className="text-sm font-semibold text-indigo-300 mb-3">Histórias mais iniciadas</h3>
              <BarList items={storyStarts} />
            </div>
            <div className="border rounded-xl p-4 bg-zinc-900/60">
              <h3 className="text-sm font-semibold text-indigo-300 mb-3">Opções mais escolhidas (histórias)</h3>
              <BarList items={choicePicks} />
            </div>
          </>
        )}
        {(view === 'overview' || view === 'items') && (
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3">Itens mais equipados</h3>
            <BarList items={equippedStats} />
          </div>
        )}
        {(view === 'overview' || view === 'battles') && (
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3">Batalhas concluídas por zona/stage</h3>
            <BarList items={battleStats} />
          </div>
        )}
        {(view === 'overview' || view === 'crafting') && (
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3">Crafting (totais / sucessos)</h3>
            <BarList items={craftStats} />
          </div>
        )}
        <div className="border rounded-xl p-4 bg-zinc-900/60">
          <h3 className="text-sm font-semibold text-indigo-300 mb-3">Eventos no período</h3>
          <div className="text-3xl font-bold text-amber-300">{events.length}</div>
          <p className="text-xs text-zinc-500 mt-1">Tipos distintos: {new Set(events.map((e) => e.event_type)).size}</p>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        BI em evolução. Eventos vêm de <code>analytics_events</code> (migration 017). Sem migration/uso real, os rankings ficam vazios, mas a estrutura e os contadores continuam funcionando.
      </p>
    </div>
  )
}