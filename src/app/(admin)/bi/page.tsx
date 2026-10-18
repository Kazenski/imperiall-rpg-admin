'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  countTableStatus,
  listAnalyticsEvents,
  listProfilesForBi,
  listPlayerCharactersForBi,
  listEquippedInventory,
  listOnlinePlayers,
  listTopPlayersByLevel,
} from '@/lib/actions/analytics'
import { listItems } from '@/lib/actions/items'
import { listSkills } from '@/lib/actions/skills'
import { listStages } from '@/lib/actions/stages'
import { listZones } from '@/lib/actions/zones'
import { listRecipes } from '@/lib/actions/crafting'
import { listStories } from '@/lib/actions/stories'
import { listCharacters } from '@/lib/actions/characters'
import { Tooltip } from '@/components/ui/tooltip'
import {
  HorizontalBars,
  VerticalBars,
  PieChart,
  LineChart,
  ScatterPlot,
  StatCard,
  mean,
  median,
} from '@/components/ui/charts'

type NamedMap = Record<string, string>

const MENU_TABLES: { label: string; table: string }[] = [
  { label: 'Itens', table: 'items' },
  { label: 'Inimigos (Mobs)', table: 'mobs' },
  { label: 'Habilidades', table: 'skills' },
  { label: 'Zonas', table: 'zones' },
  { label: 'Fases (Stages)', table: 'stages' },
  { label: 'Ondas', table: 'waves' },
  { label: 'Loot Tables', table: 'loot_tables' },
  { label: 'NPCs', table: 'npcs' },
  { label: 'Histórias', table: 'stories' },
  { label: 'Efeitos', table: 'effects' },
  { label: 'Heróis (Characters)', table: 'characters' },
  { label: 'Nodes de Árvore', table: 'skill_nodes' },
  { label: 'Constelação Nodes', table: 'constellation_nodes' },
  { label: 'Profissões', table: 'professions' },
  { label: 'Receitas', table: 'recipes' },
  { label: 'Eventos de Comércio', table: 'commerce_events' },
  { label: 'Mercadores', table: 'merchants' },
  { label: 'Lojas', table: 'shops' },
  { label: 'Armas Espirituais', table: 'spirit_weapons' },
  { label: 'Pets (Templates)', table: 'pet_templates' },
  { label: 'Vassalos', table: 'vassals' },
  { label: 'Ações Manuais', table: 'manual_actions' },
  { label: 'Menus Flutuantes', table: 'floating_menus' },
  { label: 'Categorias de Suporte', table: 'support_categories' },
  { label: 'Tickets de Suporte', table: 'support_tickets' },
  { label: 'Game Masters', table: 'game_masters' },
  { label: 'Manutenção', table: 'app_maintenance_windows' },
  { label: 'Changelog', table: 'app_changelog' },
  { label: 'Recursos Naturais', table: 'natural_resources' },
]

