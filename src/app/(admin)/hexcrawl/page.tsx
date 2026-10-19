'use client'

import { useEffect, useState } from 'react'
import { listHexRegions, createHexRegion, updateHexRegion, deleteHexRegion, addHexResource, addHexAction } from '@/lib/actions/hexcrawl'
import { listItems } from '@/lib/actions/items'
import { listManualActions } from '@/lib/actions/manual-actions'
import { ImageUpload } from '@/components/ui/image-upload'

export default function HexcrawlPage() {
  const [regions, setRegions] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [selectedRegion, setSelectedRegion] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [bgUrl, setBgUrl] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      setRegions(await listHexRegions())
      setItems(await listItems())
      try { setActions(await listManualActions()) } catch { setActions([]) }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setBgUrl(editing?.background_url || '') }, [editing])

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-amber-400">Exploração Hex (Áreas)</h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target as HTMLFormElement)
          fd.set('background_url', bgUrl)
          if (editing) await updateHexRegion(editing.id, fd)
          else await createHexRegion(fd)
          ;(e.target as HTMLFormElement).reset()
          setEditing(null)
          setBgUrl('')
          await load()
        }}
        className="border-2 border-amber-500/30 rounded-xl p-5 space-y-3 bg-amber-950/10"
      >
        <h3 className="font-semibold text-amber-300">{editing ? 'Editar região' : 'Nova região'}</h3>
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
            <label className="text-sm">Ordem</label>
            <input type="number" name="sort_order" defaultValue={editing?.sort_order ?? 0} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
        </div>
        <div>
          <label className="text-sm">Descrição</label>
          <textarea name="description" rows={2} defaultValue={editing?.description || ''} className="w-full border rounded px-2.5 py-1.5 bg-background" />
        </div>
        <ImageUpload
          label="Background da região"
          fieldName="background_url"
          tooltipText="Imagem de fundo do hexágono."
          folder="hexcrawl"
          value={bgUrl}
          onChange={setBgUrl}
          hint="PNG/JPG/WEBP."
          forceSize={512}
        />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={editing ? editing.is_active : true} /> Ativa
        </label>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">{editing ? 'Salvar' : 'Criar'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setBgUrl('') }} className="px-4 py-2 border rounded-lg">Cancelar</button>}
        </div>
      </form>

      <div className="space-y-2">
        <h3 className="font-semibold text-zinc-300">Regiões cadastradas</h3>
        {loading && <p className="text-sm text-zinc-400">Carregando…</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {regions.map((r) => (
            <div key={r.id} onClick={() => setSelectedRegion(r)} className="border rounded-lg p-3 bg-zinc-900/60 flex gap-3 cursor-pointer hover:ring-1 hover:ring-amber-400">
              {r.background_url && <img src={r.background_url} alt={r.name} className="w-20 h-20 object-cover rounded" />}
              <div className="flex-1">
                <div className="font-semibold text-zinc-100">{r.name} {r.is_active ? <span className="text-xs text-emerald-300 ml-2">• ATIVA</span> : null}</div>
                <div className="text-xs text-zinc-500">{r.slug}</div>
                <p className="text-xs text-zinc-300 mt-1">{r.description}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditing(r)} className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs">Editar</button>
                  <button onClick={async () => { if (confirm('Excluir?')) { await deleteHexRegion(r.id); await load() } }} className="px-2.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-xs">Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {regions.length === 0 && <p className="text-xs text-zinc-500">Nenhuma região cadastrada.</p>}
      </div>
    
      {selectedRegion && (
        <div className="border rounded-xl p-4 bg-zinc-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-amber-300">Detalhes: {selectedRegion.name}</h3>
            <button onClick={() => setSelectedRegion(null)} className="text-xs text-zinc-400">Fechar</button>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-2">Recursos (1-10)</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {(selectedRegion.hex_region_resources || []).map((r: any) => (
                <span key={r.id} className="text-xs border rounded px-2 py-1 bg-zinc-800/60">
                  {r.items?.name || r.item_id} x{r.quantity}
                </span>
              ))}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target as HTMLFormElement)
                await addHexResource(selectedRegion.id, String(fd.get('item_id')), Number(fd.get('quantity') || 1))
                await load()
                const updated = (await listHexRegions()).find((r: any) => r.id === selectedRegion.id)
                setSelectedRegion(updated || selectedRegion)
              }}
              className="flex gap-2 items-end"
            >
              <select name="item_id" required className="border rounded px-2.5 py-1.5 bg-background text-sm flex-1">
                <option value="">Item</option>
                {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
              <input type="number" name="quantity" defaultValue={1} min={1} max={99} className="border rounded px-2.5 py-1.5 bg-background text-sm w-20" />
              <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">+ Recurso</button>
            </form>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-2">Ações (1-10)</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {(selectedRegion.hex_region_actions || []).map((a: any) => (
                <span key={a.id} className="text-xs border rounded px-2 py-1 bg-zinc-800/60">
                  {a.manual_actions?.name || a.manual_action_id} (x{a.uses}, cd {a.cooldown_seconds}s)
                </span>
              ))}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.target as HTMLFormElement)
                await addHexAction(selectedRegion.id, String(fd.get('action_id')), Number(fd.get('uses') || 1), Number(fd.get('cooldown') || 0))
                await load()
                const updated = (await listHexRegions()).find((r: any) => r.id === selectedRegion.id)
                setSelectedRegion(updated || selectedRegion)
              }}
              className="flex gap-2 items-end flex-wrap"
            >
              <select name="action_id" required className="border rounded px-2.5 py-1.5 bg-background text-sm flex-1 min-w-[160px]">
                <option value="">Ação</option>
                {actions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input type="number" name="uses" defaultValue={1} min={1} max={10} className="border rounded px-2.5 py-1.5 bg-background text-sm w-16" placeholder="usos" />
              <input type="number" name="cooldown" defaultValue={0} min={0} className="border rounded px-2.5 py-1.5 bg-background text-sm w-20" placeholder="cd s" />
              <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">+ Ação</button>
            </form>
          </div>
        </div>
      )}
</div>
  )
}