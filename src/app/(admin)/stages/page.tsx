'use client'

import { useState, useEffect, useTransition } from 'react'
import { listStages, createStage, updateStage, deleteStage } from '@/lib/actions/stages'
import { listZones, createZone, updateZone, deleteZone } from '@/lib/actions/zones'
import { Tooltip } from '@/components/ui/tooltip'
import { Map, Plus, Pencil, Trash2, Eye, Lock, Flame, Compass, CheckCircle2 } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { DetailModal, DetailRow, DetailImage } from '@/components/ui/detail-modal'
import { SearchBox, Counters } from '@/components/ui/data-table'

function Tip({ text }: { text: string }) {
  return <Tooltip text={text} />
}

// Os 6 locais hexagonais de cada Zona (dispostos ao redor do marco central, como na referência).
// Ao limpar todas as waves de um local, os locais adjacentes liberam automaticamente no APK.
export const HEX_SLOTS: {
  slot: number
  label: string
  role: string
  x: number
  y: number
  adjacent: number[]
  color: string
}[] = [
  {
    slot: 1,
    label: 'Local 1 • Noroeste',
    role: 'Entrada da Zona (Início)',
    x: 32,
    y: 20,
    adjacent: [2, 6],
    color: 'from-emerald-600/80 to-teal-900/90 border-emerald-400',
  },
  {
    slot: 2,
    label: 'Local 2 • Nordeste',
    role: 'Território Norte',
    x: 68,
    y: 20,
    adjacent: [1, 3],
    color: 'from-indigo-600/80 to-purple-900/90 border-indigo-400',
  },
  {
    slot: 3,
    label: 'Local 3 • Leste',
    role: 'Fronteira Oriental',
    x: 82,
    y: 50,
    adjacent: [2, 4, 6],
    color: 'from-cyan-600/80 to-sky-900/90 border-cyan-400',
  },
  {
    slot: 4,
    label: 'Local 4 • Sudeste',
    role: 'Fortaleza / Chefe',
    x: 68,
    y: 80,
    adjacent: [3, 5],
    color: 'from-rose-600/80 to-amber-950/90 border-amber-400',
  },
  {
    slot: 5,
    label: 'Local 5 • Sudoeste',
    role: 'Território Sul',
    x: 32,
    y: 80,
    adjacent: [4, 6],
    color: 'from-amber-600/80 to-orange-950/90 border-amber-400',
  },
  {
    slot: 6,
    label: 'Local 6 • Oeste',
    role: 'Fronteira Ocidental',
    x: 18,
    y: 50,
    adjacent: [1, 5, 3],
    color: 'from-teal-600/80 to-emerald-950/90 border-teal-400',
  },
]

const HEX_EDGES: [number, number][] = [
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 1],
  [6, 3],
]

const emptyStage = {
  zone_id: '',
  slug: '',
  name: '',
  description: '',
  stage_number: 1,
  recommended_level: 1,
  energy_cost: 1,
  is_boss_stage: false,
  is_active: true,
  sort_order: 0,
}

const emptyZone = {
  slug: '',
  name: '',
  description: '',
  bg_url: '',
  bg_parallax: false,
  starter: false,
  is_active: true,
  sort_order: 0,
}

/** Mapa Hexagonal interativo dos 6 locais de uma Zona (usado no cadastro de Zona,
 *  no painel visual da Zona e como seletor de posição no cadastro de Área/Fase). */
