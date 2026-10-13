'use client'

import { useState, useEffect, useTransition } from 'react'
import { listEffects, createEffect, updateEffect, deleteEffect } from '@/lib/actions/effects'
import { Tooltip } from '@/components/ui/tooltip'
import { ImageUpload } from '@/components/ui/image-upload'
import { Plus, Pencil, Trash2, Eye, Sparkles, Copy } from 'lucide-react'
import { DetailModal, DetailRow, DetailImage } from '@/components/ui/detail-modal'
import { useTable, SearchBox, Th, Counters } from '@/components/ui/data-table'

const CATEGORIES: Record<string, string> = { buff: 'Buff (melhora)', debuff: 'Debuff (piora)', heal: 'Cura', damage: 'Dano', utility: 'Utilidade', control: 'Controle (stun/slow)' }
const TARGETS: Record<string, string> = { self: 'Próprio', enemy: 'Um inimigo', enemies: 'Inimigos', ally: 'Um aliado', allies: 'Aliados', aoe: 'Área' }
const KINDS: Record<string, string> = { flat: 'Fixo (ex.: 50)', percent: 'Porcentagem (ex.: 10)', ms: 'Milissegundos', seconds: 'Segundos', count: 'Quantidade' }

const emptyForm = { slug: '', name: '', description: '', category: 'damage', target: 'enemy', value_kind: 'flat', default_value: 0, icon_url: '', is_active: true, sort_order: 0 }

