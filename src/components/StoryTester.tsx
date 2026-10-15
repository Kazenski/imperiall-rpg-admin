'use client'

import { useEffect, useState } from 'react'
import {
  listScenes,
  listLines,
  listChoices,
} from '@/lib/actions/stories'
import { DetailModal } from '@/components/ui/detail-modal'

// Leitor de teste: joga a história aqui no admin (clique para avançar,
// escolhas clicáveis, saltos de cena). Igual ao player do app.
export function StoryTester({
  story,
  npcs,
  onClose,
}: {
  story: any
  npcs: any[]
  onClose: () => void
}) {
  const [scenes, setScenes] = useState<any[]>([])
  const [linesByScene, setLinesByScene] = useState<Record<string, any[]>>({})
  const [choicesByLine, setChoicesByLine] = useState<Record<string, any[]>>({})
  const [si, setSi] = useState(0)
  const [li, setLi] = useState(0)
  const [over, setOver] = useState(false)
  const [loading, setLoading] = useState(true)

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
  }

  const npcName = (l: any) =>
    l?.speaker_name ||
    l?.npcs?.name ||
    npcs.find((n) => n.id === l?.npc_id)?.name ||
    (l?.speaker_type === 'player' ? 'Herói (jogador)' : '···')

  const portrait = (l: any) =>
    l?.portrait_url ||
    npcs.find((n) => n.id === l?.npc_id)?.portrait_url ||
    null

  return (
    <DetailModal title={`Testando: ${story.name}`} onClose={onClose}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !scene || over ? (
        <div className="text-center py-6">
          <p className="font-semibold">Fim{over ? '' : ' (sem conteúdo)'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {over
              ? 'A história termina aqui.'
              : 'Cadastre cenas e falas para testar.'}
          </p>
          <button
            onClick={restart}
            className="mt-3 px-4 py-2 border rounded text-sm"
          >
            Recomeçar
          </button>
        </div>
      ) : !line ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            Cena “{scene.title || `#${scene.order_index}`}” sem falas.
          </p>
          <button
            onClick={advance}
            className="mt-3 px-4 py-2 border rounded text-sm"
          >
            Pular cena
          </button>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Cena {si + 1}/{scenes.length}
            {scene.title ? ` — ${scene.title}` : ''} • Fala {li + 1}/
            {lines.length}
          </p>
          <div className="flex gap-3">
            {portrait(line) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={portrait(line)}
                alt={npcName(line)}
                className="w-24 h-32 object-cover rounded border"
              />
            ) : (
              <div className="w-24 h-32 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                {line.speaker_type === 'narrator' ? 'Narrador' : 'Sem retrato'}
              </div>
            )}
            <div className="flex-1 border rounded p-3 bg-muted/30">
              <p className="text-xs font-bold text-primary mb-1">
                {npcName(line)}
              </p>
              <p className="text-sm whitespace-pre-wrap">{line.text}</p>
            </div>
          </div>
          {choices.length > 0 ? (
            <div className="mt-3 space-y-2">
              {choices.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => choose(c)}
                  className="w-full text-left px-3 py-2 border rounded text-sm hover:border-primary"
                >
                  {c.label}
                  <span className="text-xs text-muted-foreground">
                    {' '}
                    →{' '}
                    {c.next_scene_id
                      ? `cena …${String(c.next_scene_id).slice(0, 8)}`
                      : 'continua'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={advance}
              className="mt-3 w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm"
            >
              Próxima fala →
            </button>
          )}
          <button
            onClick={restart}
            className="mt-2 text-xs text-muted-foreground underline"
          >
            Recomeçar do início
          </button>
        </div>
      )}
    </DetailModal>
  )
}
