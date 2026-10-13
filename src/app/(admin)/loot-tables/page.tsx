'use client'

import { useState, useTransition, useEffect } from 'react'
import { listLootTables, listLootEntries, createLootTable, updateLootTable, deleteLootTable, addLootEntry, deleteLootEntry } from '@/lib/actions/loot-tables'
import { listMobs } from '@/lib/actions/mobs'
import { listStages } from '@/lib/actions/stages'
import { listItems } from '@/lib/actions/items'

const emptyTable = { slug: '', name: '', description: '', mob_id: '', stage_id: '', is_active: true }
const emptyEntry = { loot_table_id: '', item_id: '', quantity_min: 1, quantity_max: 1, weight: 100, drop_chance_percent: '', guaranteed: false, sort_order: 0 }

export default function LootTablesPage() {
  const [tables, setTables] = useState<any[]>([])
  const [entries, setEntries] = useState<Record<string, any[]>>({})
  const [mobs, setMobs] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyTable)
  const [isPending, startTransition] = useTransition()

  // Entry form
  const [entryForm, setEntryForm] = useState(emptyEntry)
  const [entryTableId, setEntryTableId] = useState('')
  const [showEntryForm, setShowEntryForm] = useState(false)

  const load = () => {
    listLootTables().then(ts => {
      setTables(ts)
      ts.forEach(t => listLootEntries(t.id).then(e => setEntries(prev => ({ ...prev, [t.id]: e }))))
    })
  }

  useEffect(() => { load(); listMobs().then(setMobs); listStages().then(setStages); listItems().then(setItems) }, [])

  const handleEdit = (table: any) => {
    setEditing(table)
    setForm({
      slug: table.slug, name: table.name, description: table.description || '',
      mob_id: table.mob_id || '', stage_id: table.stage_id || '', is_active: table.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateLootTable(editing.id, fd)
      else await createLootTable(fd)
      setShowForm(false); setEditing(null); setForm(emptyTable)
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta tabela de loot?')) startTransition(() => deleteLootTable(id).then(load))
  }

  const handleAddEntry = (tableId: string) => {
    setEntryTableId(tableId)
    setEntryForm({ ...emptyEntry, loot_table_id: tableId })
    setShowEntryForm(true)
  }

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      await addLootEntry(fd)
      setShowEntryForm(false); setEntryForm(emptyEntry)
    })
  }

  const handleDeleteEntry = (id: string) => {
    if (confirm('Remover este item da tabela?')) startTransition(() => deleteLootEntry(id).then(load))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Loot Tables</h2>
        <button onClick={() => { setEditing(null); setForm(emptyTable); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">+ Nova Tabela</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm">Slug</label><input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
            <div><label className="text-sm">Nome</label><input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
            <div><label className="text-sm">Mob</label><select name="mob_id" value={form.mob_id} onChange={e => setForm({...form, mob_id: e.target.value})} className="w-full border rounded px-2 py-1"><option value="">—</option>{mobs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div><label className="text-sm">Stage</label><select name="stage_id" value={form.stage_id} onChange={e => setForm({...form, stage_id: e.target.value})} className="w-full border rounded px-2 py-1"><option value="">—</option>{stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>
          <div><label className="text-sm">Descrição</label><textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativo</label>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {tables.map(table => (
          <div key={table.id} className="border rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-semibold">{table.name}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {table.mobs?.name || table.stages?.name || 'Global'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAddEntry(table.id)} className="text-sm text-blue-600 underline">+ Item</button>
                <button onClick={() => handleEdit(table)} className="text-sm text-blue-600 underline">Editar</button>
                <button onClick={() => handleDelete(table.id)} className="text-sm text-red-600 underline">Excluir</button>
              </div>
            </div>
            <div className="text-sm space-y-1">
              {(entries[table.id] || []).map(entry => (
                <div key={entry.id} className="flex justify-between items-center">
                  <span>
                    {entry.items?.name || '—'} x{entry.quantity_min}-{entry.quantity_max}
                    <span className="text-muted-foreground ml-2">peso: {entry.weight}</span>
                    {entry.drop_chance_percent && <span className="text-muted-foreground ml-2">({entry.drop_chance_percent}%)</span>}
                    {entry.guaranteed && <span className="ml-2 text-green-600">garantido</span>}
                  </span>
                  <button onClick={() => handleDeleteEntry(entry.id)} className="text-red-600 underline">Remover</button>
                </div>
              ))}
              {(!entries[table.id] || entries[table.id].length === 0) && <span className="text-muted-foreground">Sem itens</span>}
            </div>
          </div>
        ))}
      </div>

      {showEntryForm && (
        <form onSubmit={handleEntrySubmit} className="border rounded p-4 mb-4 space-y-3">
          <h3 className="font-semibold">Adicionar Item à Tabela</h3>
          <input type="hidden" name="loot_table_id" value={entryTableId} />
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm">Item</label><select name="item_id" value={entryForm.item_id} onChange={e => setEntryForm({...entryForm, item_id: e.target.value})} className="w-full border rounded px-2 py-1" required><option value="">—</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
            <div><label className="text-sm">Qtd Min</label><input name="quantity_min" type="number" value={entryForm.quantity_min} onChange={e => setEntryForm({...entryForm, quantity_min: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Qtd Max</label><input name="quantity_max" type="number" value={entryForm.quantity_max} onChange={e => setEntryForm({...entryForm, quantity_max: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Weight</label><input name="weight" type="number" value={entryForm.weight} onChange={e => setEntryForm({...entryForm, weight: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Drop % (opcional)</label><input name="drop_chance_percent" type="number" step="0.01" value={entryForm.drop_chance_percent} onChange={e => setEntryForm({...entryForm, drop_chance_percent: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Sort Order</label><input name="sort_order" type="number" value={entryForm.sort_order} onChange={e => setEntryForm({...entryForm, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" name="guaranteed" checked={entryForm.guaranteed} onChange={e => setEntryForm({...entryForm, guaranteed: e.target.checked})} /> Garantido</label>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : 'Adicionar'}</button>
            <button type="button" onClick={() => setShowEntryForm(false)} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  )
}