export default function EfeitosPage() {
  const [effects, setEffects] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [viewing, setViewing] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const load = () => listEffects().then(setEffects).catch(() => setEffects([]))
  const table = useTable(effects, {
    search: (e) => `${e.name} ${e.slug}`,
    sort: {
      name: (e) => e.name,
      category: (e) => CATEGORIES[e.category] || e.category,
      target: (e) => TARGETS[e.target] || e.target,
      value: (e) => Number(e.default_value) || 0,
    },
  })
  const activeCount = effects.filter((e) => e.is_active).length
  useEffect(() => { load() }, [])

  const handleEdit = (e: any) => {
    setEditing(e)
    setForm({ slug: e.slug, name: e.name, description: e.description || '', category: e.category, target: e.target, value_kind: e.value_kind, default_value: Number(e.default_value), icon_url: e.icon_url || '', is_active: e.is_active, sort_order: e.sort_order })
    setShowForm(true)
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    startTransition(async () => {
      const fd = new FormData(ev.target as HTMLFormElement)
      if (editing) await updateEffect(editing.id, fd)
      else await createEffect(fd)
      setShowForm(false); setEditing(null); setForm(emptyForm); load()
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir este efeito? Skills/itens que o usam vão falhar.')) startTransition(() => deleteEffect(id).then(load).catch((e) => alert('Falha: ' + (e?.message || e))))
  }

  const handleClone = (e: any) => {
    handleEdit(e)
    setEditing(null)
    setForm((f) => ({ ...f, slug: `${e.slug}-copia`, name: `${e.name} (cópia)` }))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Sparkles size={20} /> Efeitos</h2>
          <p className="text-sm text-muted-foreground">Catálogo reutilizável: cadastre uma vez, use em skills, itens e personagens com valor próprio</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2"><Plus size={16} /> Novo Efeito</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Slug <Tooltip text="Identificador único. Ex.: cura, atordoar, veneno" /></label>
              <input name="slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Nome de exibição</label>
              <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Categoria <Tooltip text="Buff melhora, debuff piora, cura restaura HP, dano causa dano direto, controle trava o alvo (stun/slow)" /></label>
              <select name="category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border rounded px-2 py-1">
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Alvo padrão <Tooltip text="Quem recebe o efeito quando nada diferente for definido no uso" /></label>
              <select name="target" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} className="w-full border rounded px-2 py-1">
                {Object.entries(TARGETS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Tipo de valor <Tooltip text="Como o número do valor deve ser lido pelo jogo: fixo, %, tempo ou quantidade" /></label>
              <select name="value_kind" value={form.value_kind} onChange={e => setForm({ ...form, value_kind: e.target.value })} className="w-full border rounded px-2 py-1">
                {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Valor padrão <Tooltip text="Valor sugerido quando alguém usar este efeito sem informar outro" /></label>
              <input name="default_value" type="number" step="0.01" value={form.default_value} onChange={e => setForm({ ...form, default_value: Number(e.target.value) })} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Ordem</label>
              <input name="sort_order" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="col-span-2">
              <ImageUpload label="Ícone do efeito" fieldName="icon_url" tooltipText="Ícone 64x64 PNG transparente." folder="effects" value={form.icon_url} onChange={(url) => setForm({ ...form, icon_url: url })} hint="PNG transparente (saída 256×256)" forceSize={256} />
            </div>
          </div>
          <div>
            <label className="text-sm">Descrição <Tooltip text="Explicação para o jogador. Ex.: 'Restaura HP imediatamente'" /></label>
            <textarea name="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-2 py-1" />
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Ativo</label>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <SearchBox value={table.q} onChange={table.setQ} placeholder="Pesquisar efeito..." />
        <Counters total={effects.length} active={activeCount} shown={table.visible.length} totalLabel="efeitos" />
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">#</th>
              <Th label="Nome" k="name" active={table.sortKey === 'name'} dir={table.sortDir} onClick={table.toggle} />
              <Th label="Categoria" k="category" active={table.sortKey === 'category'} dir={table.sortDir} onClick={table.toggle} />
              <Th label="Alvo" k="target" active={table.sortKey === 'target'} dir={table.sortDir} onClick={table.toggle} />
              <Th label="Valor padrão" k="value" active={table.sortKey === 'value'} dir={table.sortDir} onClick={table.toggle} />
              <th className="p-2 text-left">Ativo</th><th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {table.visible.map((e, i) => (
              <tr key={e.id} className="border-t">
                <td className="p-2 text-muted-foreground">{i + 1}</td>
                <td className="p-2 font-medium"><button onClick={() => setViewing(e)} className="underline underline-offset-2 hover:text-primary">{e.name}</button><div className="text-xs text-muted-foreground"><code>{e.slug}</code></div></td>
                <td className="p-2">{CATEGORIES[e.category] || e.category}</td>
                <td className="p-2">{TARGETS[e.target] || e.target}</td>
                <td className="p-2">{String(e.default_value)} <span className="text-muted-foreground">({KINDS[e.value_kind] || e.value_kind})</span></td>
                <td className="p-2">{e.is_active ? 'Sim' : 'Não'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => setViewing(e)} className="text-green-700 underline inline-flex items-center gap-1"><Eye size={12} /> Ver</button>
                  <button onClick={() => handleEdit(e)} className="text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                  <button onClick={() => handleClone(e)} className="underline inline-flex items-center gap-1" title="Abre edição com cópia para salvar com outro slug"><Copy size={12} /> Clonar</button>
                  <button onClick={() => handleDelete(e.id)} className="text-red-600 underline inline-flex items-center gap-1"><Trash2 size={12} /> Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {effects.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum efeito ainda. Cadastre os básicos: cura, dano, atordoar, veneno, escudo, lentidão.</p>}
      </div>

      {viewing && (
        <DetailModal title={viewing.name} onClose={() => setViewing(null)}>
          <DetailImage label="Ícone" url={viewing.icon_url} />
          <DetailRow label="Slug" value={<code>{viewing.slug}</code>} />
          <DetailRow label="Categoria / Alvo" value={`${CATEGORIES[viewing.category]} / ${TARGETS[viewing.target]}`} />
          <DetailRow label="Valor padrão" value={`${viewing.default_value} (${KINDS[viewing.value_kind]})`} />
          <DetailRow label="Descrição" value={viewing.description || '—'} />
        </DetailModal>
      )}
    </div>
  )
}
