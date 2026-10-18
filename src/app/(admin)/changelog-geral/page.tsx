'use client'

import { useEffect, useState } from 'react'
import {
  listChangelogEntries, createChangelogEntryGeneral,
  updateChangelogEntryGeneral, deleteChangelogEntryGeneral,
} from '@/lib/actions/changelog-entries'

export default function ChangelogGeralPage() {
  const [items, setItems] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { setItems(await listChangelogEntries()) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-amber-400">Changelog Geral (Admin)</h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target as HTMLFormElement)
          if (editing) await updateChangelogEntryGeneral(editing.id, fd)
          else await createChangelogEntryGeneral(fd)
          ;(e.target as HTMLFormElement).reset()
          setEditing(null)
          await load()
        }}
        className="border-2 border-amber-500/30 rounded-xl p-5 space-y-3 bg-amber-950/10"
      >
        <h3 className="font-semibold text-amber-300">{editing ? 'Editar entrada' : 'Nova entrada'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Versão</label>
            <input name="version" defaultValue={editing?.version || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" placeholder="v0.3.0" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm">Título</label>
            <input name="title" required defaultValue={editing?.title || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
        </div>
        <div>
          <label className="text-sm">Descrição técnica</label>
          <textarea name="body_technical" rows={4} defaultValue={editing?.body_technical || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
        </div>
        <div>
          <label className="text-sm">Descrição para o jogador</label>
          <textarea name="body_user" rows={4} defaultValue={editing?.body_user || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Categoria</label>
            <select name="category" defaultValue={editing?.category || 'feature'} className="w-full border rounded px-2.5 py-1.5 bg-background">
              <option value="feature">Feature</option>
              <option value="fix">Fix</option>
              <option value="balance">Balanceamento</option>
              <option value="migration">Migration</option>
              <option value="content">Conteúdo</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Data de publicação</label>
            <input type="datetime-local" name="published_at" defaultValue={editing?.published_at?.slice(0,16) || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div className="flex flex-col gap-2 self-end">
            <label className="flex items-center gap-2"><input type="checkbox" name="affects_app" defaultChecked={editing ? editing.affects_app : false} /> Afeta app</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="requires_migration" defaultChecked={editing ? editing.requires_migration : false} /> Requer migration</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="is_published" defaultChecked={editing ? editing.is_published : true} /> Publicado</label>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">{editing ? 'Salvar' : 'Criar'}</button>
          {editing && <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>}
        </div>
      </form>

      <div className="space-y-2">
        <h3 className="font-semibold text-zinc-300">Entradas cadastradas</h3>
        {loading && <p className="text-sm text-zinc-400">Carregando…</p>}
        {items.map((it) => (
          <div key={it.id} className="border rounded-lg p-3 flex flex-wrap justify-between gap-3 bg-zinc-900/60">
            <div className="min-w-0">
              <div className="font-semibold text-zinc-100">
                {it.title} {it.version ? <span className="text-xs text-amber-300">({it.version})</span> : null}
                {it.is_published ? <span className="text-xs text-emerald-300 ml-2">• PUBLICADO</span> : null}
              </div>
              <div className="text-xs text-zinc-500">{new Date(it.published_at).toLocaleString()} • {it.category}{it.affects_app ? ' • afeta app' : ''}{it.requires_migration ? ' • requer migration' : ''}</div>
              {it.body_technical && <p className="text-xs text-zinc-300 mt-1 whitespace-pre-wrap max-w-[80ch]"><strong>Técnico:</strong> {it.body_technical}</p>}
              {it.body_user && <p className="text-xs text-zinc-300 mt-1 whitespace-pre-wrap max-w-[80ch]"><strong>Jogador:</strong> {it.body_user}</p>}
            </div>
            <div className="flex gap-2 items-start">
              <button onClick={() => setEditing(it)} className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs">Editar</button>
              <button onClick={async () => { if (confirm('Excluir?')) { await deleteChangelogEntryGeneral(it.id); await load() } }} className="px-2.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-xs">Excluir</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-zinc-500">Nenhuma entrada cadastrada.</p>}
      </div>
    </div>
  )
}