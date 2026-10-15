'use client'

import { useEffect, useState } from 'react'
import {
  listScenes,
  listLines,
  listChoices,
} from '@/lib/actions/stories'
import { X, RotateCcw, MapPin, Play, User, Sparkles } from 'lucide-react'

// Preview visual novel no admin: preenche a tela com o palco do NPC falando
// em cima, a caixa de texto logo abaixo e as opções bem delimitadas na base.
// Simula também as zonas/cidades liberadas por falas e escolhas.
export function StoryTester({
  story,
  npcs,
  zones = [],
  onClose,
}: {
  story: any
  npcs: any[]
  zones?: any[]
  onClose: () => void
}) {
  const [scenes, setScenes] = useState<any[]>([])
  const [linesByScene, setLinesByScene] = useState<Record<string, any[]>>({})
  const [choicesByLine, setChoicesByLine] = useState<Record<string, any[]>>({})
  const [si, setSi] = useState(0)
  const [li, setLi] = useState(0)
  const [over, setOver] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unlockedZones, setUnlockedZones] = useState<string[]>([])
  const [lastUnlockToast, setLastUnlockToast] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const ss = await listScenes(story.id)
        const lb: Record<string, any[]> = {}
        const cb: Record<string, any[]> = {}
        for (const sc of ss) {
          try {
            const ls = await listLines(sc.id)
            lb[sc.id] = ls
            for (const l of ls) {
              try {
                cb[l.id] = await listChoices(l.id)
              } catch {
                cb[l.id] = []
              }
            }
          } catch {
            lb[sc.id] = []
          }
        }
        if (!alive) return
        setScenes(ss)
        setLinesByScene(lb)
        setChoicesByLine(cb)
      } catch {
        if (alive) setScenes([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [story.id])

  const scene = scenes[si]
  const lines: any[] = scene ? linesByScene[scene.id] || [] : []
  const line = lines[li]
  const choices: any[] = line ? choicesByLine[line.id] || [] : []

  const zoneName = (zoneId?: string | null) => {
    if (!zoneId) return null
    return zones.find((z) => z.id === zoneId)?.name || 'Nova área'
  }

  const registerUnlock = (zoneId?: string | null) => {
    if (!zoneId) return
    const name = zoneName(zoneId)
    setUnlockedZones((prev) => (prev.includes(zoneId) ? prev : [...prev, zoneId]))
    if (name) {
      setLastUnlockToast(`Área liberada: ${name}!`)
    }
  }

  useEffect(() => {
    if (line?.unlock_zone_id) {
      registerUnlock(line.unlock_zone_id)
    } else {
      setLastUnlockToast(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [si, li, line?.id])

  const scenePos = (id: string) => scenes.findIndex((s) => s.id === id)

  const advance = () => {
    if (!scene) return
    if (li < lines.length - 1) {
      setLi(li + 1)
      return
    }
    if (si < scenes.length - 1) {
      setSi(si + 1)
      setLi(0)
      return
    }
    setOver(true)
  }

  const choose = (c: any) => {
    if (c.unlock_zone_id) {
      registerUnlock(c.unlock_zone_id)
    }
    if (c.next_scene_id) {
      const pos = scenePos(c.next_scene_id)
      if (pos >= 0) {
        setSi(pos)
        setLi(0)
        return
      }
    }
    advance()
  }

  const restart = () => {
    setSi(0)
    setLi(0)
    setOver(false)
    setUnlockedZones([])
    setLastUnlockToast(null)
  }

  const npcName = (l: any) =>
    l?.speaker_name ||
    l?.npcs?.name ||
    npcs.find((n) => n.id === l?.npc_id)?.name ||
    (l?.speaker_type === 'player'
      ? 'Herói (Jogador)'
      : l?.speaker_type === 'narrator'
        ? 'Narrador'
        : 'NPC')

  const portrait = (l: any) =>
    l?.portrait_url ||
    npcs.find((n) => n.id === l?.npc_id)?.portrait_url ||
    null

  const targetSceneLabel = (sceneId?: string | null) => {
    if (!sceneId) return 'continua'
    const target = scenes.find((s) => s.id === sceneId)
    return target
      ? `Cena #${target.order_index}${target.title ? ` (${target.title})` : ''}`
      : `cena …${String(sceneId).slice(0, 8)}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border-2 border-amber-500/40 rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do preview */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-amber-400">
              Preview da História: {story.name}
            </h3>
            {!loading && scene && !over && (
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Cena {si + 1}/{scenes.length}
                {scene.title ? ` — ${scene.title}` : ''} • Fala {li + 1}/{lines.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={restart}
              className="px-2.5 py-1 text-xs border border-zinc-700 rounded hover:bg-zinc-800 inline-flex items-center gap-1 text-zinc-300"
              title="Recomeçar do início"
            >
              <RotateCcw size={12} /> Recomeçar
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de áreas desbloqueadas durante o teste */}
        {unlockedZones.length > 0 && (
          <div className="px-5 py-1.5 bg-emerald-950/60 border-b border-emerald-500/30 flex flex-wrap items-center gap-2 text-xs text-emerald-300">
            <MapPin size={13} className="text-emerald-400" />
            <span className="font-medium">Áreas liberadas neste caminho:</span>
            {unlockedZones.map((zid) => (
              <span
                key={zid}
                className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-semibold"
              >
                {zoneName(zid)}
              </span>
            ))}
          </div>
        )}

        {/* Corpo principal simulando a tela inteira de História do APK */}
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Carregando cenas e falas…
          </div>
        ) : !scene || over ? (
          <div className="p-12 text-center space-y-4">
            <p className="text-xl font-bold text-amber-400">
              Fim da História{over ? '' : ' (sem conteúdo)'}
            </p>
            <p className="text-sm text-zinc-400">
              {over
                ? 'O jogador chegou ao final deste caminho da história.'
                : 'Cadastre cenas e falas para testar.'}
            </p>
            {Number(story.lore_reward) > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/15 border border-purple-500/40 text-purple-300 text-sm font-semibold">
                <Sparkles size={15} /> Recompensa de 1ª conclusão: +{story.lore_reward} pontos de Lore
              </div>
            )}
            {unlockedZones.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-zinc-400">Áreas desbloqueadas para o herói neste caminho:</p>
                <div className="flex justify-center flex-wrap gap-2">
                  {unlockedZones.map((zid) => (
                    <span
                      key={zid}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <MapPin size={12} /> {zoneName(zid)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <button
                onClick={restart}
                className="mt-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-sm inline-flex items-center gap-2"
              >
                <RotateCcw size={14} /> Jogar novamente
              </button>
            </div>
          </div>
        ) : !line ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-zinc-400">
              Cena “{scene.title || `#${scene.order_index}`}” não possui falas cadastradas.
            </p>
            <button
              onClick={advance}
              className="px-4 py-2 border border-zinc-700 rounded text-sm hover:bg-zinc-800"
            >
              Pular para próxima cena →
            </button>
          </div>
        ) : (
          <div
            className="relative flex-1 min-h-[540px] flex flex-col justify-between p-5 bg-cover bg-center select-none"
            style={
              scene.background_url
                ? { backgroundImage: `url(${scene.background_url})` }
                : undefined
            }
          >
            {/* Camada de contraste sobre o fundo */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/85 pointer-events-none" />

            {/* 1. PALCO SUPERIOR: NPC / Personagem falando preenchendo bem a área superior */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-[250px] py-2">
              {lastUnlockToast && (
                <div className="mb-3 px-3.5 py-1.5 rounded-full bg-emerald-900/90 border border-emerald-400 text-emerald-200 text-xs font-semibold shadow-lg inline-flex items-center gap-1.5">
                  <MapPin size={13} className="text-emerald-400" />
                  {lastUnlockToast}
                </div>
              )}

              {portrait(line) ? (
                <div className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={portrait(line)}
                    alt={npcName(line)}
                    className="max-h-64 w-auto object-contain rounded-2xl border-2 border-amber-500 shadow-[0_0_30px_rgba(0,0,0,0.85)] bg-zinc-900/70"
                  />
                </div>
              ) : (
                <div className="w-52 h-60 rounded-2xl border-2 border-amber-500/60 bg-zinc-900/80 shadow-2xl flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mb-3">
                    <User size={40} className="text-amber-400" />
                  </div>
                  <span className="text-sm font-bold text-amber-300">
                    {npcName(line)}
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-1">
                    {line.speaker_type === 'narrator'
                      ? 'Narração da cena'
                      : 'Sem retrato cadastrado'}
                  </span>
                </div>
              )}
            </div>

            {/* 2. TEXTO ABAIXO DO NPC + 3. OPÇÕES BEM DELIMITADAS NA BASE */}
            <div className="relative z-10 space-y-3 mt-2">
              {/* Caixa da fala */}
              <div
                onClick={choices.length === 0 ? advance : undefined}
                className={`relative rounded-xl border-2 border-amber-600/80 bg-zinc-900/95 px-5 pt-7 pb-4 shadow-2xl ${
                  choices.length === 0 ? 'cursor-pointer hover:border-amber-400' : ''
                }`}
              >
                {/* Crachá com o nome de quem fala */}
                <div className="absolute -top-3.5 left-4 px-3.5 py-1 rounded-md bg-amber-700 border border-amber-400 text-white text-xs font-bold tracking-wide shadow">
                  {npcName(line)}
                </div>

                {line.unlock_zone_id && (
                  <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
                    <MapPin size={11} /> Esta fala libera: <strong>{zoneName(line.unlock_zone_id)}</strong>
                  </div>
                )}

                <p
                  className={`text-base leading-relaxed whitespace-pre-wrap min-h-[3.5rem] ${
                    line.speaker_type === 'narrator'
                      ? 'italic text-zinc-300'
                      : 'text-zinc-100'
                  }`}
                >
                  {line.text}
                </p>

                {choices.length === 0 && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        advance()
                      }}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                    >
                      Toque para continuar →
                    </button>
                  </div>
                )}
              </div>

              {/* Opções bem delimitadas abaixo do texto */}
              {choices.length > 0 && (
                <div className="rounded-xl border-2 border-amber-500/80 bg-zinc-950/95 p-3.5 shadow-2xl space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 px-1">
                    Escolha uma opção ({choices.length})
                  </div>
                  <div className="space-y-2">
                    {choices.map((c: any, idx: number) => (
                      <button
                        key={c.id}
                        onClick={() => choose(c)}
                        className="w-full text-left px-4 py-3 rounded-lg border-2 border-amber-500/50 bg-zinc-900 hover:bg-amber-500/15 hover:border-amber-400 transition flex items-center justify-between gap-3 group"
                      >
                        <span className="flex items-center gap-2.5 text-sm font-semibold text-zinc-100 group-hover:text-amber-200">
                          <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 text-xs flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <Play size={13} className="text-amber-400 flex-shrink-0" />
                          <span>{c.label}</span>
                        </span>
                        <span className="flex items-center gap-2 flex-shrink-0 text-xs">
                          {c.unlock_zone_id && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 inline-flex items-center gap-1">
                              <MapPin size={11} /> Libera: {zoneName(c.unlock_zone_id)}
                            </span>
                          )}
                          <span className="text-zinc-400">
                            → {targetSceneLabel(c.next_scene_id)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
