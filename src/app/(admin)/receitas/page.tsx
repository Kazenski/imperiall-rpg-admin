'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  listRecipes, createRecipe, updateRecipe, deleteRecipe,
  listRecipeMaterials, addRecipeMaterial, deleteRecipeMaterial,
  listUpgradeLevels, addUpgradeLevel, deleteUpgradeLevel,
  listUpgradeMaterials, addUpgradeMaterial, deleteUpgradeMaterial,
} from '@/lib/actions/crafting'
import { listItems } from '@/lib/actions/items'
import { listProfessions } from '@/lib/actions/professions'
import { Tooltip } from '@/components/ui/tooltip'
import { Plus, Pencil, Trash2, Hammer, ArrowUpCircle } from 'lucide-react'

const emptyRecipe = { slug: '', name: '', output_item_id: '', output_qty: 1, profession_id: '', required_prof_level: 1, cost_gold: 0, is_active: true, sort_order: 0 }

export default function ReceitasPage() {
  const [recipes, setRecipes] = useState<any[]>([])
  const [mats, setMats] = useState<Record<string, any[]>>({})
  const [items, setItems] = useState<any[]>([])
  const [profs, setProfs] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyRecipe)
  const [isPending, startTransition] = useTransition()

  const [matPick, setMatPick] = useState({ item_id: '', qty: 1 })
  const [upLevels, setUpLevels] = useState<any[]>([])
  const [upItemId, setUpItemId] = useState('')
  const [upForm, setUpForm] = useState({ level: 1, stat_mult: 1.1, cost_gold: 0 })
  const [upMats, setUpMats] = useState<Record<string, any[]>>({})
  const [upMatPick, setUpMatPick] = useState({ item_id: '', qty: 1 })

  const load = () => {
    listRecipes().then(rs => {
      setRecipes(rs)
      rs.forEach((r: any) => listRecipeMaterials(r.id).then(m => setMats(prev => ({ ...prev, [r.id]: m }))).catch(() => {}))
    }).catch(() => setRecipes([]))
    listItems().then(setItems).catch(() => {})
    listProfessions().then(setProfs).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const loadUpgrades = (itemId: string) => {
    listUpgradeLevels(itemId).then(ls => {
      setUpLevels(ls)
      ls.forEach((l: any) => listUpgradeMaterials(l.id).then(m => setUpMats(prev => ({ ...prev, [l.id]: m }))).catch(() => {}))
    }).catch(() => setUpLevels([]))
  }

  const run = (fn: () => Promise<any>) => startTransition(() => fn().then(load).catch((e) => alert('Falha: ' + (e?.message || e))))

  const handleEdit = (r: any) => {
    setEditing(r)
    setForm({ slug: r.slug, name: r.name, output_item_id: r.output_item_id, output_qty: r.output_qty, profession_id: r.profession_id || '', required_prof_level: r.required_prof_level, cost_gold: r.cost_gold, is_active: r.is_active, sort_order: r.sort_order })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateRecipe(editing.id, fd)
      else await createRecipe(fd)
      setShowForm(false); setEditing(null); setForm(emptyRecipe); load()
    })
  }

  return (
    <div className="space-y-10">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2"><Hammer size={20} /> Receitas (Craft)</h2>
            <p className="text-sm text-muted-foreground">O que é produzido, com quais materiais, qual profissão e nível exigidos</p>
          </div>
          <button onClick={() => { setEditing(null); setForm(emptyRecipe); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2"><Plus size={16} /> Nova Receita</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm">Slug <Tooltip text="Identificador único. Ex.: forjar_espada_aco" /></label><input name="slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full border rounded px-2 py-1" required /></div>
              <div><label className="text-sm">Nome</label><input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-2 py-1" required /></div>
              <div><label className="text-sm">Item produzido <Tooltip text="Item que o jogador recebe ao craftar" /></label>
                <select name="output_item_id" value={form.output_item_id} onChange={e => setForm({ ...form, output_item_id: e.target.value })} className="w-full border rounded px-2 py-1" required>
                  <option value="">—</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm">Qtd produzida</label><input name="output_qty" type="number" value={form.output_qty} onChange={e => setForm({ ...form, output_qty: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
              <div><label className="text-sm">Profissão <Tooltip text="Ofício exigido. Vazio = qualquer um pode craftar." /></label>
                <select name="profession_id" value={form.profession_id} onChange={e => setForm({ ...form, profession_id: e.target.value })} className="w-full border rounded px-2 py-1">
                  <option value="">Nenhuma</option>{profs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm">Nv. profissão exigido <Tooltip text="Nível mínimo da profissão para desbloquear a receita" /></label><input name="required_prof_level" type="number" value={form.required_prof_level} onChange={e => setForm({ ...form, required_prof_level: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
              <div><label className="text-sm">Custo em ouro</label><input name="cost_gold" type="number" value={form.cost_gold} onChange={e => setForm({ ...form, cost_gold: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
              <div><label className="text-sm">Ordem</label><input name="sort_order" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Ativa</label>
            <div className="flex gap-2">
              <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {recipes.map(r => (
            <div key={r.id} className="border rounded p-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{r.name} <span className="text-sm text-muted-foreground">→ {r.items?.name} x{r.output_qty} • {r.professions?.name || 'sem profissão'} nv {r.required_prof_level} • {r.cost_gold} ouro</span></span>
                <span className="flex gap-2 text-sm">
                  <button onClick={() => handleEdit(r)} className="text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                  <button onClick={() => { if (confirm('Excluir receita?')) run(() => deleteRecipe(r.id)) }} className="text-red-600 underline">Excluir</button>
                </span>
              </div>
              <div className="text-sm mt-1 space-y-1">
                {(mats[r.id] || []).map((m: any) => (
                  <div key={m.id} className="flex justify-between">
                    <span>{m.items?.name} x{m.qty}</span>
                    <button onClick={() => run(() => deleteRecipeMaterial(m.id))} className="text-red-600 underline text-xs">Remover</button>
                  </div>
                ))}
                <form onSubmit={(e) => { e.preventDefault(); run(async () => { const fd = new FormData(); fd.set('recipe_id', r.id); fd.set('item_id', matPick.item_id); fd.set('qty', String(matPick.qty)); await addRecipeMaterial(fd) }) }} className="flex gap-2 mt-1">
                  <select value={matPick.item_id} onChange={e => setMatPick({ ...matPick, item_id: e.target.value })} className="border rounded px-2 py-1 text-xs" required>
                    <option value="">Material…</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <input type="number" min={1} value={matPick.qty} onChange={e => setMatPick({ ...matPick, qty: Number(e.target.value) })} className="w-16 border rounded px-2 py-1 text-xs" title="Quantidade" />
                  <button type="submit" className="px-2 py-1 border rounded text-xs">Adicionar</button>
                </form>
              </div>
            </div>
          ))}
          {recipes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma receita ainda.</p>}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold flex items-center gap-2"><ArrowUpCircle size={18} /> Upgrades de item (+1, +2…)</h3>
        <p className="text-sm text-muted-foreground mb-3">Escolha o item e cadastre cada nível com multiplicador de stats, ouro e materiais</p>
        <div className="flex gap-2 mb-3">
          <select value={upItemId} onChange={e => { setUpItemId(e.target.value); if (e.target.value) loadUpgrades(e.target.value) }} className="border rounded px-2 py-1.5">
            <option value="">Selecione o item…</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        {upItemId && (
          <>
            <div className="space-y-2 mb-3">
              {upLevels.map(l => (
                <div key={l.id} className="border rounded p-2 text-sm">
                  <div className="flex justify-between">
                    <span><strong>+{l.level}</strong> — stats x{String(l.stat_mult)} • {l.cost_gold} ouro</span>
                    <button onClick={() => startTransition(() => deleteUpgradeLevel(l.id).then(() => loadUpgrades(upItemId)))} className="text-red-600 underline text-xs">Excluir nível</button>
                  </div>
                  <div className="pl-3 mt-1 space-y-1">
                    {(upMats[l.id] || []).map((m: any) => (
                      <div key={m.id} className="flex justify-between text-xs">
                        <span>{m.items?.name} x{m.qty}</span>
                        <button onClick={() => startTransition(() => deleteUpgradeMaterial(m.id).then(() => loadUpgrades(upItemId)))} className="text-red-600 underline">Remover</button>
                      </div>
                    ))}
                    <form onSubmit={(e) => { e.preventDefault(); startTransition(async () => { const fd = new FormData(); fd.set('upgrade_id', l.id); fd.set('item_id', upMatPick.item_id); fd.set('qty', String(upMatPick.qty)); await addUpgradeMaterial(fd); loadUpgrades(upItemId) }) }} className="flex gap-2">
                      <select value={upMatPick.item_id} onChange={e => setUpMatPick({ ...upMatPick, item_id: e.target.value })} className="border rounded px-2 py-1 text-xs" required>
                        <option value="">Material…</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                      <input type="number" min={1} value={upMatPick.qty} onChange={e => setUpMatPick({ ...upMatPick, qty: Number(e.target.value) })} className="w-16 border rounded px-2 py-1 text-xs" />
                      <button type="submit" className="px-2 py-1 border rounded text-xs">Adicionar</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); startTransition(async () => { const fd = new FormData(); fd.set('item_id', upItemId); fd.set('level', String(upForm.level)); fd.set('stat_mult', String(upForm.stat_mult)); fd.set('cost_gold', String(upForm.cost_gold)); await addUpgradeLevel(fd); loadUpgrades(upItemId) }) }} className="flex gap-2 items-end border rounded p-3">
              <div><label className="text-xs">Nível <Tooltip text="1 = +1, 2 = +2…" /></label><input type="number" min={1} value={upForm.level} onChange={e => setUpForm({ ...upForm, level: Number(e.target.value) })} className="w-20 border rounded px-2 py-1" /></div>
              <div><label className="text-xs">Multiplicador <Tooltip text="Stats base × este valor. Ex.: 1.1 = +10%" /></label><input type="number" step="0.05" min={1} value={upForm.stat_mult} onChange={e => setUpForm({ ...upForm, stat_mult: Number(e.target.value) })} className="w-24 border rounded px-2 py-1" /></div>
              <div><label className="text-xs">Ouro</label><input type="number" value={upForm.cost_gold} onChange={e => setUpForm({ ...upForm, cost_gold: Number(e.target.value) })} className="w-24 border rounded px-2 py-1" /></div>
              <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">Adicionar nível</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
