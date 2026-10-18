'use client'

import { useEffect, useState } from 'react'
import {
  listQuests, listQuestTypes, listRewardChests,
  createQuest, updateQuest, deleteQuest, toggleQuest, createQuestType, deleteQuestType, createRewardChest, deleteRewardChest,
} from '@/lib/actions/quests'
import { ImageUpload } from '@/components/ui/image-upload'

export default function QuestsPage() {
  const [quests, setQuests] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [chests, setChests] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [iconUrl, setIconUrl] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setQuests(await listQuests())
      setTypes(await listQuestTypes())
      setChests(await listRewardChests())
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setIconUrl(editing?.icon_url || '') }, [editing])

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-amber-400">Quests</h2>

      {/* Tipos de quest */}
      <details className="border rounded-xl p-4 bg-zinc-900/60">
        <summary className="cursor-pointer text-amber-300 font-semibold">Tipos de Quest</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.target as HTMLFormElement)
            await createQuestType(fd)
            ;(e.target as HTMLFormElement).reset()
            await load()
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3"
        >
          <input name="name" placeholder="Nome" required className="border rounded px-2.5 py-1.5 bg-background" />
          <input name="slug" placeholder="slug" required className="border rounded px-2.5 py-1.5 bg-background" />
          <input name="icon_url" placeholder="Ícone URL" className="border rounded px-2.5 py-1.5 bg-background" />
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Criar tipo</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {types.map((t) => (
            <div key={t.id} className="flex items-center gap-2 border rounded-lg px-2.5 py-1.5 bg-zinc-800/60">
              {t.icon_url && <img src={t.icon_url} alt={t.name} className="w-6 h-6 object-contain" />}
              <span className="text-xs text-zinc-200">{t.name}</span>
              <button onClick={async () => { if (confirm('Excluir tipo?')) { await deleteQuestType(t.id); await load() } }} className="text-xs text-red-300">✕</button>
            </div>
          ))}
        </div>
      </details>

      {/* Baús */}
      <details className="border rounded-xl p-4 bg-zinc-900/60">
        <summary className="cursor-pointer text-amber-300 font-semibold">Baús de Recompensa</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.target as HTMLFormElement)
            await createRewardChest(fd)
            ;(e.target as HTMLFormElement).reset()
            await load()
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3"
        >
          <input name="name" placeholder="Nome" required className="border rounded px-2.5 py-1.5 bg-background" />
          <input name="slug" placeholder="slug" required className="border rounded px-2.5 py-1.5 bg-background" />
          <input name="icon_url" placeholder="Ícone URL" className="border rounded px-2.5 py-1.5 bg-background" />
          <input name="rewards" placeholder='[{"type":"gold","amount":100}]' className="border rounded px-2.5 py-1.5 bg-background" />
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Criar baú</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {chests.map((c) => (
            <div key={c.id} className="flex items-center gap-2 border rounded-lg px-2.5 py-1.5 bg-zinc-800/60">
              {c.icon_url && <img src={c.icon_url} alt={c.name} className="w-6 h-6 object-contain" />}
              <span className="text-xs text-zinc-200">{c.name}</span>
              <button onClick={async () => { if (confirm('Excluir baú?')) { await deleteRewardChest(c.id); await load() } }} className="text-xs text-red-300">✕</button>
            </div>
          ))}
        </div>
      </details>

      {/* Quest form */}
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target as HTMLFormElement)
          if (editing) await updateQuest(editing.id, fd)
          else await createQuest(fd)
          ;(e.target as HTMLFormElement).reset()
          setEditing(null)
          setIconUrl('')
          await load()
        }}
        className="border-2 border-amber-500/30 rounded-xl p-5 space-y-3 bg-amber-950/10"
      >
        <h3 className="font-semibold text-amber-300">{editing ? 'Editar quest' : 'Nova quest'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Nome</label>
            <input name="name" required defaultValue={editing?.name || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Slug</label>
            <input name="slug" required defaultValue={editing?.slug || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div className="md:col-span-3">
            <ImageUpload
              label="Ícone da quest"
              fieldName="icon_url"
              tooltipText="Upload do ícone; redimensionado e otimizado."
              folder="quests"
              value={iconUrl}
              onChange={setIconUrl}
              hint="PNG/JPG/WEBP. Redimensionado para 256px."
              forceSize={256}
            />
          </div>
        </div>
        <div>
          <label className="text-sm">Descrição</label>
          <textarea name="description" rows={2} defaultValue={editing?.description || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm">Tipo</label>
            <select name="quest_type_id" defaultValue={editing?.quest_type_id || ''} className="w-full border rounded px-2.5 py-1.5 bg-background">
              <option value="">—</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Objetivo</label>
            <select name="objective_type" defaultValue={editing?.objective_type || 'collect'} className="w-full border rounded px-2.5 py-1.5 bg-background">
              <option value="collect">Coleta</option>
              <option value="combat">Combate</option>
              <option value="story">História</option>
              <option value="event">Evento</option>
              <option value="manual_action">Ação manual</option>
              <option value="level">Nível</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Alvo (id/slug)</label>
            <input name="objective_target" defaultValue={editing?.objective_target || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Quantidade</label>
            <input type="number" name="objective_count" defaultValue={editing?.objective_count ?? 1} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Recorrência</label>
            <select name="recurrence" defaultValue={editing?.recurrence || 'none'} className="w-full border rounded px-2.5 py-1.5 bg-background">
              <option value="none">Única</option>
              <option value="daily">Diária</option>
              <option value="weekly">Semanal</option>
              <option value="story">História</option>
              <option value="event">Evento</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Baú de recompensa</label>
            <select name="reward_chest_id" defaultValue={editing?.reward_chest_id || ''} className="w-full border rounded px-2.5 py-1.5 bg-background">
              <option value="">Nenhum</option>
              {chests.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Gold</label>
            <input type="number" name="reward_gold" defaultValue={editing?.reward_gold ?? 0} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Gems</label>
            <input type="number" name="reward_gems" defaultValue={editing?.reward_gems ?? 0} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">XP</label>
            <input type="number" name="reward_xp" defaultValue={editing?.reward_xp ?? 0} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Ordem</label>
            <input type="number" name="sort_order" defaultValue={editing?.sort_order ?? 0} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={editing ? editing.is_active : true} /> Ativa
        </label>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">{editing ? 'Salvar' : 'Criar'}</button>
          {editing && <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>}
        </div>
      </form>

      <div className="border rounded-xl p-4 bg-zinc-900/60">
        <h3 className="font-semibold text-amber-300 mb-3">Grupos de Quest (por recorrência)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {['daily','weekly','story','event','none'].map((rec) => (
            <div key={rec} className="border rounded-lg p-3 bg-zinc-800/40">
              <div className="text-sm font-semibold text-zinc-200 mb-2 capitalize">{rec === 'none' ? 'Únicas' : rec === 'daily' ? 'Diárias' : rec === 'weekly' ? 'Semanais' : rec === 'story' ? 'História' : 'Evento'}</div>
              <div className="flex flex-wrap gap-2">
                {quests.filter((q) => q.recurrence === rec).map((q) => (
                  <div key={q.id} className="flex items-center gap-1 border rounded px-2 py-1 bg-zinc-900/60" title={q.name}>
                    {q.icon_url ? <img src={q.icon_url} alt={q.name} className="w-5 h-5 object-contain" /> : <span className="w-5 h-5 rounded bg-zinc-700" />}
                    <span className="text-[10px] text-zinc-300 truncate max-w-[80px]">{q.name}</span>
                  </div>
                ))}
                {quests.filter((q) => q.recurrence === rec).length === 0 && <span className="text-xs text-zinc-500">vazio</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-zinc-300">Quests cadastradas</h3>
        {loading && <p className="text-sm text-zinc-400">Carregando…</p>}
        {quests.map((q) => (
          <div key={q.id} className="border rounded-lg p-3 flex flex-wrap justify-between gap-3 bg-zinc-900/60">
            <div className="min-w-0">
              <div className="font-semibold text-zinc-100">
                {q.name} <span className="text-xs text-amber-300">({q.recurrence})</span>
                {q.is_active ? <span className="text-xs text-emerald-300 ml-2">• ATIVA</span> : null}
              </div>
              <div className="text-xs text-zinc-500">{q.quest_types?.name || 'sem tipo'} • {q.objective_type} x{q.objective_count}</div>
              <p className="text-xs text-zinc-300 mt-1">{q.description}</p>
            </div>
            <div className="flex gap-2 items-start">
              <button onClick={() => setEditing(q)} className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs">Editar</button>
              <button onClick={async () => { await toggleQuest(q.id, !q.is_active); await load() }} className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs">
                {q.is_active ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={async () => { if (confirm('Excluir?')) { await deleteQuest(q.id); await load() } }} className="px-2.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-xs">Excluir</button>
            </div>
          </div>
        ))}
        {quests.length === 0 && <p className="text-xs text-zinc-500">Nenhuma quest cadastrada.</p>}
      </div>
    </div>
  )
}