'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import {
  listConstellationNodes,
  createConstellationNode,
  updateConstellationNode,
  deleteConstellationNode,
  toggleConstellationConnection,
  setConstellationConfigForCharacter,
} from '@/lib/actions/constellations'
import { listCharacters } from '@/lib/actions/characters'
import { listItems } from '@/lib/actions/items'
import { listStories } from '@/lib/actions/stories'
import { listZones } from '@/lib/actions/zones'
import { Tooltip } from '@/components/ui/tooltip'
import {
  Star, Plus, Trash2, Link2, AlertTriangle, Sparkles, Lock,
  ZoomIn, ZoomOut, Check, Gem, ShieldAlert, Move,
} from 'lucide-react'

const BONUS_FIELDS: {
  key: string
  label: string
  unit: string
  color: string
  safeNodeMax: number
  safeTotalMax: number
  hint: string
}[] = [
  { key: 'hp', label: 'HP Fixo', unit: '', color: 'text-emerald-300 border-emerald-500/40', safeNodeMax: 50, safeTotalMax: 400, hint: 'Recomendado por nó: +10 a +40 HP' },
  { key: 'mp', label: 'MP Fixo (Magia)', unit: '', color: 'text-sky-300 border-sky-500/40', safeNodeMax: 30, safeTotalMax: 250, hint: 'Recomendado por nó: +5 a +25 MP' },
  { key: 'atk', label: 'ATK Fixo', unit: '', color: 'text-rose-300 border-rose-500/40', safeNodeMax: 12, safeTotalMax: 80, hint: 'Recomendado por nó: +2 a +8 ATK' },
  { key: 'def', label: 'DEF Fixo', unit: '', color: 'text-amber-300 border-amber-500/40', safeNodeMax: 10, safeTotalMax: 60, hint: 'Recomendado por nó: +1 a +6 DEF' },
  { key: 'speed', label: 'Velocidade', unit: '', color: 'text-cyan-300 border-cyan-500/40', safeNodeMax: 8, safeTotalMax: 35, hint: 'Recomendado por nó: +1 a +5 VEL' },
  { key: 'hp_pct', label: 'HP %', unit: '%', color: 'text-emerald-400 border-emerald-500/40', safeNodeMax: 5, safeTotalMax: 30, hint: 'Recomendado em nós notáveis: +2% a +5%' },
  { key: 'mp_pct', label: 'MP %', unit: '%', color: 'text-sky-400 border-sky-500/40', safeNodeMax: 5, safeTotalMax: 30, hint: 'Recomendado em nós notáveis: +2% a +5%' },
  { key: 'atk_pct', label: 'ATK %', unit: '%', color: 'text-rose-400 border-rose-500/40', safeNodeMax: 5, safeTotalMax: 25, hint: 'Cuidado: +2% a +4% por nó notável' },
  { key: 'def_pct', label: 'DEF %', unit: '%', color: 'text-amber-400 border-amber-500/40', safeNodeMax: 5, safeTotalMax: 25, hint: 'Recomendado: +2% a +4% por nó notável' },
  { key: 'crit', label: 'Chance Crítico %', unit: '%', color: 'text-fuchsia-300 border-fuchsia-500/40', safeNodeMax: 4, safeTotalMax: 20, hint: 'Recomendado: +1% a +3% (evite passar de 20% total)' },
  { key: 'crit_dmg', label: 'Dano Crítico %', unit: '%', color: 'text-purple-300 border-purple-500/40', safeNodeMax: 10, safeTotalMax: 50, hint: 'Soma ao multiplicador crítico base (150%)' },
  { key: 'gold_pct', label: 'Bônus Ouro %', unit: '%', color: 'text-yellow-300 border-yellow-500/40', safeNodeMax: 5, safeTotalMax: 30, hint: 'Ouro extra ao vencer fases' },
  { key: 'xp_pct', label: 'Bônus XP %', unit: '%', color: 'text-indigo-300 border-indigo-500/40', safeNodeMax: 5, safeTotalMax: 30, hint: 'XP extra ao vencer fases' },
  { key: 'craft_pct', label: 'Chance Oficina %', unit: '%', color: 'text-teal-300 border-teal-500/40', safeNodeMax: 3, safeTotalMax: 15, hint: 'Soma na chance final de Craft/Upgrade na Oficina' },
]

