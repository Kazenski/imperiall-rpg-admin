'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  listStories, createStory, updateStory, deleteStory,
  listScenes, createScene, updateScene, deleteScene,
  listLines, createLine, updateLine, deleteLine,
  listChoices, createChoice, updateChoice, deleteChoice,
} from '@/lib/actions/stories'
import { listNpcs } from '@/lib/actions/npcs'
import { listItems } from '@/lib/actions/items'
import { listZones } from '@/lib/actions/zones'
import { Tooltip } from '@/components/ui/tooltip'
import { ImageUpload } from '@/components/ui/image-upload'
import { StoryTester } from '@/components/StoryTester'
import {
  Plus, Pencil, Trash2, BookOpen, MessageSquare, GitBranch,
  Play, ChevronDown, ChevronRight, MapPin, ChevronsUpDown, Sparkles, Layers,
} from 'lucide-react'
import { SearchBox, Counters } from '@/components/ui/data-table'

const SPEAKERS: Record<string, string> = {
  narrator: 'Narrador',
  npc: 'NPC',
  player: 'Jogador (Herói)',
}

const SPEAKER_STYLES: Record<string, { card: string; badge: string }> = {
  npc: {
    card: 'border-amber-500/40 bg-amber-950/15',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  },
  player: {
    card: 'border-sky-500/40 bg-sky-950/15',
    badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
  },
  narrator: {
    card: 'border-purple-500/35 bg-purple-950/15',
    badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
  },
}

