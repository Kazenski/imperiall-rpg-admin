'use client'

import { useEffect, useState } from 'react'
import {
  listMarketingEvents, createMarketingEvent, updateMarketingEvent,
  deleteMarketingEvent, toggleMarketingEvent,
} from '@/lib/actions/marketing-events'
import { listItems } from '@/lib/actions/items'

export default function EventosMarketingPage() {
  const [items, setItems] = useState<any[]>([])
  const [catalogItems, setCatalogItems] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await listMarketingEvents())
      setCatalogItems(await listItems())
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-amber-400">Eventos de Marketing</h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target as HTMLFormElement)
          if (editing) await updateMarketingEvent(editing.id, fd)
          else await createMarketingEvent(fd)
          ;(e.target as HTMLFormElement).reset()
          setEditing(null)
          await load()
        }}
        className="border-2 border-amber-500/30 rounded-xl p-5 space-y-3 bg-amber-950/10"
      >
        <h3 className="font-semibold text-amber-300">{editing ? 'Editar evento' : 'Novo evento'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Nome</label>
            <input name="name" required defaultValue={editing?.name || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Slug</label>
            <input name="slug" required defaultValue={editing?.slug || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Ícone (URL)</label>
            <input name="icon_url" defaultValue={editing?.icon_url || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
        </div>
        <div>
          <label className="text-sm">Descrição</label>
          <textarea name="description" rows={3} defaultValue={editing?.description || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Início automático</label>
            <input type="datetime-local" name="auto_start_at" defaultValue={editing?.auto_start_at?.slice(0,16) || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Fim automático</label>
            <input type="datetime-local" name="auto_end_at" defaultValue={editing?.auto_end_at?.slice(0,16) || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Multiplicador de XP</label>
            <input type="number" step="0.1" name="xp_multiplier" defaultValue={editing?.xp_multiplier ?? 1} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Velocidade ações manuais</label>
            <input type="number" step="0.1" name="manual_action_speed_multiplier" defaultValue={editing?.manual_action_speed_multiplier ?? 1} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Multiplicador compra (merchant buy)</label>
            <input type="number" step="0.1" name="merchant_buy_multiplier" defaultValue={editing?.merchant_buy_multiplier ?? 1} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Multiplicador venda (merchant sell)</label>
            <input type="number" step="0.1" name="merchant_sell_multiplier" defaultValue={editing?.merchant_sell_multiplier ?? 1} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Item drop especial (mob)</label>
            <select name="mob_drop_item_id" defaultValue={editing?.mob_drop_item_id || ''} className="w-full border rounded px-2.5 py-1.5 bg-background">
              <option value="">Nenhum</option>
              {catalogItems.map((it) => (
                <option key={it.id} value={it.id}>{it.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Chance de drop (%)</label>
            <input type="number" step="0.1" name="mob_drop_chance" defaultValue={editing?.mob_drop_chance ?? 0} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
          <div>
            <label className="text-sm">Nível mínimo do mob</label>
            <input type="number" name="mob_drop_min_level" defaultValue={editing?.mob_drop_min_level ?? 1} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={editing ? editing.is_active : false} /> Ativo
        </label>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">{editing ? 'Salvar' : 'Criar'}</button>
          {editing && <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">Cancelar</button>}
        </div>
      </form>

      <div className="space-y-2">
        <h3 className="font-semibold text-zinc-300">Eventos cadastrados</h3>
        {loading && <p className="text-sm text-zinc-400">Carregando…</p>}
        {items.map((it) => (
          <div key={it.id} className="border rounded-lg p-3 flex flex-wrap justify-between gap-3 bg-zinc-900/60">
            <div className="min-w-0">
              <div className="font-semibold text-zinc-100">
                {it.name} {it.is_active ? <span className="text-xs text-emerald-300 ml-2">• ATIVO</span> : null}
              </div>
              <div className="text-xs text-zinc-500">
                {it.auto_start_at ? new Date(it.auto_start_at).toLocaleString() : 'sem início'} → {it.auto_end_at ? new Date(it.auto_end_at).toLocaleString() : 'sem fim'}
              </div>
              <p className="text-xs text-zinc-300 mt-1">{it.description}</p>
            </div>
            <div className="flex gap-2 items-start">
              <button onClick={() => setEditing(it)} className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs">Editar</button>
              <button onClick={async () => { await toggleMarketingEvent(it.id, !it.is_active); await load() }} className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs">
                {it.is_active ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={async () => { if (confirm('Excluir?')) { await deleteMarketingEvent(it.id); await load() } }} className="px-2.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-xs">Excluir</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-zinc-500">Nenhum evento cadastrado.</p>}
      </div>
    </div>
  )
}