'use client'

import { useState, useEffect, useTransition } from 'react'
import { listProfessions, createProfession, updateProfession, deleteProfession } from '@/lib/actions/professions'
import { Tooltip } from '@/components/ui/tooltip'
import { ImageUpload } from '@/components/ui/image-upload'
import { Plus, Pencil, Trash2, Eye, Hammer, Copy } from 'lucide-react'
import { DetailModal, DetailRow, DetailImage } from '@/components/ui/detail-modal'
import { useTable, SearchBox, Th, Counters } from '@/components/ui/data-table'

const emptyForm = { slug: '', name: '', description: '', icon_url: '', is_active: true, sort_order: 0 }

export default function ProfissoesPage() {
  const [list, setList] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [viewing, setViewing] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const load = () => listProfessions().then(setList).catch(() => setList([]))
  const table = useTable(list, {
    search: (p) => `${p.name} ${p.slug}`,
    sort: { name: (p) => p.name },
  })
  const activeCount = list.filter((p) => p.is_active).length
  useEffect(() => { load() }, [])

  const handleEdit = (p: any) => {
    setEditing(p)
    setForm({ slug: p.slug, name: p.name, description: p.description || '', icon_url: p.icon_url || '', is_active: p.is_active, sort_order: p.sort_order })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateProfession(editing.id, fd)
      else await createProfession(fd)
      setShowForm(false); setEditing(null); setForm(emptyForm); load()
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta profissão? Receitas que a usam perdem o vínculo.')) startTransition(() => deleteProfession(id).then(load))
  }

  const handleClone = (p: any) => {
    handleEdit(p)
    setEditing(null)
    setForm((f) => ({ ...f, slug: `${p.slug}-copia`, name: `${p.name} (cópia)` }))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Hammer size={20} /> Profissões</h2>
          <p className="text-sm text-muted-foreground">Ofícios exigidos nas receitas (ex.: Ferreiro nv 2 para forjar espada)</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2"><Plus size={16} /> Nova Profissão</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Slug <Tooltip text="Identificador único. Ex.: ferreiro, alquimista" /></label>
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
              <ImageUpload label="Ícone da profissão" fieldName="icon_url" tooltipText="Ícone 128x128 PNG transparente." folder="professions" value={form.icon_url} onChange={(url) => setForm({ ...form, icon_url: url })} hint="PNG transparente (saída 256×256)" forceSize={256} />
            </div>
          </div>
          <div>
            <label className="text-sm">Descrição</label>
            <textarea name="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-2 py-1" />
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Ativa</label>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <SearchBox value={table.q} onChange={table.setQ} placeholder="Pesquisar profissão..." />
        <Counters total={list.length} active={activeCount} shown={table.visible.length} totalLabel="profissões" />
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Ícone</th><Th label="Nome" k="name" active={table.sortKey === 'name'} dir={table.sortDir} onClick={table.toggle} /><th className="p-2 text-left">Ativa</th><th className="p-2 text-left">Ações</th></tr></thead>
          <tbody>
            {table.visible.map((p, i) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 text-muted-foreground">{i + 1}</td>
                <td className="p-2">{p.icon_url ? <img src={p.icon_url} alt={p.name} className="w-10 h-10 object-contain rounded border bg-muted" /> : <span className="text-muted-foreground text-xs">—</span>}</td>
                <td className="p-2 font-medium"><button onClick={() => setViewing(p)} className="underline underline-offset-2 hover:text-primary">{p.name}</button></td>
                <td className="p-2">{p.is_active ? 'Sim' : 'Não'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => setViewing(p)} className="text-green-700 underline inline-flex items-center gap-1"><Eye size={12} /> Ver</button>
                  <button onClick={() => handleEdit(p)} className="text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                  <button onClick={() => handleClone(p)} className="underline inline-flex items-center gap-1" title="Abre edição com cópia para salvar com outro slug"><Copy size={12} /> Clonar</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 underline inline-flex items-center gap-1"><Trash2 size={12} /> Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhuma profissão ainda. Confira as do seu site (Manual → Profissões) e cadastre aqui para revisão.</p>}
      </div>

      {viewing && (
        <DetailModal title={viewing.name} onClose={() => setViewing(null)}>
          <DetailImage label="Ícone" url={viewing.icon_url} />
          <DetailRow label="Slug" value={<code>{viewing.slug}</code>} />
          <DetailRow label="Descrição" value={viewing.description || '—'} />
        </DetailModal>
      )}
    </div>
  )
}