export default function HistoriasPage() {
  const [stories, setStories] = useState<any[]>([])
  const [activeStory, setActiveStory] = useState<any>(null)
  const [scenes, setScenes] = useState<any[]>([])
  const [activeScene, setActiveScene] = useState<any>(null)
  const [lines, setLines] = useState<any[]>([])
  const [allSceneLines, setAllSceneLines] = useState<Record<string, any[]>>({})
  const [choices, setChoices] = useState<Record<string, any[]>>({})
  const [counts, setCounts] = useState<Record<string, { lines: number; choices: number }>>({})
  const [collapsedLines, setCollapsedLines] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<any>(null)
  const [npcs, setNpcs] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()

  const [showStoryForm, setShowStoryForm] = useState(false)
  const [storyForm, setStoryForm] = useState({ slug: '', name: '', description: '', cover_url: '', lore_reward: 0, is_active: true, sort_order: 0 })
  const [editingStory, setEditingStory] = useState<any>(null)

  const [sceneForm, setSceneForm] = useState({ order_index: 0, title: '', background_url: '' })
  const [editingScene, setEditingScene] = useState<any>(null)
  const [showSceneForm, setShowSceneForm] = useState(false)

  const [lineForm, setLineForm] = useState({ order_index: 0, speaker_type: 'narrator', speaker_name: '', npc_id: '', text: '', portrait_url: '', unlock_zone_id: '', only_via_choice: false })
  const [editingLine, setEditingLine] = useState<any>(null)
  const [showLineForm, setShowLineForm] = useState(false)

  // destination combina cena ou fala: '' | 'scene:<id>' | 'line:<id>'
  const [choiceForm, setChoiceForm] = useState({
    line_id: '',
    label: '',
    destination: '',
    unlock_zone_id: '',
    reward_xp: 0,
    reward_item_id: '',
    reward_qty: 1,
    sort_order: 0,
  })
  const [editingChoice, setEditingChoice] = useState<any>(null)
  const [showChoiceForm, setShowChoiceForm] = useState(false)
  const [q, setQ] = useState('')

  const zoneName = (zoneId?: string | null) => {
    if (!zoneId) return null
    return zones.find((z: any) => z.id === zoneId)?.name || 'Zona'
  }

  const destinationLabel = (c: any) => {
    if (c.next_line_id) {
      for (const sc of scenes) {
        const ls = allSceneLines[sc.id] || []
        const found = ls.find((l: any) => l.id === c.next_line_id)
        if (found) {
          const preview = String(found.text || '').slice(0, 36)
          return `Fala #${found.order_index} (${sc.title || `Cena #${sc.order_index}`}): “${preview}${found.text?.length > 36 ? '…' : ''}”`
        }
      }
      return `Fala …${String(c.next_line_id).slice(0, 8)}`
    }
    if (c.next_scene_id) {
      const s = scenes.find((sc: any) => sc.id === c.next_scene_id)
      return s
        ? `Cena #${s.order_index}${s.title ? ` — ${s.title}` : ''}`
        : `Cena …${String(c.next_scene_id).slice(0, 8)}`
    }
    return 'Continua (próxima fala)'
  }

  const storyList = q.trim()
    ? stories.filter((s: any) => `${s.name} ${s.slug}`.toLowerCase().includes(q.trim().toLowerCase()))
    : stories
  const activeStories = stories.filter((s: any) => s.is_active).length

  const loadStories = () => listStories().then(setStories).catch(() => setStories([]))
  useEffect(() => {
    loadStories()
    listNpcs().then(setNpcs).catch(() => {})
    listItems().then(setItems).catch(() => {})
    listZones().then(setZones).catch(() => {})
  }, [])

  const loadStoryDetails = async (storyId: string, keepSceneId?: string) => {
    try {
      const ss = await listScenes(storyId)
      setScenes(ss)
      if (ss.length === 0) {
        setActiveScene(null)
        setLines([])
        setAllSceneLines({})
        setCounts({})
        return
      }
      const cc: Record<string, { lines: number; choices: number }> = {}
      const byScene: Record<string, any[]> = {}
      const allChoices: Record<string, any[]> = {}
      await Promise.all(
        ss.map(async (sc: any) => {
          try {
            const ls = await listLines(sc.id)
            byScene[sc.id] = ls
            let ch = 0
            await Promise.all(
              ls.map(async (l: any) => {
                try {
                  const cs = await listChoices(l.id)
                  allChoices[l.id] = cs
                  ch += cs.length
                } catch {
                  allChoices[l.id] = []
                }
              }),
            )
            cc[sc.id] = { lines: ls.length, choices: ch }
          } catch {
            byScene[sc.id] = []
            cc[sc.id] = { lines: 0, choices: 0 }
          }
        }),
      )
      setAllSceneLines(byScene)
      setChoices(allChoices)
      setCounts(cc)
      const target = (keepSceneId && ss.find((s: any) => s.id === keepSceneId)) || ss[0]
      setActiveScene(target)
      setLines(byScene[target.id] || [])
    } catch {
      setScenes([])
    }
  }

  const selectStory = (s: any) => {
    setActiveStory(s)
    setActiveScene(null)
    setLines([])
    setChoices({})
    setCounts({})
    loadStoryDetails(s.id)
  }

  const selectScene = (sc: any) => {
    setActiveScene(sc)
    if (allSceneLines[sc.id]) {
      setLines(allSceneLines[sc.id])
    } else {
      listLines(sc.id)
        .then((ls) => {
          setLines(ls)
          setAllSceneLines((prev) => ({ ...prev, [sc.id]: ls }))
          ls.forEach((l: any) =>
            listChoices(l.id)
              .then((c) => setChoices((prev) => ({ ...prev, [l.id]: c })))
              .catch(() => {}),
          )
        })
        .catch(() => setLines([]))
    }
  }

  const refresh = () => {
    loadStories()
    if (activeStory) {
      loadStoryDetails(activeStory.id, activeScene?.id)
    }
  }

  const run = (fn: () => Promise<any>) =>
    startTransition(() =>
      fn()
        .then(refresh)
        .catch((e) => alert('Falha: ' + (e?.message || e))),
    )

  const toggleLineCollapse = (lineId: string) => {
    setCollapsedLines((prev) => ({ ...prev, [lineId]: !prev[lineId] }))
  }

  const setAllLinesCollapsed = (collapsed: boolean) => {
    const next: Record<string, boolean> = { ...collapsedLines }
    for (const l of lines) {
      next[l.id] = collapsed
    }
    setCollapsedLines(next)
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-amber-400">
            <BookOpen size={22} /> Histórias (Visual Novel)
          </h2>
          <p className="text-sm text-muted-foreground">
            História → Cenas (fundo) → Falas (NPC/Herói/Narrador) → Opções (pulo para fala/cena e liberação de áreas)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeStory && (
            <>
              <button
                onClick={() => setTesting(activeStory)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium inline-flex items-center gap-2 shadow"
              >
                <Play size={16} /> Testar história (Preview)
              </button>
              <button
                onClick={() => {
                  setEditingStory(activeStory)
                  setStoryForm({
                    slug: activeStory.slug,
                    name: activeStory.name,
                    description: activeStory.description || '',
                    cover_url: activeStory.cover_url || '',
                    lore_reward: activeStory.lore_reward ?? 0,
                    is_active: activeStory.is_active,
                    sort_order: activeStory.sort_order ?? 0,
                  })
                  setShowStoryForm(true)
                }}
                className="px-3.5 py-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 rounded-lg inline-flex items-center gap-1.5 text-sm hover:bg-amber-500/20"
              >
                <Pencil size={14} /> Editar história
              </button>
              <button
                onClick={() => {
                  if (confirm('Excluir esta história e todas as cenas/falas?'))
                    run(async () => {
                      await deleteStory(activeStory.id)
                      setActiveStory(null)
                      setScenes([])
                      setLines([])
                    })
                }}
                className="px-3 py-2 border border-red-500/40 bg-red-500/10 text-red-400 rounded-lg inline-flex items-center gap-1 text-sm hover:bg-red-500/20"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => {
              setEditingStory(null)
              setStoryForm({
                slug: '',
                name: '',
                description: '',
                cover_url: '',
                lore_reward: 0,
                is_active: true,
                sort_order: 0,
              })
              setShowStoryForm(true)
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg inline-flex items-center gap-2 font-medium"
          >
            <Plus size={16} /> Nova História
          </button>
        </div>
      </div>

      {/* Formulário de História */}
      {showStoryForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(async () => {
              const fd = new FormData(e.target as HTMLFormElement)
              if (editingStory) await updateStory(editingStory.id, fd)
              else await createStory(fd)
              setShowStoryForm(false)
              setEditingStory(null)
            })
          }}
          className="border-2 border-amber-500/40 bg-amber-950/10 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-base font-semibold text-amber-300">
            {editingStory ? `Editando história: ${editingStory.name}` : 'Nova História'}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-sm">
                Slug <Tooltip text="Identificador único. Ex.: prologo_heroi" />
              </label>
              <input
                name="slug"
                defaultValue={storyForm.slug}
                className="w-full border rounded px-2.5 py-1.5 bg-background"
                required
              />
            </div>
            <div>
              <label className="text-sm">Nome</label>
              <input
                name="name"
                defaultValue={storyForm.name}
                className="w-full border rounded px-2.5 py-1.5 bg-background"
                required
              />
            </div>
            <div>
              <label className="text-sm">Ordem</label>
              <input
                name="sort_order"
                type="number"
                defaultValue={storyForm.sort_order}
                className="w-full border rounded px-2.5 py-1.5 bg-background"
              />
            </div>
            <div>
              <label className="text-sm">
                Lore ao concluir{' '}
                <Tooltip text="Pontos de lore pagos 1 vez por jogador ao terminar a história (gasta na Constelação). 0 = sem prêmio." />
              </label>
              <input
                name="lore_reward"
                type="number"
                min={0}
                defaultValue={storyForm.lore_reward}
                className="w-full border rounded px-2.5 py-1.5 bg-background"
              />
            </div>
          </div>
          <ImageUpload
            label="Capa da história"
            fieldName="cover_url"
            tooltipText="Imagem de capa 16:9 exibida na lista de histórias do app."
            folder="stories"
            value={storyForm.cover_url}
            onChange={(url) => setStoryForm({ ...storyForm, cover_url: url })}
            hint="JPG ou PNG 1280x720 (limite 1920px)"
            maxSize={1920}
            accept="image/png,image/jpeg,image/webp"
          />
          <div>
            <label className="text-sm">Descrição</label>
            <textarea
              name="description"
              defaultValue={storyForm.description}
              className="w-full border rounded px-2.5 py-1.5 bg-background"
            />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_active" defaultChecked={storyForm.is_active} /> Ativa
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => setShowStoryForm(false)}
              className="px-4 py-2 border rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Busca e contadores */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Pesquisar história..." />
        <Counters total={stories.length} active={activeStories} shown={storyList.length} totalLabel="histórias" />
      </div>

      {/* Cards de Histórias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {storyList.map((s, si) => {
          const isSelected = activeStory?.id === s.id
          return (
            <button
              key={s.id}
              onClick={() => selectStory(s)}
              className={`border-2 rounded-xl p-3.5 text-left transition flex items-center gap-3 ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/10 shadow-lg'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-amber-500/50'
              }`}
            >
              {s.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.cover_url}
                  alt={s.name}
                  className="w-14 h-14 rounded-lg object-cover border border-zinc-700 flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <BookOpen size={22} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-base truncate text-zinc-100">
                  <span className="text-amber-400 font-bold mr-1.5">#{si + 1}</span>
                  {s.name}
                </div>
                <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-1.5 mt-1">
                  <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{s.slug}</code>
                  {Number(s.lore_reward) > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1">
                      <Sparkles size={10} /> +{s.lore_reward} Lore
                    </span>
                  )}
                  {!s.is_active && (
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">Inativa</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {stories.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma história ainda. Crie a primeira (ex.: Prólogo).</p>
      )}

      {/* CENAS E FALAS DA HISTÓRIA ATIVA */}
      {activeStory && (
        <div className="border-t border-zinc-800 pt-6 space-y-5">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 text-indigo-300">
                <Layers size={18} /> Cenas de “{activeStory.name}” ({scenes.length})
              </h3>
              <p className="text-xs text-zinc-400">
                Cada cena tem um fundo e suas falas em ordem. As opções podem pular para qualquer fala desta cena ou para outra cena da história.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingScene(null)
                setSceneForm({ order_index: scenes.length, title: '', background_url: '' })
                setShowSceneForm(true)
              }}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium inline-flex items-center gap-1.5"
            >
              <Plus size={15} /> Nova Cena
            </button>
          </div>

          {showSceneForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                run(async () => {
                  const fd = new FormData()
                  fd.set('story_id', activeStory.id)
                  fd.set('order_index', String(sceneForm.order_index))
                  fd.set('title', sceneForm.title)
                  fd.set('background_url', sceneForm.background_url)
                  if (editingScene) await updateScene(editingScene.id, fd)
                  else await createScene(fd)
                  setShowSceneForm(false)
                  setEditingScene(null)
                })
              }}
              className="border-2 border-indigo-500/40 bg-indigo-950/20 rounded-xl p-4 space-y-3"
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm">
                    Ordem <Tooltip text="0 = primeira cena. O app segue esta ordem salvo quando uma escolha pula." />
                  </label>
                  <input
                    type="number"
                    value={sceneForm.order_index}
                    onChange={(e) => setSceneForm({ ...sceneForm, order_index: Number(e.target.value) })}
                    className="w-full border rounded px-2.5 py-1.5 bg-background"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm">Título da cena</label>
                  <input
                    value={sceneForm.title}
                    onChange={(e) => setSceneForm({ ...sceneForm, title: e.target.value })}
                    className="w-full border rounded px-2.5 py-1.5 bg-background"
                    placeholder="Ex.: A taverna / Portão da Vila"
                  />
                </div>
              </div>
              <ImageUpload
                label="Fundo da cena"
                fieldName="background_url"
                tooltipText="Imagem de fundo 16:9 atrás do NPC e da caixa de diálogo."
                folder="stories"
                value={sceneForm.background_url}
                onChange={(url) => setSceneForm({ ...sceneForm, background_url: url })}
                hint="JPG ou PNG 1280x720 (limite 1920px)"
                maxSize={1920}
                accept="image/png,image/jpeg,image/webp"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50"
                >
                  Salvar cena
                </button>
                <button
                  type="button"
                  onClick={() => setShowSceneForm(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Lista de Cenas */}
          <div className="space-y-4">
            {scenes.map((sc) => {
              const isSceneOpen = activeScene?.id === sc.id
              return (
                <div
                  key={sc.id}
                  className={`border-2 rounded-xl overflow-hidden transition ${
                    isSceneOpen
                      ? 'border-indigo-500/60 bg-zinc-900/80 shadow-xl'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-indigo-500/40'
                  }`}
                >
                  {/* Barra da Cena */}
                  <div className="flex justify-between items-center px-4 py-3 bg-indigo-950/30 border-b border-zinc-800/80">
                    <button
                      onClick={() => selectScene(sc)}
                      className="font-semibold text-left flex items-center gap-2.5 text-indigo-200 hover:text-white"
                    >
                      {isSceneOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      {sc.background_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sc.background_url}
                          alt={sc.title || ''}
                          className="w-10 h-6 object-cover rounded border border-indigo-400/40"
                        />
                      )}
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
                        Cena #{sc.order_index}
                      </span>
                      <span className="text-base text-zinc-100">{sc.title || '(sem título)'}</span>
                      {counts[sc.id] && (
                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {counts[sc.id].lines} fala(s) • {counts[sc.id].choices} opção(ões)
                        </span>
                      )}
                    </button>
                    <div className="flex gap-3 text-xs">
                      <button
                        onClick={() => {
                          setEditingScene(sc)
                          setSceneForm({
                            order_index: sc.order_index,
                            title: sc.title || '',
                            background_url: sc.background_url || '',
                          })
                          setShowSceneForm(true)
                        }}
                        className="px-2.5 py-1 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 inline-flex items-center gap-1"
                      >
                        <Pencil size={12} /> Editar cena
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Excluir cena e todas as falas?')) run(() => deleteScene(sc.id))
                        }}
                        className="px-2.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  {/* Falas da Cena */}
                  {isSceneOpen && (
                    <div className="p-4 space-y-3">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-sm flex items-center gap-1.5 text-amber-300">
                            <MessageSquare size={15} /> Falas desta Cena ({lines.length})
                          </h4>
                          {lines.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <button
                                type="button"
                                onClick={() => setAllLinesCollapsed(true)}
                                className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 inline-flex items-center gap-1"
                              >
                                <ChevronsUpDown size={12} /> Minimizar todas
                              </button>
                              <button
                                type="button"
                                onClick={() => setAllLinesCollapsed(false)}
                                className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 inline-flex items-center gap-1"
                              >
                                <ChevronsUpDown size={12} /> Expandir todas
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingLine(null)
                            setLineForm({
                              order_index: lines.length,
                              speaker_type: 'npc',
                              speaker_name: '',
                              npc_id: '',
                              text: '',
                              portrait_url: '',
                              unlock_zone_id: '',
                              only_via_choice: false,
                            })
                            setShowLineForm(true)
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium inline-flex items-center gap-1"
                        >
                          <Plus size={13} /> Nova Fala
                        </button>
                      </div>

                      {/* Formulário de Fala */}
                      {showLineForm && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            run(async () => {
                              const fd = new FormData()
                              fd.set('scene_id', sc.id)
                              fd.set('order_index', String(lineForm.order_index))
                              fd.set('speaker_type', lineForm.speaker_type)
                              fd.set('speaker_name', lineForm.speaker_name)
                              fd.set('npc_id', lineForm.npc_id)
                              fd.set('text', lineForm.text)
                              fd.set('portrait_url', lineForm.portrait_url)
                              fd.set('unlock_zone_id', lineForm.unlock_zone_id)
                              fd.set('only_via_choice', lineForm.only_via_choice ? 'on' : '')
                              if (editingLine) await updateLine(editingLine.id, fd)
                              else await createLine(fd)
                              setShowLineForm(false)
                              setEditingLine(null)
                            })
                          }}
                          className="border-2 border-amber-500/50 rounded-xl p-4 space-y-3 bg-amber-950/20"
                        >
                          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                            {editingLine ? `Editando Fala #${editingLine.order_index}` : 'Nova Fala'}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                            <div>
                              <label className="text-xs text-zinc-300">Ordem</label>
                              <input
                                type="number"
                                value={lineForm.order_index}
                                onChange={(e) => setLineForm({ ...lineForm, order_index: Number(e.target.value) })}
                                className="w-full border rounded px-2 py-1.5 bg-zinc-900 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-300">
                                Quem fala{' '}
                                <Tooltip text="Narrador = texto corrido. NPC = usa retrato do NPC. Jogador = fala do herói." />
                              </label>
                              <select
                                value={lineForm.speaker_type}
                                onChange={(e) => setLineForm({ ...lineForm, speaker_type: e.target.value })}
                                className="w-full border rounded px-2 py-1.5 bg-zinc-900 text-sm"
                              >
                                {Object.entries(SPEAKERS).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-zinc-300">NPC</label>
                              <select
                                value={lineForm.npc_id}
                                onChange={(e) => setLineForm({ ...lineForm, npc_id: e.target.value })}
                                className="w-full border rounded px-2 py-1.5 bg-zinc-900 text-sm"
                              >
                                <option value="">—</option>
                                {npcs.map((n) => (
                                  <option key={n.id} value={n.id}>
                                    {n.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-zinc-300">Nome exibido (opcional)</label>
                              <input
                                value={lineForm.speaker_name}
                                onChange={(e) => setLineForm({ ...lineForm, speaker_name: e.target.value })}
                                className="w-full border rounded px-2 py-1.5 bg-zinc-900 text-sm"
                                placeholder="Ex.: ???"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-emerald-300">
                                Libera Zona / Cidade{' '}
                                <Tooltip text="Ao exibir esta fala na história, libera esta zona (mapa/cidade/arena) para o herói ativo do jogador." />
                              </label>
                              <select
                                value={lineForm.unlock_zone_id}
                                onChange={(e) => setLineForm({ ...lineForm, unlock_zone_id: e.target.value })}
                                className="w-full border border-emerald-500/40 rounded px-2 py-1.5 bg-zinc-900 text-sm"
                              >
                                <option value="">Nenhuma</option>
                                {zones.map((z) => (
                                  <option key={z.id} value={z.id}>
                                    {z.name}
                                    {z.starter ? ' (Inicial)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-300">Texto da fala</label>
                            <textarea
                              value={lineForm.text}
                              onChange={(e) => setLineForm({ ...lineForm, text: e.target.value })}
                              className="w-full border rounded px-3 py-2 bg-zinc-900 text-sm"
                              rows={4}
                              required
                            />
                          </div>
                          <ImageUpload
                            label="Retrato da fala (opcional)"
                            fieldName="portrait_url"
                            tooltipText="Se vazio e houver NPC, o app usa o retrato do NPC."
                            folder="stories"
                            value={lineForm.portrait_url}
                            onChange={(url) => setLineForm({ ...lineForm, portrait_url: url })}
                            hint="PNG retrato (opcional, saída 512×512)"
                            forceSize={512}
                          />
                          <label className="flex items-center gap-2 pt-1 text-sm text-amber-200">
                            <input
                              type="checkbox"
                              name="only_via_choice"
                              checked={lineForm.only_via_choice}
                              onChange={(e) => setLineForm({ ...lineForm, only_via_choice: e.target.checked })}
                              className="w-4 h-4 rounded border-amber-500/40 bg-zinc-900 accent-amber-500"
                            />
                            <span>Somente aparece via opção (oculta do fluxo normal / automático da história)</span>
                            <Tooltip text="Se marcado, esta fala nunca entra na listagem sequencial automática da cena; ela só será exibida se o jogador clicar em uma opção de escolha que aponte para ela." />
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={isPending}
                              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                              {editingLine ? 'Atualizar fala' : 'Salvar fala'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowLineForm(false)
                                setEditingLine(null)
                              }}
                              className="px-4 py-1.5 border rounded-lg text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Cards das Falas (com suporte a minimizar/expandir) */}
                      <div className="space-y-2.5">
                        {lines.map((l) => {
                          const style = SPEAKER_STYLES[l.speaker_type] || SPEAKER_STYLES.narrator
                          const lineChoices = choices[l.id] || []
                          const isCollapsed = Boolean(collapsedLines[l.id])
                          const speakerLabel =
                            l.npcs?.name ||
                            npcs.find((n) => n.id === l.npc_id)?.name ||
                            l.speaker_name ||
                            SPEAKERS[l.speaker_type] ||
                            l.speaker_type

                          return (
                            <div
                              key={l.id}
                              className={`border rounded-xl transition overflow-hidden ${style.card}`}
                            >
                              {/* Cabeçalho da Fala (sempre visível; clique minimiza/expande) */}
                              <div className="flex justify-between items-center gap-2 px-3.5 py-2.5">
                                <button
                                  type="button"
                                  onClick={() => toggleLineCollapse(l.id)}
                                  className="flex-1 min-w-0 text-left flex items-center gap-2"
                                >
                                  {isCollapsed ? (
                                    <ChevronRight size={15} className="text-zinc-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown size={15} className="text-zinc-400 flex-shrink-0" />
                                  )}
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-bold flex-shrink-0">
                                    Fala #{l.order_index}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${style.badge}`}>
                                    {SPEAKERS[l.speaker_type] || l.speaker_type}
                                    {speakerLabel && speakerLabel !== SPEAKERS[l.speaker_type]
                                      ? `: ${speakerLabel}`
                                      : ''}
                                  </span>
                                  {l.unlock_zone_id && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs inline-flex items-center gap-1 flex-shrink-0">
                                      <MapPin size={11} /> Libera: {zoneName(l.unlock_zone_id)}
                                    </span>
                                  )}
                                  {lineChoices.length > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs inline-flex items-center gap-1 flex-shrink-0">
                                      <GitBranch size={11} /> {lineChoices.length} opção(ões)
                                    </span>
                                  )}
                                  <span className="text-xs text-zinc-300 truncate ml-1">
                                    “{l.text}”
                                  </span>
                                </button>

                                <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => toggleLineCollapse(l.id)}
                                    className="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800"
                                  >
                                    {isCollapsed ? 'Expandir' : 'Minimizar'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingLine(l)
                                      setLineForm({
                                        order_index: l.order_index,
                                        speaker_type: l.speaker_type,
                                        speaker_name: l.speaker_name || '',
                                        npc_id: l.npc_id || '',
                                        text: l.text,
                                        portrait_url: l.portrait_url || '',
                                        unlock_zone_id: l.unlock_zone_id || '',
                                        only_via_choice: Boolean(l.only_via_choice),
                                      })
                                      setShowLineForm(true)
                                    }}
                                    className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 inline-flex items-center gap-1"
                                  >
                                    <Pencil size={11} /> Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Excluir fala e escolhas?')) run(() => deleteLine(l.id))
                                    }}
                                    className="px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </div>

                              {/* Corpo expandido da Fala + Opções do Jogador */}
                              {!isCollapsed && (
                                <div className="px-4 pb-3.5 pt-2 border-t border-zinc-800/60 space-y-3 bg-zinc-950/40">
                                  <p className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed bg-zinc-900/80 border border-zinc-800 rounded-lg p-3">
                                    {l.text}
                                  </p>

                                  {/* Painel de Opções desta Fala */}
                                  <div className="pl-2 space-y-2">
                                    {lineChoices.map((c) => (
                                      <div
                                        key={c.id}
                                        className="flex flex-wrap justify-between items-center gap-2 text-xs bg-cyan-950/25 border border-cyan-500/35 rounded-lg px-3 py-2"
                                      >
                                        <span className="flex flex-wrap items-center gap-2">
                                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                                            Opção #{c.sort_order ?? 0}
                                          </span>
                                          <strong className="text-sm text-zinc-100">“{c.label}”</strong>
                                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-300 inline-flex items-center gap-1">
                                            <GitBranch size={11} /> → {destinationLabel(c)}
                                          </span>
                                          {c.unlock_zone_id && (
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                                              <MapPin size={10} /> Libera: {zoneName(c.unlock_zone_id)}
                                            </span>
                                          )}
                                          {Number(c.reward_xp) > 0 && (
                                            <span className="text-zinc-300">• +{c.reward_xp} XP</span>
                                          )}
                                          {c.items?.name && (
                                            <span className="text-zinc-300">
                                              • {c.reward_qty}x {c.items.name}
                                            </span>
                                          )}
                                        </span>
                                        <span className="flex gap-2 flex-shrink-0">
                                          <button
                                            onClick={() => {
                                              setEditingChoice(c)
                                              const dest = c.next_line_id
                                                ? `line:${c.next_line_id}`
                                                : c.next_scene_id
                                                  ? `scene:${c.next_scene_id}`
                                                  : ''
                                              setChoiceForm({
                                                line_id: l.id,
                                                label: c.label || '',
                                                destination: dest,
                                                unlock_zone_id: c.unlock_zone_id || '',
                                                reward_xp: c.reward_xp ?? 0,
                                                reward_item_id: c.reward_item_id || '',
                                                reward_qty: c.reward_qty ?? 1,
                                                sort_order: c.sort_order ?? 0,
                                              })
                                              setShowChoiceForm(true)
                                            }}
                                            className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 inline-flex items-center gap-1"
                                          >
                                            <Pencil size={10} /> Editar opção
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (confirm('Excluir escolha?')) run(() => deleteChoice(c.id))
                                            }}
                                            className="px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25"
                                          >
                                            Excluir
                                          </button>
                                        </span>
                                      </div>
                                    ))}

                                    {!showChoiceForm || choiceForm.line_id !== l.id ? (
                                      <button
                                        onClick={() => {
                                          setEditingChoice(null)
                                          setChoiceForm({
                                            line_id: l.id,
                                            label: '',
                                            destination: '',
                                            unlock_zone_id: '',
                                            reward_xp: 0,
                                            reward_item_id: '',
                                            reward_qty: 1,
                                            sort_order: choices[l.id]?.length || 0,
                                          })
                                          setShowChoiceForm(true)
                                        }}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 inline-flex items-center gap-1"
                                      >
                                        <Plus size={12} /> Adicionar opção do jogador
                                      </button>
                                    ) : (
                                      <form
                                        onSubmit={(e) => {
                                          e.preventDefault()
                                          run(async () => {
                                            const fd = new FormData()
                                            fd.set('line_id', l.id)
                                            fd.set('label', choiceForm.label)
                                            const dest = choiceForm.destination || ''
                                            const nextSceneId = dest.startsWith('scene:')
                                              ? dest.slice('scene:'.length)
                                              : ''
                                            const nextLineId = dest.startsWith('line:')
                                              ? dest.slice('line:'.length)
                                              : ''
                                            fd.set('next_scene_id', nextSceneId)
                                            fd.set('next_line_id', nextLineId)
                                            fd.set('unlock_zone_id', choiceForm.unlock_zone_id)
                                            fd.set('reward_xp', String(choiceForm.reward_xp))
                                            fd.set('reward_item_id', choiceForm.reward_item_id)
                                            fd.set('reward_qty', String(choiceForm.reward_qty))
                                            fd.set('sort_order', String(choiceForm.sort_order))
                                            if (editingChoice) await updateChoice(editingChoice.id, fd)
                                            else await createChoice(fd)
                                            setShowChoiceForm(false)
                                            setEditingChoice(null)
                                          })
                                        }}
                                        className="grid grid-cols-1 md:grid-cols-4 gap-3 border-2 border-cyan-500/50 rounded-xl p-3.5 bg-cyan-950/20"
                                      >
                                        <div className="md:col-span-2">
                                          <label className="text-xs text-cyan-200">
                                            Texto da opção{' '}
                                            <Tooltip text="O que o jogador lê e clica. Ex.: 'Aceitar a missão'" />
                                          </label>
                                          <input
                                            value={choiceForm.label}
                                            onChange={(e) =>
                                              setChoiceForm({ ...choiceForm, label: e.target.value })
                                            }
                                            className="w-full border rounded px-2.5 py-1.5 bg-zinc-900 text-sm"
                                            required
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs text-cyan-200">Ordem da opção</label>
                                          <input
                                            type="number"
                                            value={choiceForm.sort_order}
                                            onChange={(e) =>
                                              setChoiceForm({ ...choiceForm, sort_order: Number(e.target.value) })
                                            }
                                            className="w-full border rounded px-2.5 py-1.5 bg-zinc-900 text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs text-emerald-300">
                                            Libera Zona / Cidade{' '}
                                            <Tooltip text="Se o jogador escolher esta opção, libera esta zona para o herói ativo." />
                                          </label>
                                          <select
                                            value={choiceForm.unlock_zone_id}
                                            onChange={(e) =>
                                              setChoiceForm({ ...choiceForm, unlock_zone_id: e.target.value })
                                            }
                                            className="w-full border border-emerald-500/40 rounded px-2.5 py-1.5 bg-zinc-900 text-sm"
                                          >
                                            <option value="">Nenhuma</option>
                                            {zones.map((z) => (
                                              <option key={z.id} value={z.id}>
                                                {z.name}
                                                {z.starter ? ' (Inicial)' : ''}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* Seletor completo: mostra TODAS as falas da cena atual + TODAS as cenas da história e suas falas */}
                                        <div className="md:col-span-4">
                                          <label className="text-xs text-amber-300 font-semibold">
                                            Pula para Fala ou Cena desta História{' '}
                                            <Tooltip text="Escolha para qual Fala desta cena ou para qual Cena/Fala desta história o jogador vai ao clicar nesta opção." />
                                          </label>
                                          <select
                                            value={choiceForm.destination}
                                            onChange={(e) =>
                                              setChoiceForm({ ...choiceForm, destination: e.target.value })
                                            }
                                            className="w-full border border-amber-500/50 rounded px-2.5 py-1.5 bg-zinc-900 text-sm"
                                          >
                                            <option value="">
                                              Continua… (segue para a próxima fala na ordem normal)
                                            </option>

                                            <optgroup
                                              label={`── Falas desta Cena (#${sc.order_index} ${sc.title || 'Cena atual'}) ──`}
                                            >
                                              {lines.map((fl: any) => (
                                                <option key={`line-${fl.id}`} value={`line:${fl.id}`}>
                                                  Fala #{fl.order_index} [
                                                  {SPEAKERS[fl.speaker_type] || fl.speaker_type}
                                                  {fl.npcs?.name ? `: ${fl.npcs.name}` : ''}]: “
                                                  {String(fl.text || '').slice(0, 70)}
                                                  {String(fl.text || '').length > 70 ? '…' : ''}”
                                                  {fl.id === l.id ? ' (fala atual)' : ''}
                                                </option>
                                              ))}
                                            </optgroup>

                                            <optgroup label="── Cenas desta História (início da cena) ──">
                                              {scenes.map((s: any) => (
                                                <option key={`scene-${s.id}`} value={`scene:${s.id}`}>
                                                  Cena #{s.order_index} — {s.title || '(sem título)'} (
                                                  {counts[s.id]?.lines ?? 0} fala(s))
                                                  {s.id === sc.id ? ' [Cena atual]' : ''}
                                                </option>
                                              ))}
                                            </optgroup>

                                            {scenes
                                              .filter((s: any) => s.id !== sc.id && (allSceneLines[s.id]?.length || 0) > 0)
                                              .map((s: any) => (
                                                <optgroup
                                                  key={`other-scene-lines-${s.id}`}
                                                  label={`── Falas da Cena #${s.order_index} (${s.title || 'sem título'}) ──`}
                                                >
                                                  {(allSceneLines[s.id] || []).map((fl: any) => (
                                                    <option key={`line-${fl.id}`} value={`line:${fl.id}`}>
                                                      Cena #{s.order_index} → Fala #{fl.order_index} [
                                                      {SPEAKERS[fl.speaker_type] || fl.speaker_type}]: “
                                                      {String(fl.text || '').slice(0, 65)}
                                                      {String(fl.text || '').length > 65 ? '…' : ''}”
                                                    </option>
                                                  ))}
                                                </optgroup>
                                              ))}
                                          </select>
                                        </div>

                                        <div>
                                          <label className="text-xs text-zinc-300">Recompensa XP</label>
                                          <input
                                            type="number"
                                            value={choiceForm.reward_xp}
                                            onChange={(e) =>
                                              setChoiceForm({ ...choiceForm, reward_xp: Number(e.target.value) })
                                            }
                                            className="w-full border rounded px-2.5 py-1.5 bg-zinc-900 text-sm"
                                          />
                                        </div>
                                        <div className="md:col-span-2">
                                          <label className="text-xs text-zinc-300">Item recompensa</label>
                                          <select
                                            value={choiceForm.reward_item_id}
                                            onChange={(e) =>
                                              setChoiceForm({ ...choiceForm, reward_item_id: e.target.value })
                                            }
                                            className="w-full border rounded px-2.5 py-1.5 bg-zinc-900 text-sm"
                                          >
                                            <option value="">Nenhum</option>
                                            {items.map((i) => (
                                              <option key={i.id} value={i.id}>
                                                {i.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-xs text-zinc-300">Qtd</label>
                                          <input
                                            type="number"
                                            value={choiceForm.reward_qty}
                                            onChange={(e) =>
                                              setChoiceForm({ ...choiceForm, reward_qty: Number(e.target.value) })
                                            }
                                            className="w-full border rounded px-2.5 py-1.5 bg-zinc-900 text-sm"
                                          />
                                        </div>
                                        <div className="md:col-span-4 flex gap-2 items-center pt-1">
                                          <button
                                            type="submit"
                                            disabled={isPending}
                                            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                                          >
                                            {editingChoice ? 'Atualizar opção' : 'Salvar opção'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowChoiceForm(false)
                                              setEditingChoice(null)
                                            }}
                                            className="px-4 py-1.5 border rounded-lg text-xs"
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                      </form>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {lines.length === 0 && (
                          <p className="text-xs text-muted-foreground">Sem falas nesta cena ainda.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {testing && (
        <StoryTester
          story={testing}
          npcs={npcs}
          zones={zones}
          onClose={() => setTesting(null)}
        />
      )}
    </div>
  )
}