export default function BiPage() {
  const [days, setDays] = useState(30)
  const [view, setView] = useState<'overview' | 'cadastros' | 'jogadores' | 'itens' | 'historias' | 'batalhas' | 'crafting'>('overview')
  const [menuFilter, setMenuFilter] = useState('all')
  const [textFilter, setTextFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const [menuStats, setMenuStats] = useState<{ label: string; table: string; total: number; active: number; inactive: number; hasActiveFlag: boolean }[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [itemsMap, setItemsMap] = useState<NamedMap>({})
  const [skillsMap, setSkillsMap] = useState<NamedMap>({})
  const [stagesMap, setStagesMap] = useState<NamedMap>({})
  const [zonesMap, setZonesMap] = useState<NamedMap>({})
  const [recipesMap, setRecipesMap] = useState<NamedMap>({})
  const [storiesMap, setStoriesMap] = useState<NamedMap>({})
  const [charactersMap, setCharactersMap] = useState<NamedMap>({})
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([])
  const [equippedRows, setEquippedRows] = useState<any[]>([])
  const [playerChars, setPlayerChars] = useState<any[]>([])
  const [topPlayers, setTopPlayers] = useState<any[]>([])

  useEffect(() => {
    const since = new Date(Date.now() - days * 86400000).toISOString()
    setLoading(true)
    Promise.all([
      ...MENU_TABLES.map((m) =>
        countTableStatus(m.table)
          .then((s) => ({ ...m, ...s }))
          .catch(() => ({ ...m, total: 0, active: 0, inactive: 0, hasActiveFlag: false }))
      ),
      listProfilesForBi().then(setProfiles).catch(() => setProfiles([])),
      listAnalyticsEvents(since).then(setEvents).catch(() => setEvents([])),
      listItems()
        .then((rows: any[]) => {
          const m: NamedMap = {}
          rows.forEach((r) => { m[String(r.id)] = String(r.name || r.id) })
          setItemsMap(m)
        })
        .catch(() => {}),
      listSkills()
        .then((rows: any[]) => {
          const m: NamedMap = {}
          rows.forEach((r: any) => { m[String(r.id)] = String(r.name || r.id) })
          setSkillsMap(m)
        })
        .catch(() => {}),
      listStages()
        .then((rows: any[]) => {
          const m: NamedMap = {}
          rows.forEach((r) => { m[String(r.id)] = String(r.title || `Etapa #${r.order_index}` || r.id) })
          setStagesMap(m)
        })
        .catch(() => {}),
      listZones()
        .then((rows: any[]) => {
          const m: NamedMap = {}
          rows.forEach((r: any) => { m[String(r.id)] = String(r.name || r.id) })
          setZonesMap(m)
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
      listCharacters()
        .then((rows: any[]) => {
          const m: NamedMap = {}
          rows.forEach((r: any) => { m[String(r.id)] = String(r.name || r.id) })
          setCharactersMap(m)
        })
        .catch(() => {}),
      listOnlinePlayers().then(setOnlinePlayers).catch(() => setOnlinePlayers([])),
      listEquippedInventory().then(setEquippedRows).catch(() => setEquippedRows([])),
      listPlayerCharactersForBi().then(setPlayerChars).catch(() => setPlayerChars([])),
      listTopPlayersByLevel(10).then(setTopPlayers).catch(() => setTopPlayers([])),
    ])
      .then((results) => {
        const stats = results.slice(0, MENU_TABLES.length) as any[]
        setMenuStats(stats)
      })
      .finally(() => setLoading(false))
  }, [days])

  // derived
  const totalAccounts = profiles.length
  const onlineNow = onlinePlayers.filter((p) => p.is_online).length
  const activeAccounts = profiles.filter((p) => !p.banned_until || new Date(p.banned_until) < new Date()).length
  const bannedAccounts = profiles.filter((p) => p.banned_until && new Date(p.banned_until) >= new Date()).length
  const mutedAccounts = profiles.filter((p) => p.muted_until && new Date(p.muted_until) >= new Date()).length

  const activeUsersEvents = useMemo(() => {
    const s = new Set(events.map((e) => e.player_id).filter(Boolean))
    return s.size
  }, [events])

  const storyStarts = useMemo(() => {
    const m = new Map<string, number>()
    events
      .filter((e) => e.event_type === 'story_started')
      .forEach((e) => {
        const id = e.entity_id || 'desconhecida'
        const k = storiesMap[id] || id
        m.set(k, (m.get(k) || 0) + 1)
      })
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  }, [events, storiesMap])

  const choicePicks = useMemo(() => {
    const m = new Map<string, number>()
    events
      .filter((e) => e.event_type === 'story_choice_selected')
      .forEach((e) => {
        const label = (e.metadata?.choice_label as string) || e.entity_id || 'opção'
        m.set(label, (m.get(label) || 0) + 1)
      })
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10)
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
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  }, [events, stagesMap])

  const equippedStats = useMemo(() => {
    const m = new Map<string, number>()
    equippedRows.forEach((r: any) => {
      const id = r.item_id || 'desconhecido'
      const name = r.items?.name || itemsMap[id] || `Item ${id.slice(0, 8)}`
      m.set(name, (m.get(name) || 0) + (Number(r.quantity) || 1))
    })
    // fallback from events
    if (m.size === 0) {
      events
        .filter((e) => e.event_type === 'item_equipped')
        .forEach((e) => {
          const id = e.entity_id || 'desconhecido'
          const label = itemsMap[id] || `Item ${id.slice(0, 8)}`
          m.set(label, (m.get(label) || 0) + 1)
        })
    }
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  }, [equippedRows, events, itemsMap])

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
      .map(([label, value]) => ({ label: `${label} (${success.get(label) || 0} ok)`, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [events, recipesMap])

  const skillLearnedStats = useMemo(() => {
    const m = new Map<string, number>()
    events
      .filter((e) => e.event_type === 'skill_learned')
      .forEach((e) => {
        const id = e.entity_id || 'desconhecido'
        const label = skillsMap[id] || `Skill ${id.slice(0, 8)}`
        m.set(label, (m.get(label) || 0) + 1)
      })
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  }, [events, skillsMap])

  const zoneUnlocks = useMemo(() => {
    const m = new Map<string, number>()
    events
      .filter((e) => e.event_type === 'zone_unlocked')
      .forEach((e) => {
        const id = e.entity_id || 'desconhecido'
        const label = zonesMap[id] || `Zona ${id.slice(0, 8)}`
        m.set(label, (m.get(label) || 0) + 1)
      })
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  }, [events, zonesMap])

  const heroPurchaseStats = useMemo(() => {
    const m = new Map<string, number>()
    playerChars.forEach((r: any) => {
      const id = r.character_id || 'desconhecido'
      const name = r.characters?.name || charactersMap[id] || `Herói ${id.slice(0, 8)}`
      m.set(name, (m.get(name) || 0) + 1)
    })
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10)
  }, [playerChars, charactersMap])

  const storyCompletions = useMemo(() => events.filter((e) => e.event_type === 'story_completed').length, [events])

  const topHero = useMemo(() => {
    if (playerChars.length === 0) return null
    return [...playerChars].sort((a, b) => (b.level || 0) - (a.level || 0))[0]
  }, [playerChars])

  const topLevelPlayer = useMemo(() => {
    if (profiles.length === 0) return null
    return [...profiles].sort((a, b) => (b.level || 0) - (a.level || 0))[0]
  }, [profiles])

  const levels = useMemo(() => profiles.map((p) => Number(p.level) || 0), [profiles])
  const levelMean = mean(levels)
  const levelMedian = median(levels)
  const levelMin = levels.length ? Math.min(...levels) : 0
  const levelMax = levels.length ? Math.max(...levels) : 0

  const accountGrowth = useMemo(() => {
    const m = new Map<string, number>()
    profiles.forEach((p) => {
      const d = new Date(p.created_at)
      if (isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      m.set(key, (m.get(key) || 0) + 1)
    })
    return [...m.entries()]
      .map(([label, value]) => ({ label: label.slice(5), value }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-14)
  }, [profiles])

  const scatterPoints = useMemo(() => {
    return profiles.map((p) => ({ x: Number(p.level) || 0, y: Number(p.gold) || 0, label: p.display_name || p.username }))
  }, [profiles])

  const profileMap = useMemo(() => {
    const m = new Map<string, any>()
    profiles.forEach((p: any) => m.set(String(p.id), p))
    return m
  }, [profiles])

  const totalActive = menuStats.reduce((s, m) => s + m.active, 0)
  const totalInactive = menuStats.reduce((s, m) => s + m.inactive, 0)
  const totalRecords = menuStats.reduce((s, m) => s + m.total, 0)

  const filteredMenuStats = useMemo(() => {
    return menuStats.filter((m) => {
      if (menuFilter !== 'all' && m.table !== menuFilter) return false
      if (textFilter.trim() && !m.label.toLowerCase().includes(textFilter.toLowerCase())) return false
      return true
    })
  }, [menuStats, menuFilter, textFilter])

  const filteredEquipped = useMemo(() => {
    if (!textFilter.trim()) return equippedStats
    return equippedStats.filter((d) => d.label.toLowerCase().includes(textFilter.toLowerCase()))
  }, [equippedStats, textFilter])

  const filteredHeroes = useMemo(() => {
    if (!textFilter.trim()) return heroPurchaseStats
    return heroPurchaseStats.filter((d) => d.label.toLowerCase().includes(textFilter.toLowerCase()))
  }, [heroPurchaseStats, textFilter])

  function exportCsv() {
    const rows: string[][] = []
    rows.push(['KPI', 'Valor'])
    rows.push(['Contas criadas', String(totalAccounts)])
    rows.push(['Contas ativas', String(activeAccounts)])
    rows.push(['Contas banidas', String(bannedAccounts)])
    rows.push(['Jogadores online', String(onlineNow)])
    rows.push(['Usuarios ativos (eventos)', String(activeUsersEvents)])
    rows.push(['Herois comprados', String(playerChars.length)])
    rows.push(['Nivel medio', levelMean.toFixed(2)])
    rows.push(['Nivel mediana', levelMedian.toFixed(2)])
    rows.push(['Nivel min', String(levelMin)])
    rows.push(['Nivel max', String(levelMax)])
    rows.push(['Itens equipados (linhas)', String(equippedRows.length)])
    rows.push(['Historias concluidas', String(storyCompletions)])
    rows.push(['Total cadastros', String(totalRecords)])
    rows.push([])
    rows.push(['Menu', 'Total', 'Ativos', 'Inativos'])
    filteredMenuStats.forEach((m) => rows.push([m.label, String(m.total), String(m.active), String(m.inactive)]))
    rows.push([])
    rows.push(['Item equipado', 'Quantidade'])
    filteredEquipped.forEach((d) => rows.push([d.label, String(d.value)]))
    rows.push([])
    rows.push(['Heroi', 'Quantidade'])
    filteredHeroes.forEach((d) => rows.push([d.label, String(d.value)]))
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bi-dashboard-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeInactivePie = useMemo(
    () => [
      { label: 'Ativos', value: totalActive },
      { label: 'Inativos', value: totalInactive },
    ],
    [totalActive, totalInactive]
  )

  const topMenusByTotal = useMemo(
    () => [...menuStats].sort((a, b) => b.total - a.total).slice(0, 10).map((m) => ({ label: m.label, value: m.total })),
    [menuStats]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-amber-400 flex items-center">
          BI • Visão Geral
          <Tooltip text="Painel de Business Intelligence: métricas de cadastros, jogadores, itens equipados e eventos de uso." />
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={view}
            onChange={(e) => setView(e.target.value as any)}
            className="border rounded px-2.5 py-1.5 bg-background text-sm"
          >
            <option value="overview">Visão geral</option>
            <option value="cadastros">Cadastros</option>
            <option value="jogadores">Jogadores</option>
            <option value="itens">Itens</option>
            <option value="historias">Histórias</option>
            <option value="batalhas">Batalhas / Zonas</option>
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
          <select
            value={menuFilter}
            onChange={(e) => setMenuFilter(e.target.value)}
            className="border rounded px-2.5 py-1.5 bg-background text-sm"
          >
            <option value="all">Todos os menus</option>
            {MENU_TABLES.map((m) => (
              <option key={m.table} value={m.table}>{m.label}</option>
            ))}
          </select>
          <input
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            placeholder="Filtrar entidade..."
            className="border rounded px-2.5 py-1.5 bg-background text-sm"
          />
          <button
            type="button"
            onClick={exportCsv}
            className="border rounded px-2.5 py-1.5 bg-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/30"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-zinc-400">Carregando métricas…</p>}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Contas criadas" value={totalAccounts} tooltip="Total de perfis em profiles." />
        <StatCard title="Contas ativas" value={activeAccounts} tooltip="Contas não banidas (banned_until nulo ou expirado)." />
        <StatCard title="Contas banidas" value={bannedAccounts} tooltip="Contas com banned_until no futuro." />
        <StatCard title="Jogadores online" value={onlineNow} tooltip="Registros em player_online com is_online = true." />
        <StatCard title="Usuários ativos (eventos)" value={activeUsersEvents} tooltip="Jogadores distintos com eventos no período." />
        <StatCard title="Heróis comprados" value={playerChars.length} tooltip="Registros em player_characters (compra/posse de herói)." />
        <StatCard title="Maior nível (jogador)" value={topLevelPlayer ? `${topLevelPlayer.display_name || topLevelPlayer.username} • Lv ${topLevelPlayer.level}` : '—'} tooltip="Jogador com maior level em profiles." />
        <StatCard title="Maior nível (herói)" value={topHero ? `${topHero.characters?.name || 'Herói'} • Lv ${topHero.level}` : '—'} tooltip="Herói com maior level em player_characters." />
        <StatCard title="Itens equipados (linhas)" value={equippedRows.length} tooltip="Linhas em player_inventory com is_equipped = true." />
        <StatCard title="Histórias concluídas" value={storyCompletions} tooltip="Eventos story_completed no período." />
        <StatCard title="Nível médio" value={levelMean.toFixed(1)} tooltip="Média dos níveis dos jogadores." />
        <StatCard title="Nível mediana" value={levelMedian.toFixed(1)} tooltip="Mediana dos níveis dos jogadores." />
        <StatCard title="Nível mín/máx" value={`${levelMin} / ${levelMax}`} tooltip="Menor e maior nível entre jogadores." />
        <StatCard title="Total de cadastros" value={totalRecords} tooltip="Soma de todos os registros das tabelas de catálogo." />
      </div>

      {/* Cadastros ativos vs inativos */}
      {(view === 'overview' || view === 'cadastros') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Ativos vs Inativos (total) <Tooltip text="Soma de todos os cadastros com flag is_active." />
            </h3>
            <PieChart data={activeInactivePie} />
          </div>
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Top tabelas por volume <Tooltip text="As 10 tabelas com mais registros." />
            </h3>
            <VerticalBars data={topMenusByTotal} />
          </div>
          <div className="border rounded-xl p-4 bg-zinc-900/60 md:col-span-2">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Cadastros por menu (ativos / inativos) <Tooltip text="Contagem de registros por tabela, separando ativos e inativos quando a tabela possui is_active." />
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800">
                    <th className="text-left py-2">Menu</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Ativos</th>
                    <th className="text-right py-2">Inativos</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenuStats
                    .slice()
                    .sort((a, b) => b.total - a.total)
                    .map((m) => (
                      <tr key={m.table} className="border-b border-zinc-800/50">
                        <td className="py-1.5 text-zinc-200">{m.label}</td>
                        <td className="py-1.5 text-right font-mono">{m.total}</td>
                        <td className="py-1.5 text-right font-mono text-emerald-300">{m.active}</td>
                        <td className="py-1.5 text-right font-mono text-rose-300">{m.inactive}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Jogadores */}
      {(view === 'overview' || view === 'jogadores') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Contas criadas por dia <Tooltip text="Novos perfis por dia (últimos 14 dias com dados)." />
            </h3>
            <LineChart data={accountGrowth} />
          </div>
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Nível vs Gold (dispersão) <Tooltip text="Cada ponto é um jogador: X = nível, Y = gold." />
            </h3>
            <ScatterPlot points={scatterPoints} />
          </div>
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Jogadores online (lista) <Tooltip text="Últimos registros em player_online." />
            </h3>
            <div className="space-y-1 text-xs max-h-60 overflow-y-auto">
              {onlinePlayers.length === 0 && <p className="text-zinc-500">Nenhum registro.</p>}
              {onlinePlayers.map((p: any, i) => {
                const prof = profileMap.get(String(p.player_id))
                return (
                  <div key={i} className="flex justify-between border-b border-zinc-800/40 py-1">
                    <span className="text-zinc-200 truncate">{prof?.display_name || prof?.username || p.player_id?.slice(0, 8)}</span>
                    <span className={p.is_online ? 'text-emerald-300' : 'text-zinc-500'}>{p.is_online ? 'online' : 'offline'}</span>
                    <span className="text-zinc-500">{p.last_seen_at ? new Date(p.last_seen_at).toLocaleString() : '—'}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Top jogadores por nível <Tooltip text="Os 10 jogadores com maior nível." />
            </h3>
            <HorizontalBars data={topPlayers.map((p: any) => ({ label: p.display_name || p.username || p.id?.slice(0, 8), value: Number(p.level) || 0 }))} color="#3b82f6" />
          </div>
        </div>
      )}

      {/* Itens */}
      {(view === 'overview' || view === 'itens') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Itens mais equipados <Tooltip text="Quantidade de vezes que cada item aparece equipado (player_inventory)." />
            </h3>
            <HorizontalBars data={filteredEquipped} />
          </div>
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Distribuição de itens equipados <Tooltip text="Pizza dos itens mais equipados." />
            </h3>
            <PieChart data={filteredEquipped.slice(0, 8)} />
          </div>
        </div>
      )}

      {/* Heróis comprados */}
      {(view === 'overview' || view === 'jogadores') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Heróis mais comprados/possuídos <Tooltip text="Contagem de player_characters por personagem (config futura de compra)." />
            </h3>
            <HorizontalBars data={filteredHeroes} color="#a855f7" />
          </div>
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center">
              Distribuição de heróis <Tooltip text="Pizza dos heróis mais possuídos." />
            </h3>
            <PieChart data={filteredHeroes.slice(0, 8)} />
          </div>
        </div>
      )}

      {/* Histórias */}
      {(view === 'overview' || view === 'historias') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3">Histórias mais iniciadas</h3>
            <HorizontalBars data={storyStarts} />
          </div>
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3">Opções mais escolhidas</h3>
            <HorizontalBars data={choicePicks} color="#6366f1" />
          </div>
        </div>
      )}

      {/* Batalhas */}
      {(view === 'overview' || view === 'batalhas') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3">Batalhas concluídas por stage</h3>
            <HorizontalBars data={battleStats} color="#22c55e" />
          </div>
          <div className="border rounded-xl p-4 bg-zinc-900/60">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3">Zonas mais desbloqueadas</h3>
            <HorizontalBars data={zoneUnlocks} color="#14b8a6" />
          </div>
        </div>
      )}

      {/* Crafting */}
      {(view === 'overview' || view === 'crafting') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4 bg-zinc-900/60 md:col-span-2">
            <h3 className="text-sm font-semibold text-indigo-300 mb-3">Crafting (totais / sucessos)</h3>
            <HorizontalBars data={craftStats} color="#f97316" />
          </div>
        </div>
      )}

      {/* Skills */}
      {(view === 'overview' || view === 'itens') && (
        <div className="border rounded-xl p-4 bg-zinc-900/60">
          <h3 className="text-sm font-semibold text-indigo-300 mb-3">Skills mais aprendidas</h3>
          <HorizontalBars data={skillLearnedStats} color="#0ea5e9" />
        </div>
      )}

      <div className="border rounded-xl p-4 bg-zinc-900/60">
        <h3 className="text-sm font-semibold text-indigo-300 mb-3">Eventos no período</h3>
        <div className="text-3xl font-bold text-amber-300">{events.length}</div>
        <p className="text-xs text-zinc-500 mt-1">Tipos distintos: {new Set(events.map((e) => e.event_type)).size}</p>
      </div>

      <p className="text-xs text-zinc-500">
        BI em evolução. Eventos vêm de <code>analytics_events</code> (migration 017). Sem migration/uso real, os rankings ficam vazios, mas a estrutura e os contadores continuam funcionando.
      </p>
    </div>
  )
}