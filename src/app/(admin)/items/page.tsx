'use client'

import { useState, useEffect } from 'react'
import { listItems, createItem, updateItem, deleteItem } from '@/lib/actions/items'
import { useTransition } from 'react'

const ITEM_TYPES = ['weapon','helmet','chest','gloves','boots','ring','necklace','consumable','material','misc']
const RARITIES = ['common','uncommon','rare','epic','legendary','mythic']

const emptyForm = {
  slug: '', name: '', description: '', type: 'weapon', rarity: 'common', slot: 'weapon',
  icon_url: '', sprite_url: '', stackable: false, max_stack: 1, price_gold: 0, price_gems: 0,
  atk: '', def: '', hp: '', crit: '', is_active: true, sort_order: 0,
}

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isPending, startTransition] = useTransition()

  const load = () => listItems().then(setItems)
  useEffect(() => { load() }, [])

  const handleEdit = (item: any) => {
    setEditing(item)
    setForm({
      slug: item.slug, name: item.name, description: item.description || '',
      type: item.type, rarity: item.rarity, slot: item.slot || 'weapon',
      icon_url: item.icon_url || '', sprite_url: item.sprite_url || '',
      stackable: item.stackable, max_stack: item.max_stack, price_gold: item.price_gold,
      price_gems: item.price_gems,
      atk: item.stats?.atk || '', def: item.stats?.def || '', hp: item.stats?.hp || '', crit: item.stats?.crit || '',
      is_active: item.is_active, sort_order: item.sort_order,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateItem(editing.id, fd)
      else await createItem(fd)
      setShowForm(false); setEditing(null); setForm(emptyForm)
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir este item?')) startTransition(() => deleteItem(id).then(load))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Itens</h2>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">+ Novo</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm">Slug</label><input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
            <div><label className="text-sm">Nome</label><input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
            <div><label className="text-sm">Tipo</label><select name="type" value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border rounded px-2 py-1">{ITEM_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="text-sm">Raridade</label><select name="rarity" value={form.rarity} onChange={e => setForm({...form, rarity: e.target.value})} className="w-full border rounded px-2 py-1">{RARITIES.map(r => <option key={r}>{r}</option>)}</select></div>
            <div><label className="text-sm">Slot</label><select name="slot" value={form.slot} onChange={e => setForm({...form, slot: e.target.value})} className="w-full border rounded px-2 py-1">{['weapon','helmet','chest','gloves','boots','ring','necklace','none'].map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label className="text-sm">Preço Gold</label><input name="price_gold" type="number" value={form.price_gold} onChange={e => setForm({...form, price_gold: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Preço Gems</label><input name="price_gems" type="number" value={form.price_gems} onChange={e => setForm({...form, price_gems: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Max Stack</label><input name="max_stack" type="number" value={form.max_stack} onChange={e => setForm({...form, max_stack: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">ATK</label><input name="atk" type="number" value={form.atk} onChange={e => setForm({...form, atk: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">DEF</label><input name="def" type="number" value={form.def} onChange={e => setForm({...form, def: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">HP</label><input name="hp" type="number" value={form.hp} onChange={e => setForm({...form, hp: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">CRIT</label><input name="crit" type="number" value={form.crit} onChange={e => setForm({...form, crit: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Sort Order</label><input name="sort_order" type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Ícone URL</label><input name="icon_url" value={form.icon_url} onChange={e => setForm({...form, icon_url: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Sprite URL</label><input name="sprite_url" value={form.sprite_url} onChange={e => setForm({...form, sprite_url: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
          </div>
          <div><label className="text-sm">Descrição</label><textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" name="stackable" checked={form.stackable} onChange={e => setForm({...form, stackable: e.target.checked})} /> Stackable</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativo</label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Nome</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Raridade</th>
              <th className="p-2 text-left">ATK</th><th className="p-2 text-left">DEF</th><th className="p-2 text-left">HP</th>
              <th className="p-2 text-left">Preço</th><th className="p-2 text-left">Ativo</th><th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t">
                <td className="p-2">{item.name}</td><td className="p-2">{item.type}</td><td className="p-2">{item.rarity}</td>
                <td className="p-2">{item.stats?.atk || 0}</td><td className="p-2">{item.stats?.def || 0}</td><td className="p-2">{item.stats?.hp || 0}</td>
                <td className="p-2">{item.price_gold}g {item.price_gems}gem</td>
                <td className="p-2">{item.is_active ? 'Sim' : 'Nao'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => handleEdit(item)} className="text-blue-600 underline">Editar</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