function ZoneHexMapSelector({
  zone,
  stagesOfZone,
  selectedSlot,
  onSelectSlot,
  onEditStage,
  compact = false,
}: {
  zone?: any
  stagesOfZone: any[]
  selectedSlot?: number
  onSelectSlot?: (slot: number, existingStage?: any) => void
  onEditStage?: (stage: any) => void
  compact?: boolean
}) {
  const stageBySlot = (slot: number) =>
    stagesOfZone.find((s) => Number(s.stage_number) === slot)

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full ${
          compact ? 'h-80' : 'h-[430px]'
        } rounded-2xl border-2 border-amber-500/40 bg-zinc-950 overflow-hidden shadow-2xl select-none`}
        style={
          zone?.bg_url
            ? {
                backgroundImage: `url(${zone.bg_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {/* Camada escura/ geográfica de contraste */}
        <div
          className="absolute inset-0"
          style={{
            background: zone?.bg_url
              ? 'radial-gradient(circle at 50% 50%, rgba(15,23,42,0.45) 0%, rgba(9,9,11,0.82) 100%)'
              : 'radial-gradient(circle at 50% 50%, rgba(30,41,59,0.95) 0%, rgba(9,9,11,0.98) 100%)',
          }}
        />

        {/* Pontes e conexões douradas entre os 6 hexágonos adjacentes */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Caminhos do centro para os 6 setores (estilo Capítulo / Hub) */}
          {HEX_SLOTS.map((h) => (
            <line
              key={`hub-${h.slot}`}
              x1={50}
              y1={50}
              x2={h.x}
              y2={h.y}
              stroke="rgba(217, 119, 6, 0.35)"
              strokeWidth="1.2"
              strokeDasharray="1.5 1.5"
            />
          ))}
          {/* Caminhos de adjacência entre os 6 hexágonos */}
          {HEX_EDGES.map(([a, b]) => {
            const ha = HEX_SLOTS.find((s) => s.slot === a)!
            const hb = HEX_SLOTS.find((s) => s.slot === b)!
            const bothOccupied = Boolean(stageBySlot(a) && stageBySlot(b))
            return (
              <line
                key={`edge-${a}-${b}`}
                x1={ha.x}
                y1={ha.y}
                x2={hb.x}
                y2={hb.y}
                stroke={bothOccupied ? '#f59e0b' : 'rgba(148, 163, 184, 0.35)'}
                strokeWidth={bothOccupied ? '0.9' : '0.55'}
                strokeDasharray={bothOccupied ? undefined : '1.5 1.5'}
              />
            )
          })}
        </svg>

        {/* Marco Central da Zona */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center"
          style={{ left: '50%', top: '50%' }}
        >
          <div className="w-16 h-16 rounded-full border-2 border-amber-500/50 bg-zinc-900/90 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex flex-col items-center justify-center text-center p-1">
            <Compass size={18} className="text-amber-400" />
            <span className="text-[9px] font-bold text-amber-200 leading-tight truncate max-w-[54px]">
              {zone?.name || 'Centro'}
            </span>
          </div>
        </div>

        {/* Os 6 Locais Hexagonais */}
        {HEX_SLOTS.map((hex) => {
          const st = stageBySlot(hex.slot)
          const isSelected = selectedSlot === hex.slot
          return (
            <button
              key={hex.slot}
              type="button"
              onClick={() => {
                if (onSelectSlot) onSelectSlot(hex.slot, st)
                else if (st && onEditStage) onEditStage(st)
              }}
              style={{
                left: `${hex.x}%`,
                top: `${hex.y}%`,
                clipPath:
                  'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                compact ? 'w-32 h-24' : 'w-40 h-28'
              } transition-all duration-150 flex flex-col items-center justify-center text-center px-3 py-2 shadow-xl ${
                isSelected
                  ? 'ring-4 ring-amber-300 scale-110 bg-gradient-to-br from-amber-500 to-amber-800 text-white z-20'
                  : st
                    ? `bg-gradient-to-br ${hex.color} text-white hover:scale-105 z-10`
                    : 'bg-zinc-900/85 hover:bg-zinc-800/90 text-zinc-300 border border-zinc-600 hover:scale-105 z-10'
              }`}
              title={`${hex.label} — Conecta com: ${hex.adjacent.map((n) => `#${n}`).join(', ')}`}
            >
              <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
                <span>Hex #{hex.slot}</span>
                {st?.is_boss_stage && <Flame size={11} className="text-red-300" />}
              </div>
              {st ? (
                <>
                  <div className="text-xs font-bold leading-tight line-clamp-2 text-white mt-0.5">
                    {st.name}
                  </div>
                  <div className="text-[10px] text-amber-100/90 mt-0.5">
                    Nv {st.recommended_level} • Adj: {hex.adjacent.map((n) => `#${n}`).join(',')}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[11px] font-semibold text-zinc-300 mt-0.5">
                    {hex.role}
                  </div>
                  <div className="text-[10px] text-amber-400 mt-0.5">
                    + Criar / Selecionar
                  </div>
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Legenda rápida de adjacência */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 px-1">
        <span>
          <strong>Regra no APK:</strong> o jogador começa pelo <strong>Hex #1</strong>. Ao limpar todas as waves de um hexágono, os hexágonos adjacentes conectados liberam automaticamente.
        </span>
        <span className="text-amber-300">
          Clique em qualquer um dos 6 locais acima para posicionar ou editar a área/cidade.
        </span>
      </div>
    </div>
  )
}

export default function StagesPage() {
  const [stages, setStages] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyStage)
  const [isPending, startTransition] = useTransition()
  const [zoneForm, setZoneForm] = useState(emptyZone)
  const [zoneEditing, setZoneEditing] = useState<any>(null)
  const [showZoneForm, setShowZoneForm] = useState(false)
  const [viewingZone, setViewingZone] = useState<any>(null)
  const [q, setQ] = useState('')

  const zoneList = q.trim()
    ? zones.filter((z: any) => `${z.name} ${z.slug}`.toLowerCase().includes(q.trim().toLowerCase()))
    : zones
  const stageList = q.trim()
    ? stages.filter((s: any) =>
        `${s.name} ${s.slug} ${s.zones?.name || ''}`.toLowerCase().includes(q.trim().toLowerCase()),
      )
    : stages
  const bossCount = stages.filter((s: any) => s.is_boss_stage).length

  const load = () => {
    listStages().then(setStages)
    listZones().then((zs) => {
      setZones(zs)
      if (!selectedZoneId && zs.length > 0) {
        setSelectedZoneId(zs[0].id)
      }
    })
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeZone = zones.find((z) => z.id === selectedZoneId) || zones[0] || null
  const stagesOfActiveZone = activeZone
    ? stages.filter((s) => s.zone_id === activeZone.id)
    : []

  const formZone = zones.find((z) => z.id === form.zone_id) || activeZone
  const stagesOfFormZone = formZone
    ? stages.filter((s) => s.zone_id === formZone.id && s.id !== editing?.id)
    : []

  const handleEdit = (stage: any) => {
    setEditing(stage)
    setForm({
      zone_id: stage.zone_id || '',
      slug: stage.slug,
      name: stage.name,
      description: stage.description || '',
      stage_number: stage.stage_number || 1,
      recommended_level: stage.recommended_level,
      energy_cost: stage.energy_cost,
      is_boss_stage: stage.is_boss_stage,
      is_active: stage.is_active,
      sort_order: stage.sort_order,
    })
    setShowForm(true)
  }

  const handleCreateAtSlot = (zone: any, slot: number) => {
    setEditing(null)
    setForm({
      ...emptyStage,
      zone_id: zone?.id || '',
      stage_number: slot,
      slug: zone?.slug ? `${zone.slug}_area_${slot}` : `area_${slot}`,
      is_boss_stage: slot === 4,
      sort_order: slot,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateStage(editing.id, fd)
      else await createStage(fd)
      setShowForm(false)
      setEditing(null)
      setForm(emptyStage)
      load()
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta área/fase?')) startTransition(() => deleteStage(id).then(load))
  }

  const handleZoneEdit = (zone: any) => {
    setZoneEditing(zone)
    setZoneForm({
      slug: zone.slug,
      name: zone.name,
      description: zone.description || '',
      bg_url: zone.bg_url || '',
      bg_parallax: zone.bg_parallax,
      starter: Boolean(zone.starter),
      is_active: zone.is_active,
      sort_order: zone.sort_order,
    })
    setShowZoneForm(true)
  }

  const handleZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (zoneEditing) await updateZone(zoneEditing.id, fd)
      else await createZone(fd)
      setShowZoneForm(false)
      setZoneEditing(null)
      setZoneForm(emptyZone)
      load()
    })
  }

  const handleZoneDelete = (id: string) => {
    if (confirm('Excluir esta zona?')) startTransition(() => deleteZone(id).then(load))
  }

  const currentSlotInfo = HEX_SLOTS.find((h) => h.slot === Number(form.stage_number)) || HEX_SLOTS[0]

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Pesquisar zona ou área/cidade..." />
        <Counters total={stages.length} shown={stageList.length} totalLabel="áreas/fases" />
        <p className="text-xs text-muted-foreground">
          {zones.length} zonas geográficas • {bossCount} áreas de chefão
        </p>
      </div>

      {/* 1. ZONAS (MAPAS GEOGRÁFICOS) */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2 text-amber-400">
              <Map size={22} /> Zonas (Mapas Geográficos)
            </h2>
            <p className="text-sm text-muted-foreground">
              No APK, a tela de Fases mostra todas as Zonas minimizadas (com cadeado nas que o herói ainda não liberou na História). Ao clicar numa Zona aberta, abre o Mapa Hexagonal com as 6 áreas/cidades dela.
            </p>
          </div>
          <button
            onClick={() => {
              setZoneEditing(null)
              setZoneForm(emptyZone)
              setShowZoneForm(true)
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg inline-flex items-center gap-2 font-medium"
          >
            <Plus size={16} /> Nova Zona
          </button>
        </div>

        {showZoneForm && (
          <form
            onSubmit={handleZoneSubmit}
            className="border-2 border-amber-500/40 bg-amber-950/10 rounded-xl p-5 mb-6 space-y-4"
          >
            <h3 className="text-base font-semibold text-amber-300">
              {zoneEditing ? `Editando Zona: ${zoneEditing.name}` : 'Nova Zona Geográfica'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm">
                  Slug <Tip text="Identificador único. Ex.: floresta_sombria, caos_gelido" />
                </label>
                <input
                  name="slug"
                  value={zoneForm.slug}
                  onChange={(e) => setZoneForm({ ...zoneForm, slug: e.target.value })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                  required
                />
              </div>
              <div>
                <label className="text-sm">Nome de Exibição</label>
                <input
                  name="name"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                  required
                />
              </div>
              <div>
                <label className="text-sm">Ordem de Exibição</label>
                <input
                  name="sort_order"
                  type="number"
                  value={zoneForm.sort_order}
                  onChange={(e) => setZoneForm({ ...zoneForm, sort_order: Number(e.target.value) })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                />
              </div>
              <div className="md:col-span-3">
                <ImageUpload
                  label="Mapa Geográfico da Zona (Background)"
                  fieldName="bg_url"
                  tooltipText="Imagem do mapa da zona onde os 6 hexágonos de áreas/cidades serão posicionados."
                  folder="backgrounds"
                  value={zoneForm.bg_url}
                  onChange={(url) => setZoneForm({ ...zoneForm, bg_url: url })}
                  hint="JPG ou PNG 1920x1080 — mapa de fundo da zona (limite 1920px)"
                  accept="image/png,image/jpeg,image/webp"
                  maxSize={1920}
                />
              </div>
            </div>

            {/* Preview em tempo real dos 6 locais sobre o mapa desta zona */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Preview dos 6 Locais Hexagonais neste Mapa
              </label>
              <ZoneHexMapSelector
                zone={zoneForm}
                stagesOfZone={
                  zoneEditing ? stages.filter((s) => s.zone_id === zoneEditing.id) : []
                }
                compact
              />
            </div>

            <div>
              <label className="text-sm">Descrição</label>
              <textarea
                name="description"
                value={zoneForm.description}
                onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                className="w-full border rounded px-2.5 py-1.5 bg-background"
              />
            </div>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="starter"
                  checked={zoneForm.starter}
                  onChange={(e) => setZoneForm({ ...zoneForm, starter: e.target.checked })}
                />{' '}
                Zona inicial (starter){' '}
                <Tip text="Visível e desbloqueada desde o início sem precisar liberar na História. As demais zonas aparecem com cadeado até uma fala/escolha liberá-las." />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="bg_parallax"
                  checked={zoneForm.bg_parallax}
                  onChange={(e) => setZoneForm({ ...zoneForm, bg_parallax: e.target.checked })}
                />{' '}
                Efeito Parallax{' '}
                <Tip text="Fundo se move em camadas para dar sensação de profundidade" />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={zoneForm.is_active}
                  onChange={(e) => setZoneForm({ ...zoneForm, is_active: e.target.checked })}
                />{' '}
                Ativa
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : zoneEditing ? 'Atualizar Zona' : 'Criar Zona'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowZoneForm(false)
                  setZoneEditing(null)
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Tabela/Lista de Zonas */}
        <div className="border rounded-xl overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2.5 text-left">#</th>
                <th className="p-2.5 text-left">Mapa</th>
                <th className="p-2.5 text-left">Zona</th>
                <th className="p-2.5 text-left">Áreas (Hexágonos)</th>
                <th className="p-2.5 text-left">Acesso Inicial</th>
                <th className="p-2.5 text-left">Ativa</th>
                <th className="p-2.5 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {zoneList.map((zone, zi) => {
                const countInZone = stages.filter((s) => s.zone_id === zone.id).length
                const isSelected = activeZone?.id === zone.id
                return (
                  <tr
                    key={zone.id}
                    className={`border-t transition ${
                      isSelected ? 'bg-amber-500/10' : 'hover:bg-muted/40'
                    }`}
                  >
                    <td className="p-2.5 text-muted-foreground">{zi + 1}</td>
                    <td className="p-2.5">
                      {zone.bg_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={zone.bg_url}
                          alt={zone.name}
                          className="w-16 h-10 object-cover rounded border"
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs">Mapa padrão</span>
                      )}
                    </td>
                    <td className="p-2.5 font-medium">
                      <button
                        onClick={() => setSelectedZoneId(zone.id)}
                        className="underline underline-offset-2 hover:text-amber-400 text-left font-semibold"
                      >
                        {zone.name}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        <code>{zone.slug}</code>
                      </div>
                    </td>
                    <td className="p-2.5">
                      <button
                        onClick={() => setSelectedZoneId(zone.id)}
                        className="px-2.5 py-1 rounded-full text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25"
                      >
                        {countInZone}/6 locais ocupados (Ver Mapa)
                      </button>
                    </td>
                    <td className="p-2.5">
                      {zone.starter ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> Aberta no Início
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 inline-flex items-center gap-1">
                          <Lock size={11} /> Cadeado (via História)
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">{zone.is_active ? 'Sim' : 'Não'}</td>
                    <td className="p-2.5 flex gap-2 items-center">
                      <button
                        onClick={() => setViewingZone(zone)}
                        className="text-emerald-400 underline inline-flex items-center gap-1"
                      >
                        <Eye size={12} /> Ver
                      </button>
                      <button
                        onClick={() => handleZoneEdit(zone)}
                        className="text-blue-400 underline inline-flex items-center gap-1"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        onClick={() => handleZoneDelete(zone.id)}
                        className="text-red-400 underline inline-flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {viewingZone && (
          <DetailModal title={viewingZone.name} onClose={() => setViewingZone(null)}>
            <div className="mb-3">
              <ZoneHexMapSelector
                zone={viewingZone}
                stagesOfZone={stages.filter((s) => s.zone_id === viewingZone.id)}
                compact
              />
            </div>
            <DetailRow label="Slug" value={<code>{viewingZone.slug}</code>} />
            <DetailRow
              label="Zona Inicial"
              value={
                viewingZone.starter
                  ? 'Sim (aberta desde o início)'
                  : 'Não (aparece com cadeado até liberar na História)'
              }
            />
            <DetailRow label="Descrição" value={viewingZone.description || '—'} />
            <DetailRow label="Parallax" value={viewingZone.bg_parallax ? 'Sim' : 'Não'} />
            <DetailRow label="Ativa" value={viewingZone.is_active ? 'Sim' : 'Não'} />
          </DetailModal>
        )}
      </div>

      {/* 2. MAPA INTERATIVO DE HEXÁGONOS DA ZONA + CADASTRO DE ÁREAS/CIDADES (STAGES) */}
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-amber-400">
              Áreas / Cidades da Zona (Mapa com 6 Hexágonos)
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecione a Zona abaixo e clique em um dos 6 hexágonos do mapa para criar ou posicionar cada cidade/área. Quando o jogador limpa todas as waves de um hexágono, os hexágonos vizinhos liberam.
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null)
              setForm({
                ...emptyStage,
                zone_id: activeZone?.id || '',
                stage_number: 1,
              })
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg inline-flex items-center gap-2 font-medium"
          >
            <Plus size={16} /> Nova Área / Cidade
          </button>
        </div>

        {/* Abas de seleção rápida de Zona para ver o Mapa de 6 locais */}
        {zones.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {zones.map((z) => {
                const isSelected = activeZone?.id === z.id
                const count = stages.filter((s) => s.zone_id === z.id).length
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setSelectedZoneId(z.id)}
                    className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition flex items-center gap-2 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 text-amber-200 shadow'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Map size={14} className={isSelected ? 'text-amber-400' : 'text-zinc-500'} />
                    <span>{z.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {count}/6
                    </span>
                  </button>
                )
              })}
            </div>

            {activeZone && !showForm && (
              <ZoneHexMapSelector
                zone={activeZone}
                stagesOfZone={stagesOfActiveZone}
                onSelectSlot={(slot, existingStage) => {
                  if (existingStage) {
                    handleEdit(existingStage)
                  } else {
                    handleCreateAtSlot(activeZone, slot)
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Formulário de Criação/Edição de Área com Seletor Visual dos 6 Locais */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="border-2 border-amber-500/50 bg-zinc-900/90 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-amber-300">
                {editing
                  ? `Editando Área: ${editing.name} (Hex #${form.stage_number})`
                  : `Nova Área / Cidade — Hex #${form.stage_number}`}
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200">
                {currentSlotInfo.label} • Ao limpar waves, libera:{' '}
                {currentSlotInfo.adjacent.map((n) => `Hex #${n}`).join(', ')}
              </span>
            </div>

            {/* Seletor visual dos 6 locais dentro do formulário */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                1. Clique no Mapa para escolher em qual dos 6 Locais esta Área fica:
              </label>
              <ZoneHexMapSelector
                zone={formZone}
                stagesOfZone={stagesOfFormZone}
                selectedSlot={Number(form.stage_number)}
                onSelectSlot={(slot) =>
                  setForm({
                    ...form,
                    stage_number: slot,
                    sort_order: slot,
                  })
                }
                compact
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm">
                  Zona (Mapa) <Tip text="Zona geográfica onde esta área/cidade pertence" />
                </label>
                <select
                  name="zone_id"
                  value={form.zone_id}
                  onChange={(e) => {
                    setForm({ ...form, zone_id: e.target.value })
                    setSelectedZoneId(e.target.value)
                  }}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                  required
                >
                  <option value="">— Selecione a Zona —</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm">
                  Local no Mapa (Hexágono 1 a 6){' '}
                  <Tip text="Define qual dos 6 hexágonos do mapa desta zona esta área ocupa. Limpar todas as waves dela libera os hexágonos adjacentes." />
                </label>
                <select
                  name="stage_number"
                  value={form.stage_number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stage_number: Number(e.target.value),
                      sort_order: Number(e.target.value),
                    })
                  }
                  className="w-full border border-amber-500/50 rounded px-2.5 py-1.5 bg-background font-semibold"
                >
                  {HEX_SLOTS.map((h) => {
                    const taken = stagesOfFormZone.find((s) => Number(s.stage_number) === h.slot)
                    return (
                      <option key={h.slot} value={h.slot}>
                        Hex #{h.slot} — {h.label} ({h.role})
                        {taken ? ` [Ocupado: ${taken.name}]` : ' [Livre]'}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="text-sm">
                  Slug <Tip text="Identificador único. Ex.: floresta_sombria_area1" />
                </label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                  required
                />
              </div>
              <div>
                <label className="text-sm">Nome da Área / Cidade</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                  required
                />
              </div>
              <div>
                <label className="text-sm">
                  Nível Recomendado{' '}
                  <Tip text="Nível mínimo do jogador para jogar esta área sem dificuldade extrema" />
                </label>
                <input
                  name="recommended_level"
                  type="number"
                  value={form.recommended_level}
                  onChange={(e) =>
                    setForm({ ...form, recommended_level: Number(e.target.value) })
                  }
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-sm">
                  Custo de Energia{' '}
                  <Tip text="Energia que o jogador gasta ao entrar na área. 0 = gratuita" />
                </label>
                <input
                  name="energy_cost"
                  type="number"
                  value={form.energy_cost}
                  onChange={(e) => setForm({ ...form, energy_cost: Number(e.target.value) })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                />
              </div>
              <input type="hidden" name="sort_order" value={form.sort_order} />
            </div>
            <div>
              <label className="text-sm">Descrição</label>
              <textarea
                name="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded px-2.5 py-1.5 bg-background"
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_boss_stage"
                  checked={form.is_boss_stage}
                  onChange={(e) => setForm({ ...form, is_boss_stage: e.target.checked })}
                />{' '}
                Área de Chefão (Boss){' '}
                <Tip text="Se ativada, este hexágono destaca ícone de Boss no mapa" />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />{' '}
                Ativa
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : editing ? 'Atualizar Área' : 'Criar Área'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Listagem tabular de todas as áreas/fases */}
        <div className="border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2.5 text-left">#</th>
                <th className="p-2.5 text-left">Área / Cidade</th>
                <th className="p-2.5 text-left">Zona (Mapa)</th>
                <th className="p-2.5 text-left">Hexágono (1–6)</th>
                <th className="p-2.5 text-left">Libera Adjacentes</th>
                <th className="p-2.5 text-left">Nível</th>
                <th className="p-2.5 text-left">Energia</th>
                <th className="p-2.5 text-left">Boss</th>
                <th className="p-2.5 text-left">Ativa</th>
                <th className="p-2.5 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {stageList.map((stage, si) => {
                const slotNum = Math.min(6, Math.max(1, Number(stage.stage_number) || 1))
                const slotMeta = HEX_SLOTS.find((h) => h.slot === slotNum)!
                return (
                  <tr key={stage.id} className="border-t hover:bg-muted/30">
                    <td className="p-2.5 text-muted-foreground">{si + 1}</td>
                    <td className="p-2.5 font-medium">{stage.name}</td>
                    <td className="p-2.5">{stage.zones?.name || '—'}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold">
                        Hex #{slotNum} ({slotMeta.label.split('•')[1]?.trim()})
                      </span>
                    </td>
                    <td className="p-2.5 text-xs text-muted-foreground">
                      {slotMeta.adjacent.map((n) => `Hex #${n}`).join(', ')}
                    </td>
                    <td className="p-2.5">{stage.recommended_level}</td>
                    <td className="p-2.5">{stage.energy_cost}</td>
                    <td className="p-2.5">{stage.is_boss_stage ? 'Sim' : 'Não'}</td>
                    <td className="p-2.5">{stage.is_active ? 'Sim' : 'Não'}</td>
                    <td className="p-2.5 flex gap-2">
                      <button
                        onClick={() => handleEdit(stage)}
                        className="text-blue-400 underline inline-flex items-center gap-1"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(stage.id)}
                        className="text-red-400 underline inline-flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Excluir
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