const NODE_COLORS = [
  { value: '#0ea5e9', label: 'Azul Celeste (Padrão)' },
  { value: '#22c55e', label: 'Verde Esmeralda (Origem / Vida)' },
  { value: '#f59e0b', label: 'Dourado Solar (Notável)' },
  { value: '#a855f7', label: 'Roxo Arcano (Magia / MP)' },
  { value: '#ef4444', label: 'Rubi Carmesim (Poder / Crítico)' },
]

export default function ConstelacoesPage() {
  const [chars, setChars] = useState<any[]>([])
  const [charId, setCharId] = useState<string>('')
  const [nodes, setNodes] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [connectMode, setConnectMode] = useState(false)
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [orbItemId, setOrbItemId] = useState<string>('')
  const [resetItemId, setResetItemId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const canvasRef = useRef<HTMLDivElement | null>(null)

  const [nodeForm, setNodeForm] = useState<{
    title: string
    x: number
    y: number
    cost_orbs: number
    is_start: boolean
    color: string
    required_level: number
    required_story_id: string
    required_zone_id: string
    bonuses: Record<string, number>
  }>({
    title: 'Estrela',
    x: 50,
    y: 50,
    cost_orbs: 1,
    is_start: false,
    color: '#0ea5e9',
    required_level: 1,
    required_story_id: '',
    required_zone_id: '',
    bonuses: {},
  })

  useEffect(() => {
    listCharacters()
      .then((cs) => {
        setChars(cs)
        if (cs.length > 0) selectCharacter(cs[0].id)
      })
      .catch(() => {})
    listItems().then(setItems).catch(() => {})
    listStories().then(setStories).catch(() => {})
    listZones().then(setZones).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadNodes = async (cid: string, keepId?: string | null) => {
    try {
      const list = await listConstellationNodes(cid)
      setNodes(list)
      if (list.length > 0) {
        setOrbItemId(list[0].orb_item_id || '')
        setResetItemId(list[0].reset_item_id || '')
      }
      const target =
        (keepId && list.find((n: any) => n.id === keepId)) || list[0] || null
      if (target) {
        pickNode(target)
      } else {
        setSelectedNodeId(null)
      }
    } catch {
      setNodes([])
    }
  }

  const selectCharacter = (cid: string) => {
    setCharId(cid)
    setSelectedNodeId(null)
    setConnectSourceId(null)
    loadNodes(cid)
  }

  const pickNode = (n: any) => {
    setSelectedNodeId(n.id)
    setNodeForm({
      title: n.title || 'Estrela',
      x: Number(n.x ?? 50),
      y: Number(n.y ?? 50),
      cost_orbs: Number(n.cost_orbs ?? 1),
      is_start: Boolean(n.is_start),
      color: n.color || '#0ea5e9',
      required_level: Number(n.required_level ?? 1),
      required_story_id: n.required_story_id || '',
      required_zone_id: n.required_zone_id || '',
      bonuses: typeof n.bonuses === 'object' && n.bonuses ? { ...n.bonuses } : {},
    })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!charId || connectMode || draggingId) return
    if ((e.target as HTMLElement).closest('[data-node-id]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10

    startTransition(async () => {
      try {
        const isFirst = nodes.length === 0
        const created = await createConstellationNode({
          character_id: charId,
          title: isFirst ? 'Estrela de Origem' : `Estrela #${nodes.length + 1}`,
          x,
          y,
          cost_orbs: isFirst ? 1 : 2,
          orb_item_id: orbItemId || null,
          reset_item_id: resetItemId || null,
          is_start: isFirst,
          color: isFirst ? '#22c55e' : '#0ea5e9',
          required_level: 1,
          bonuses: isFirst ? { hp: 15, mp: 10 } : { atk: 3 },
          connections: selectedNodeId ? [selectedNodeId] : [],
          sort_order: nodes.length,
        })
        if (selectedNodeId && created?.id) {
          await toggleConstellationConnection(selectedNodeId, created.id)
        }
        await loadNodes(charId, created?.id)
      } catch (err: any) {
        alert(
          'Falha ao criar estrela: ' +
            (err?.message || err) +
            '\nCertifique-se de rodar a migration 015 no banco.',
        )
      }
    })
  }

  const handleNodeClick = (e: React.MouseEvent, node: any) => {
    e.stopPropagation()
    if (connectMode) {
      if (!connectSourceId) {
        setConnectSourceId(node.id)
        return
      }
      if (connectSourceId === node.id) {
        setConnectSourceId(null)
        return
      }
      const src = connectSourceId
      setConnectSourceId(null)
      startTransition(async () => {
        await toggleConstellationConnection(src, node.id)
        await loadNodes(charId, node.id)
      })
      return
    }
    pickNode(node)
  }

  const handleMouseMoveCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingId || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.min(96, Math.max(4, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10))
    const y = Math.min(96, Math.max(4, Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10))
    setNodes((prev) =>
      prev.map((n) => (n.id === draggingId ? { ...n, x, y } : n)),
    )
    if (selectedNodeId === draggingId) {
      setNodeForm((f) => ({ ...f, x, y }))
    }
  }

  const handleMouseUpCanvas = () => {
    if (!draggingId) return
    const moved = nodes.find((n) => n.id === draggingId)
    const id = draggingId
    setDraggingId(null)
    if (moved) {
      startTransition(async () => {
        await updateConstellationNode(id, { x: Number(moved.x), y: Number(moved.y) })
      })
    }
  }

  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNodeId) return
    const cleanBonuses: Record<string, number> = {}
    for (const [k, v] of Object.entries(nodeForm.bonuses)) {
      const num = Number(v)
      if (num && num !== 0) cleanBonuses[k] = num
    }
    startTransition(async () => {
      await updateConstellationNode(selectedNodeId, {
        title: nodeForm.title,
        x: nodeForm.x,
        y: nodeForm.y,
        cost_orbs: nodeForm.cost_orbs,
        orb_item_id: orbItemId || null,
        reset_item_id: resetItemId || null,
        is_start: nodeForm.is_start,
        color: nodeForm.color,
        required_level: nodeForm.required_level,
        required_story_id: nodeForm.required_story_id || null,
        required_zone_id: nodeForm.required_zone_id || null,
        bonuses: cleanBonuses,
      })
      await loadNodes(charId, selectedNodeId)
    })
  }

  // Soma total de todos os bônus da constelação do herói (para alerta de balanceamento)
  const totalBonuses: Record<string, number> = {}
  let totalOrbsCost = 0
  for (const n of nodes) {
    totalOrbsCost += Number(n.cost_orbs ?? 1)
    if (n.bonuses && typeof n.bonuses === 'object') {
      for (const [k, v] of Object.entries(n.bonuses)) {
        const num = Number(v) || 0
        if (num !== 0) {
          totalBonuses[k] = (totalBonuses[k] || 0) + num
        }
      }
    }
  }

  const warnings: string[] = []
  for (const bf of BONUS_FIELDS) {
    const sum = totalBonuses[bf.key] || 0
    if (sum > bf.safeTotalMax) {
      warnings.push(
        `${bf.label} total (+${sum}${bf.unit}) ultrapassa o teto recomendado de +${bf.safeTotalMax}${bf.unit}`,
      )
    }
    const curVal = Number(nodeForm.bonuses[bf.key] || 0)
    if (curVal > bf.safeNodeMax) {
      warnings.push(
        `Nó selecionado tem ${bf.label} (+${curVal}${bf.unit}) acima do recomendado por estrela (+${bf.safeNodeMax}${bf.unit})`,
      )
    }
  }

  // Pares únicos de linhas conectadas
  const edges: [any, any][] = []
  const seenEdges = new Set<string>()
  for (const n of nodes) {
    const conns: string[] = Array.isArray(n.connections) ? n.connections : []
    for (const targetId of conns) {
      const key = [n.id, targetId].sort().join('--')
      if (seenEdges.has(key)) continue
      const target = nodes.find((cand) => cand.id === targetId)
      if (target) {
        seenEdges.add(key)
        edges.push([n, target])
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-fuchsia-400">
            <Star size={22} /> Constelações dos Heróis
          </h2>
          <p className="text-sm text-muted-foreground">
            Desenhe o mapa estelar de cada herói. No jogo, o herói faz o Craft do Orbe na Oficina e desperta estrelas para ganhar atributos e bônus passivos.
          </p>
        </div>
      </div>

      {/* AVISO DE BALANCEAMENTO PARA O ADMIN */}
      <div
        className={`rounded-xl border-2 p-4 space-y-2 ${
          warnings.length > 0
            ? 'border-rose-500/60 bg-rose-950/25'
            : 'border-amber-500/40 bg-amber-950/15'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
            <AlertTriangle size={17} className={warnings.length > 0 ? 'text-rose-400' : 'text-amber-400'} />
            <span>Guia de Equilíbrio da Constelação (Evite Números Absurdos!)</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
            {nodes.length} estrelas • Custo total p/ 100%: <strong className="text-sky-400">{totalOrbsCost} Orbes</strong>
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Os bônus da Constelação <strong>somam direto nos atributos do herói e equipamentos</strong>. Para manter o combate equilibrado:
          use <strong>Estrelas Menores</strong> com bônus pequenos (<code className="text-emerald-300">+10 a +30 HP</code>, <code className="text-sky-300">+5 a +15 MP</code>, <code className="text-rose-300">+2 a +5 ATK/DEF</code>) e reserve porcentagens (<code className="text-amber-300">+2% a +5%</code>) ou <code className="text-fuchsia-300">+1% a +3% CRIT</code> apenas para <strong>Estrelas Notáveis</strong> (bloqueadas por Nível ou História).
        </p>

        {/* Soma Total ao Despertar 100% */}
        <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Soma em 100%:</span>
          {Object.keys(totalBonuses).length === 0 ? (
            <span className="text-slate-500 italic">Nenhum bônus cadastrado ainda</span>
          ) : (
            BONUS_FIELDS.filter((bf) => totalBonuses[bf.key]).map((bf) => {
              const val = totalBonuses[bf.key]
              const over = val > bf.safeTotalMax
              return (
                <span
                  key={bf.key}
                  className={`px-2 py-0.5 rounded border font-mono font-bold ${
                    over
                      ? 'bg-rose-500/25 text-rose-200 border-rose-400 animate-pulse'
                      : `bg-slate-900/90 ${bf.color}`
                  }`}
                >
                  {bf.label}: +{val}
                  {bf.unit}
                </span>
              )
            })
          )}
        </div>

        {warnings.length > 0 && (
          <div className="pt-1 space-y-1">
            {warnings.map((w, idx) => (
              <div key={idx} className="text-xs text-rose-300 font-semibold flex items-center gap-1.5">
                <ShieldAlert size={13} className="text-rose-400 flex-shrink-0" />
                <span>ALERTA: {w}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seletor de Herói + Configuração do Orbe */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 rounded-xl p-3.5">
        <div className="flex flex-wrap gap-2">
          {chars.map((c) => {
            const active = charId === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCharacter(c.id)}
                className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition flex items-center gap-2 ${
                  active
                    ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200 shadow-md'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                {c.portrait_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.portrait_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                )}
                <span>{c.name}</span>
              </button>
            )
          })}
        </div>

        {charId && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Gem size={14} className="text-sky-400" />
              <span className="text-slate-300">Orbe exigido (Craft):</span>
              <select
                value={orbItemId}
                onChange={(e) => {
                  const val = e.target.value
                  setOrbItemId(val)
                  if (nodes.length > 0) {
                    startTransition(() =>
                      setConstellationConfigForCharacter(charId, val || null, resetItemId || null),
                    )
                  }
                }}
                className="border border-sky-500/40 rounded px-2 py-1 bg-slate-950 text-sky-200"
              >
                <option value="">Qualquer Orbe / Pontos de Lore</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Item p/ Reset:</span>
              <select
                value={resetItemId}
                onChange={(e) => {
                  const val = e.target.value
                  setResetItemId(val)
                  if (nodes.length > 0) {
                    startTransition(() =>
                      setConstellationConfigForCharacter(charId, orbItemId || null, val || null),
                    )
                  }
                }}
                className="border border-slate-700 rounded px-2 py-1 bg-slate-950 text-slate-300"
              >
                <option value="">Livre (Grátis)</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* EDITOR DE 2 COLUNAS: CANVAS ESTELAR (ESQ) + PROPRIEDADES DA ESTRELA (DIR) */}
      {charId && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ESQUERDA: Canvas Estelar Interativo (estilo imperiallworld.com) */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConnectMode(false)
                    setConnectSourceId(null)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 ${
                    !connectMode
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  <Move size={13} /> Posicionar / Criar (Clique no Céu)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConnectMode(!connectMode)
                    setConnectSourceId(null)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 ${
                    connectMode
                      ? 'border-sky-400 bg-sky-500/25 text-sky-200 ring-1 ring-sky-400'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  <Link2 size={13} />{' '}
                  {connectMode
                    ? connectSourceId
                      ? 'Agora clique na 2ª estrela…'
                      : 'Modo Conectar: clique na 1ª estrela'
                    : 'Conectar / Desconectar Linhas'}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.7, +(s - 0.15).toFixed(2)))}
                  className="p-1.5 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800"
                  title="Diminuir zoom"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="text-xs text-slate-400 font-mono w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(1.6, +(s + 0.15).toFixed(2)))}
                  className="p-1.5 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800"
                  title="Aumentar zoom"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            <div
              className="relative w-full h-[560px] rounded-2xl border-2 border-slate-700 bg-[#020617] overflow-auto shadow-2xl select-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
              }}
            >
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMoveCanvas}
                onMouseUp={handleMouseUpCanvas}
                onMouseLeave={handleMouseUpCanvas}
                className="relative mx-auto my-auto cursor-crosshair"
                style={{
                  width: `${100 * scale}%`,
                  height: `${100 * scale}%`,
                  minWidth: '520px',
                  minHeight: '520px',
                  backgroundImage:
                    'radial-gradient(rgba(148,163,184,0.16) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              >
                {/* Linhas da Constelação */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {edges.map(([a, b]) => (
                    <line
                      key={`${a.id}-${b.id}`}
                      x1={`${a.x}%`}
                      y1={`${a.y}%`}
                      x2={`${b.x}%`}
                      y2={`${b.y}%`}
                      stroke="#38bdf8"
                      strokeOpacity="0.65"
                      strokeWidth="2.2"
                    />
                  ))}
                </svg>

                {/* Nós / Estrelas */}
                {nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id
                  const isConnectSource = connectSourceId === node.id
                  const hasGate =
                    Number(node.required_level || 1) > 1 ||
                    Boolean(node.required_story_id) ||
                    Boolean(node.required_zone_id)

                  return (
                    <div
                      key={node.id}
                      data-node-id={node.id}
                      onMouseDown={(e) => {
                        if (!connectMode) {
                          e.stopPropagation()
                          setDraggingId(node.id)
                        }
                      }}
                      onClick={(e) => handleNodeClick(e, node)}
                      style={{
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                        borderColor: node.is_start
                          ? '#22c55e'
                          : node.color || '#0ea5e9',
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-transform z-10 ${
                        isSelected
                          ? 'ring-4 ring-amber-400 scale-125 bg-slate-900 z-20'
                          : isConnectSource
                            ? 'ring-4 ring-sky-400 scale-125 bg-sky-950 z-20'
                            : 'bg-slate-900/90 hover:scale-110'
                      }`}
                      title={`${node.title} (${node.cost_orbs} Orbes)`}
                    >
                      <span
                        className="text-xs font-extrabold font-mono"
                        style={{
                          color: node.is_start ? '#22c55e' : node.color || '#38bdf8',
                        }}
                      >
                        {node.cost_orbs}
                      </span>
                      {hasGate && (
                        <Lock
                          size={9}
                          className="text-amber-400 absolute -top-1 -right-1 bg-slate-950 rounded-full"
                        />
                      )}
                      <span className="absolute top-11 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] text-slate-200 pointer-events-none">
                        {node.is_start ? '★ ' : ''}
                        {node.title}
                      </span>
                    </div>
                  )
                })}

                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none p-6 text-center">
                    <Sparkles size={40} className="text-fuchsia-400/50 mb-2" />
                    <p className="text-sm font-semibold">
                      Clique em qualquer ponto do mapa estelar para criar a 1ª Estrela (Origem)
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      As próximas estrelas clicadas já se conectam automaticamente à estrela selecionada!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DIREITA: Editor do Nó Selecionado */}
          <div className="lg:col-span-5">
            {!selectedNodeId ? (
              <div className="border border-slate-800 bg-slate-900/60 rounded-2xl p-8 text-center text-sm text-slate-400">
                Selecione uma estrela no mapa ao lado (ou clique no céu escuro para criar uma nova).
              </div>
            ) : (
              <form
                onSubmit={handleSaveNode}
                className="border-2 border-fuchsia-500/40 bg-slate-900/90 rounded-2xl p-5 space-y-4 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-fuchsia-300 flex items-center gap-2">
                    <Star size={16} /> Editando: {nodeForm.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Excluir esta estrela da constelação?')) {
                        startTransition(async () => {
                          await deleteConstellationNode(selectedNodeId, charId)
                          await loadNodes(charId)
                        })
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs inline-flex items-center gap-1 hover:bg-rose-500/25"
                  >
                    <Trash2 size={12} /> Excluir Estrela
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-300">Nome da Estrela / Nó</label>
                    <input
                      value={nodeForm.title}
                      onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })}
                      className="w-full border rounded px-2.5 py-1.5 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-sky-300 font-semibold">
                      Custo em Orbes <Tooltip text="Quantos Orbes de Poder o jogador gasta para despertar esta estrela" />
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={nodeForm.cost_orbs}
                      onChange={(e) =>
                        setNodeForm({ ...nodeForm, cost_orbs: Number(e.target.value) })
                      }
                      className="w-full border rounded px-2.5 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300">Cor da Estrela</label>
                    <select
                      value={nodeForm.color}
                      onChange={(e) => setNodeForm({ ...nodeForm, color: e.target.value })}
                      className="w-full border rounded px-2.5 py-1.5 text-sm"
                    >
                      {NODE_COLORS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Posição X (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={4}
                      max={96}
                      value={nodeForm.x}
                      onChange={(e) => setNodeForm({ ...nodeForm, x: Number(e.target.value) })}
                      className="w-full border rounded px-2.5 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Posição Y (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={4}
                      max={96}
                      value={nodeForm.y}
                      onChange={(e) => setNodeForm({ ...nodeForm, y: Number(e.target.value) })}
                      className="w-full border rounded px-2.5 py-1 text-xs"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-emerald-300 font-semibold bg-emerald-950/30 border border-emerald-500/30 rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    checked={nodeForm.is_start}
                    onChange={(e) => setNodeForm({ ...nodeForm, is_start: e.target.checked })}
                  />
                  <span>
                    Estrela Inicial (Origem) — fica disponível desde o começo (círculo verde no jogo)
                  </span>
                </label>

                {/* BLOQUEIOS DE PROGRESSÃO: LEVEL OU HISTÓRIA/ZONA */}
                <div className="border border-amber-500/30 bg-amber-950/15 rounded-xl p-3 space-y-2.5">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Lock size={13} /> Bloqueios de Progressão desta Estrela (Opcional)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-300">
                        Nível mín. do Herói
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={nodeForm.required_level}
                        onChange={(e) =>
                          setNodeForm({
                            ...nodeForm,
                            required_level: Number(e.target.value),
                          })
                        }
                        className="w-full border rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300">
                        Requer Área da História
                      </label>
                      <select
                        value={nodeForm.required_zone_id}
                        onChange={(e) =>
                          setNodeForm({ ...nodeForm, required_zone_id: e.target.value })
                        }
                        className="w-full border rounded px-2 py-1 text-xs"
                      >
                        <option value="">Nenhuma</option>
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300">
                        Requer História concluída
                      </label>
                      <select
                        value={nodeForm.required_story_id}
                        onChange={(e) =>
                          setNodeForm({ ...nodeForm, required_story_id: e.target.value })
                        }
                        className="w-full border rounded px-2 py-1 text-xs"
                      >
                        <option value="">Nenhuma</option>
                        {stories.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BÔNUS DE ATRIBUTOS DA ESTRELA */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-sky-300">
                    Bônus Concedidos ao Despertar (deixe 0 nos que não usar)
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {BONUS_FIELDS.map((bf) => {
                      const val = nodeForm.bonuses[bf.key] ?? ''
                      const overNode = Number(val) > bf.safeNodeMax
                      return (
                        <div
                          key={bf.key}
                          className={`border rounded-lg p-2 ${
                            overNode
                              ? 'border-rose-500 bg-rose-950/30'
                              : 'border-slate-800 bg-slate-950/60'
                          }`}
                        >
                          <label className={`text-[11px] font-semibold flex justify-between ${bf.color.split(' ')[0]}`}>
                            <span>{bf.label}</span>
                            <Tooltip text={bf.hint} />
                          </label>
                          <input
                            type="number"
                            value={val}
                            placeholder="0"
                            onChange={(e) =>
                              setNodeForm({
                                ...nodeForm,
                                bonuses: {
                                  ...nodeForm.bonuses,
                                  [bf.key]: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full border rounded px-2 py-1 text-xs mt-1 font-mono"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-sm inline-flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Check size={16} />
                  {isPending ? 'Salvando Estrela...' : 'Salvar Alterações da Estrela'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
