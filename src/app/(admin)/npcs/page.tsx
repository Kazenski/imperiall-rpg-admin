'use client'

import { useState, useEffect, useTransition } from 'react'
import { listNpcs, createNpc, updateNpc, deleteNpc } from '@/lib/actions/npcs'
import { Tooltip } from '@/components/ui/tooltip'
import { ImageUpload } from '@/components/ui/image-upload'
import { Plus, Pencil, Trash2, Eye, Users } from 'lucide-react'
import { DetailModal, DetailRow, DetailImage } from '@/components/ui/detail-modal'

const emptyForm = { slug: '', name: '', description: '', portrait_url: '', is_active: true, sort_order: 0 }

export default function NpcsPage() {
  const [npcs, setNpcs] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [viewing, setViewing] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const load = () => listNpcs().then(setNpcs).catch(() => setNpcs([]))
  useEffect(() => { load() }, [])

  const handleEdit = (n: any) => {
    setEditing(n)
    setForm({ slug: n.slug, name: n.name, description: n.description || '', portrait_url: n.portrait_url || '', is_active: n.is_active, sort_order: n.sort_order })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateNpc(editing.id, fd)
      else await createNpc(fd)
      setShowForm(false); setEditing(null); setForm(emptyForm); load()
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir este NPC? Falas que o usam perdem o vínculo.')) startTransition(() => deleteNpc(id).then(load))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Users size={20} /> NPCs</h2>
          <p className="text-sm text-muted-foreground">Personagens das histórias (quem fala nas cenas)</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2"><Plus size={16} /> Novo NPC</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Slug <Tooltip text="Identificador único. Ex.: mestre_elin, ferreiro_brom" /></label>
              <input name="slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Nome</label>
              <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Ordem</label>
              <input name="sort_order" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="col-span-2">
              <ImageUpload label="Retrato do NPC" fieldName="portrait_url" tooltipText="Rosto do NPC exibido na caixa de diálogo. PNG 256x256 ou 512x512." folder="npcs" value={form.portrait_url} onChange={(url) => setForm({ ...form, portrait_url: url })} hint="PNG retrato (saída 512×512)" forceSize={512} />
            </div>
          </div>
          <div>
            <label className="text-sm">Descrição <Tooltip text="Quem é este NPC na história" /></label>
            <textarea name="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-2 py-1" />
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Ativo</label>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-2 text-left">Retrato</th><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Ativo</th><th className="p-2 text-left">Ações</th></tr></thead>
          <tbody>
            {npcs.map(n => (
              <tr key={n.id} className="border-t">
                <td className="p-2">{n.portrait_url ? <img src={n.portrait_url} alt={n.name} className="w-10 h-10 object-cover rounded-full border" /> : <span className="text-muted-foreground text-xs">—</span>}</td>
                <td className="p-2 font-medium"><button onClick={() => setViewing(n)} className="underline underline-offset-2 hover:text-primary">{n.name}</button></td>
                <td className="p-2">{n.is_active ? 'Sim' : 'Não'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => setViewing(n)} className="text-green-700 underline inline-flex items-center gap-1"><Eye size={12} /> Ver</button>
                  <button onClick={() => handleEdit(n)} className="text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                  <button onClick={() => handleDelete(n.id)} className="text-red-600 underline inline-flex items-center gap-1"><Trash2 size={12} /> Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {npcs.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum NPC ainda.</p>}
      </div>

      {viewing && (
        <DetailModal title={viewing.name} onClose={() => setViewing(null)}>
          <DetailImage label="Retrato" url={viewing.portrait_url} />
          <DetailRow label="Slug" value={<code>{viewing.slug}</code>} />
          <DetailRow label="Descrição" value={viewing.description || '—'} />
        </DetailModal>
      )}
    </div>
  )
}
