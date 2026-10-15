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
import { Plus, Pencil, Trash2, Hammer, ArrowUpCircle, HelpCircle, Package, Percent, Coins } from 'lucide-react'
import { useTable, SearchBox, Th, Counters } from '@/components/ui/data-table'

const emptyRecipe = {
  slug: '',
  name: '',
  output_item_id: '',
  output_qty: 1,
  profession_id: '',
  required_prof_level: 1,
  base_chance: 70,
  cost_gold: 0,
  is_active: true,
  sort_order: 0,
}

export default function ReceitasPage() {
  const [recipes, setRecipes] = useState<any[]>([])
  const [mats, setMats] = useState<Record<string, any[]>>({})
  const [items, setItems] = useState<any[]>([])
  const [profs, setProfs] = useState<any[]>([])
  const [profFilter, setProfFilter] = useState<string>('')
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyRecipe)
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [matPick, setMatPick] = useState<Record<string, { item_id: string; qty: number }>>({})
  const [upLevels, setUpLevels] = useState<any[]>([])
  const [upItemId, setUpItemId] = useState('')
  const [upForm, setUpForm] = useState({ level: 1, stat_mult: 1.15, base_chance: 80, cost_gold: 50 })
  const [upMats, setUpMats] = useState<Record<string, any[]>>({})
  const [upMatPick, setUpMatPick] = useState<Record<string, { item_id: string; qty: number }>>({})

  const load = () => {
    listRecipes()
      .then((rs) => {
        setRecipes(rs)
        rs.forEach((r: any) =>
          listRecipeMaterials(r.id)
            .then((m) => setMats((prev) => ({ ...prev, [r.id]: m })))
            .catch(() => {}),
        )
      })
      .catch(() => setRecipes([]))
    listItems().then(setItems).catch(() => {})
    listProfessions().then(setProfs).catch(() => {})
  }
  useEffect(() => {
    load()
  }, [])

  const loadUpgrades = (itemId: string) => {
    listUpgradeLevels(itemId)
      .then((ls) => {
        setUpLevels(ls)
        ls.forEach((l: any) =>
          listUpgradeMaterials(l.id)
            .then((m) => setUpMats((prev) => ({ ...prev, [l.id]: m })))
            .catch(() => {}),
        )
      })
      .catch(() => setUpLevels([]))
  }

  const run = (fn: () => Promise<any>) =>
    startTransition(() =>
      fn()
        .then(load)
        .catch((e) => alert('Falha: ' + (e?.message || e))),
    )

  const handleEdit = (r: any) => {
    setEditing(r)
    setForm({
      slug: r.slug,
      name: r.name,
      output_item_id: r.output_item_id,
      output_qty: r.output_qty ?? 1,
      profession_id: r.profession_id || '',
      required_prof_level: r.required_prof_level ?? 1,
      base_chance: r.base_chance ?? 70,
      cost_gold: r.cost_gold ?? 0,
      is_active: r.is_active,
      sort_order: r.sort_order ?? 0,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateRecipe(editing.id, fd)
      else await createRecipe(fd)
      setShowForm(false)
      setEditing(null)
      setForm(emptyRecipe)
      load()
    })
  }

  const filteredByProf = profFilter
    ? recipes.filter((r) =>
        profFilter === '__none__' ? !r.profession_id : r.profession_id === profFilter,
      )
    : recipes

  const table = useTable(filteredByProf, {
    search: (r) => `${r.name} ${r.slug} ${r.items?.name || ''} ${r.professions?.name || ''}`,
    sort: {
      name: (r) => r.name,
      prof: (r) => `${r.professions?.name || ''} ${String(r.required_prof_level || 0).padStart(4, '0')}`,
      chance: (r) => Number(r.base_chance ?? 70),
      gold: (r) => Number(r.cost_gold ?? 0),
    },
  })

  const activeCount = recipes.filter((r) => r.is_active).length

  return (
    <div className="space-y-12">
      {/* 1. RECEITAS DE CRAFT */}
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2 text-amber-400">
              <Hammer size={22} /> Oficina: Receitas de Craft
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <span>
                Fórmula no APK:{' '}
                <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300">
                  Chance Final = Chance Base + Nv. Profissão + ⌊Nv. Personagem / 2⌋
                </code>
              </span>
              <Tooltip text="A cada item craftado com sucesso, o herói ganha XP na profissão exigida e sobe o nível dela." />
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null)
              setForm(emptyRecipe)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg inline-flex items-center gap-2 font-medium"
          >
            <Plus size={16} /> Nova Receita
          </button>
        </div>

        {/* Formulário de Criação/Edição de Receita */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="border-2 border-amber-500/40 bg-amber-950/10 rounded-xl p-5 space-y-4"
          >
            <h3 className="text-base font-semibold text-amber-300">
              {editing ? `Editando Receita: ${editing.name}` : 'Nova Receita de Craft'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm">
                  Slug <Tooltip text="Identificador único. Ex.: forjar_espada_aco" />
                </label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                  required
                />
              </div>
              <div>
                <label className="text-sm">Nome da Receita</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                  required
                />
              </div>
              <div>
                <label className="text-sm">
                  Item produzido <Tooltip text="Item que o jogador recebe ao fundir os materiais" />
                </label>
                <select
                  name="output_item_id"
                  value={form.output_item_id}
                  onChange={(e) => setForm({ ...form, output_item_id: e.target.value })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                  required
                >
                  <option value="">— Selecione —</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm">Qtd produzida</label>
                <input
                  name="output_qty"
                  type="number"
                  min={1}
                  value={form.output_qty}
                  onChange={(e) => setForm({ ...form, output_qty: Number(e.target.value) })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-sm">
                  Profissão exigida{' '}
                  <Tooltip text="Ofício exigido para o herói ver e criar esta receita. Vazio = livre." />
                </label>
                <select
                  name="profession_id"
                  value={form.profession_id}
                  onChange={(e) => setForm({ ...form, profession_id: e.target.value })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                >
                  <option value="">Livre (Qualquer)</option>
                  {profs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm">
                  Nv. Profissão exigido{' '}
                  <Tooltip text="Nível mínimo na profissão para liberar esta receita na Oficina" />
                </label>
                <input
                  name="required_prof_level"
                  type="number"
                  min={1}
                  value={form.required_prof_level}
                  onChange={(e) =>
                    setForm({ ...form, required_prof_level: Number(e.target.value) })
                  }
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-sm text-emerald-300 font-semibold">
                  Chance Base (%){' '}
                  <Tooltip text="Chance base de funcionar (1 a 100%). No jogo soma + Nv. Profissão + (Nv. Personagem / 2)." />
                </label>
                <input
                  name="base_chance"
                  type="number"
                  min={1}
                  max={100}
                  value={form.base_chance}
                  onChange={(e) => setForm({ ...form, base_chance: Number(e.target.value) })}
                  className="w-full border border-emerald-500/50 rounded px-2.5 py-1.5 bg-background font-semibold"
                />
              </div>
              <div>
                <label className="text-sm">Custo em Ouro</label>
                <input
                  name="cost_gold"
                  type="number"
                  min={0}
                  value={form.cost_gold}
                  onChange={(e) => setForm({ ...form, cost_gold: Number(e.target.value) })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                />
              </div>
              <div>
                <label className="text-sm">Ordem</label>
                <input
                  name="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className="w-full border rounded px-2.5 py-1.5 bg-background"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />{' '}
              Ativa
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : editing ? 'Atualizar Receita' : 'Criar Receita'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Barra de filtro por profissão + Busca */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox value={table.q} onChange={table.setQ} placeholder="Pesquisar receita ou item..." />
            <Counters
              total={recipes.length}
              active={activeCount}
              shown={table.visible.length}
              totalLabel="receitas"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setProfFilter('')}
              className={`px-3 py-1 rounded-full text-xs border transition ${
                profFilter === ''
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-semibold'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              Todas as Profissões
            </button>
            {profs.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfFilter(p.id)}
                className={`px-3 py-1 rounded-full text-xs border transition inline-flex items-center gap-1.5 ${
                  profFilter === p.id
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200 font-semibold'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {p.icon_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.icon_url} alt="" className="w-3.5 h-3.5 object-contain" />
                )}
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabela Moderna de Receitas */}
        <div className="border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2.5 text-left">#</th>
                <Th
                  label="Receita / Item Produzido"
                  k="name"
                  active={table.sortKey === 'name'}
                  dir={table.sortDir}
                  onClick={table.toggle}
                />
                <Th
                  label="Profissão & Nível"
                  k="prof"
                  active={table.sortKey === 'prof'}
                  dir={table.sortDir}
                  onClick={table.toggle}
                />
                <Th
                  label="Chance Base (%)"
                  k="chance"
                  active={table.sortKey === 'chance'}
                  dir={table.sortDir}
                  onClick={table.toggle}
                />
                <Th
                  label="Custo Ouro"
                  k="gold"
                  active={table.sortKey === 'gold'}
                  dir={table.sortDir}
                  onClick={table.toggle}
                />
                <th className="p-2.5 text-left">Materiais Necessários</th>
                <th className="p-2.5 text-left">Ativa</th>
                <th className="p-2.5 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {table.visible.map((r, idx) => {
                const recipeMats = mats[r.id] || []
                const baseChance = Number(r.base_chance ?? 70)
                const isExpanded = expandedRecipeId === r.id
                const pick = matPick[r.id] || { item_id: '', qty: 1 }

                return (
                  <tr key={r.id} className="border-t align-top hover:bg-muted/20">
                    <td className="p-2.5 text-muted-foreground">{idx + 1}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2.5">
                        {r.items?.icon_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.items.icon_url}
                            alt={r.items?.name || r.name}
                            className="w-9 h-9 rounded border bg-zinc-900 object-contain p-0.5 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded border bg-zinc-900 flex items-center justify-center text-amber-400 flex-shrink-0">
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-zinc-100">{r.name}</div>
                          <div className="text-xs text-amber-300">
                            Produz: <strong>{r.items?.name || '—'}</strong> ×{r.output_qty}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5">
                      {r.professions?.name ? (
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold inline-flex items-center gap-1.5">
                          {r.professions?.icon_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.professions.icon_url} alt="" className="w-4 h-4 object-contain" />
                          )}
                          <span>
                            {r.professions.name} • Nv. {r.required_prof_level}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Livre (Nv. {r.required_prof_level})</span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold border ${
                            baseChance >= 75
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : baseChance >= 45
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {baseChance}% base
                        </span>
                        <span
                          className="text-[11px] text-zinc-400"
                          title="Chance Final = Chance Base + Nv. Profissão + ⌊Nv. Herói / 2⌋"
                        >
                          (+bônus)
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5">
                      <span className="text-xs text-amber-300 font-medium inline-flex items-center gap-1">
                        <Coins size={12} /> {r.cost_gold || 0}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {recipeMats.map((m: any) => (
                            <span
                              key={m.id}
                              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-xs inline-flex items-center gap-1.5"
                            >
                              {m.items?.icon_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.items.icon_url} alt="" className="w-3.5 h-3.5 object-contain" />
                              )}
                              <span>
                                {m.items?.name} <strong>×{m.qty}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => run(() => deleteRecipeMaterial(m.id))}
                                className="text-red-400 hover:text-red-300 ml-1"
                                title="Remover material"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => setExpandedRecipeId(isExpanded ? null : r.id)}
                            className="px-2 py-0.5 rounded border border-dashed border-amber-500/50 text-amber-300 text-xs hover:bg-amber-500/10"
                          >
                            {isExpanded ? 'Fechar' : '+ Material'}
                          </button>
                        </div>

                        {isExpanded && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              run(async () => {
                                const fd = new FormData()
                                fd.set('recipe_id', r.id)
                                fd.set('item_id', pick.item_id)
                                fd.set('qty', String(pick.qty))
                                await addRecipeMaterial(fd)
                              })
                            }}
                            className="flex flex-wrap gap-1.5 pt-1"
                          >
                            <select
                              value={pick.item_id}
                              onChange={(e) =>
                                setMatPick({
                                  ...matPick,
                                  [r.id]: { ...pick, item_id: e.target.value },
                                })
                              }
                              className="border rounded px-2 py-1 text-xs bg-zinc-900"
                              required
                            >
                              <option value="">Escolher material…</option>
                              {items.map((i) => (
                                <option key={i.id} value={i.id}>
                                  {i.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={1}
                              value={pick.qty}
                              onChange={(e) =>
                                setMatPick({
                                  ...matPick,
                                  [r.id]: { ...pick, qty: Number(e.target.value) },
                                })
                              }
                              className="w-16 border rounded px-2 py-1 text-xs bg-zinc-900"
                              title="Quantidade"
                            />
                            <button
                              type="submit"
                              className="px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-medium"
                            >
                              Adicionar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5">{r.is_active ? 'Sim' : 'Não'}</td>
                    <td className="p-2.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="text-blue-400 underline inline-flex items-center gap-1 text-xs"
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Excluir receita?')) run(() => deleteRecipe(r.id))
                          }}
                          className="text-red-400 underline inline-flex items-center gap-1 text-xs"
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {recipes.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Nenhuma receita cadastrada ainda.</p>
          )}
        </div>
      </div>

      {/* 2. UPGRADES DE EQUIPAMENTO (+1, +2...) */}
      <div className="border-t pt-8 space-y-4">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2 text-amber-400">
            <ArrowUpCircle size={20} /> Upgrades de Equipamento (+1, +2, +3…)
          </h3>
          <p className="text-sm text-muted-foreground">
            Configura os níveis de melhoria que aparecem na aba “Melhorar (Upgrade)” da Oficina no APK.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">Equipamento:</label>
          <select
            value={upItemId}
            onChange={(e) => {
              setUpItemId(e.target.value)
              if (e.target.value) loadUpgrades(e.target.value)
            }}
            className="border rounded-lg px-3 py-1.5 bg-background min-w-[260px]"
          >
            <option value="">Selecione um item para configurar upgrades…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} {i.slot && i.slot !== 'none' ? `(${i.slot})` : ''}
              </option>
            ))}
          </select>
        </div>

        {upItemId && (
          <div className="space-y-4">
            <div className="border rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2.5 text-left">Nível</th>
                    <th className="p-2.5 text-left">Multiplicador de Stats</th>
                    <th className="p-2.5 text-left">Chance Base (%)</th>
                    <th className="p-2.5 text-left">Custo Ouro</th>
                    <th className="p-2.5 text-left">Materiais p/ Melhorar</th>
                    <th className="p-2.5 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {upLevels.map((l) => {
                    const pick = upMatPick[l.id] || { item_id: '', qty: 1 }
                    return (
                      <tr key={l.id} className="border-t align-top">
                        <td className="p-2.5 font-bold text-amber-300">+{l.level}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 text-xs font-semibold">
                            ×{String(l.stat_mult)} (+{Math.round((Number(l.stat_mult) - 1) * 100)}%)
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                            {l.base_chance ?? 80}% base
                          </span>
                        </td>
                        <td className="p-2.5">{l.cost_gold} ouro</td>
                        <td className="p-2.5 space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {(upMats[l.id] || []).map((m: any) => (
                              <span
                                key={m.id}
                                className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-xs inline-flex items-center gap-1"
                              >
                                {m.items?.name} <strong>×{m.qty}</strong>
                                <button
                                  type="button"
                                  onClick={() =>
                                    startTransition(() =>
                                      deleteUpgradeMaterial(m.id).then(() => loadUpgrades(upItemId)),
                                    )
                                  }
                                  className="text-red-400 ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              startTransition(async () => {
                                const fd = new FormData()
                                fd.set('upgrade_id', l.id)
                                fd.set('item_id', pick.item_id)
                                fd.set('qty', String(pick.qty))
                                await addUpgradeMaterial(fd)
                                loadUpgrades(upItemId)
                              })
                            }}
                            className="flex flex-wrap gap-1.5"
                          >
                            <select
                              value={pick.item_id}
                              onChange={(e) =>
                                setUpMatPick({
                                  ...upMatPick,
                                  [l.id]: { ...pick, item_id: e.target.value },
                                })
                              }
                              className="border rounded px-2 py-1 text-xs bg-zinc-900"
                              required
                            >
                              <option value="">Material…</option>
                              {items.map((i) => (
                                <option key={i.id} value={i.id}>
                                  {i.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={1}
                              value={pick.qty}
                              onChange={(e) =>
                                setUpMatPick({
                                  ...upMatPick,
                                  [l.id]: { ...pick, qty: Number(e.target.value) },
                                })
                              }
                              className="w-16 border rounded px-2 py-1 text-xs bg-zinc-900"
                            />
                            <button
                              type="submit"
                              className="px-2 py-1 border rounded text-xs hover:bg-zinc-800"
                            >
                              + Material
                            </button>
                          </form>
                        </td>
                        <td className="p-2.5">
                          <button
                            onClick={() =>
                              startTransition(() =>
                                deleteUpgradeLevel(l.id).then(() => loadUpgrades(upItemId)),
                              )
                            }
                            className="text-red-400 underline text-xs"
                          >
                            Excluir nível
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {upLevels.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-xs text-muted-foreground">
                        Nenhum nível de upgrade cadastrado para este item ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                startTransition(async () => {
                  const fd = new FormData()
                  fd.set('item_id', upItemId)
                  fd.set('level', String(upForm.level))
                  fd.set('stat_mult', String(upForm.stat_mult))
                  fd.set('base_chance', String(upForm.base_chance))
                  fd.set('cost_gold', String(upForm.cost_gold))
                  await addUpgradeLevel(fd)
                  setUpForm((f) => ({ ...f, level: f.level + 1 }))
                  loadUpgrades(upItemId)
                })
              }}
              className="flex flex-wrap gap-3 items-end border rounded-xl p-4 bg-muted/20"
            >
              <div>
                <label className="text-xs">
                  Nível <Tooltip text="1 = +1, 2 = +2…" />
                </label>
                <input
                  type="number"
                  min={1}
                  value={upForm.level}
                  onChange={(e) => setUpForm({ ...upForm, level: Number(e.target.value) })}
                  className="w-20 border rounded px-2 py-1.5 bg-background block"
                />
              </div>
              <div>
                <label className="text-xs">
                  Multiplicador <Tooltip text="Stats base × este valor. Ex.: 1.15 = +15%" />
                </label>
                <input
                  type="number"
                  step="0.05"
                  min={1}
                  value={upForm.stat_mult}
                  onChange={(e) => setUpForm({ ...upForm, stat_mult: Number(e.target.value) })}
                  className="w-28 border rounded px-2 py-1.5 bg-background block"
                />
              </div>
              <div>
                <label className="text-xs text-emerald-300 font-semibold">
                  Chance Base (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={upForm.base_chance}
                  onChange={(e) => setUpForm({ ...upForm, base_chance: Number(e.target.value) })}
                  className="w-24 border border-emerald-500/50 rounded px-2 py-1.5 bg-background block"
                />
              </div>
              <div>
                <label className="text-xs">Ouro</label>
                <input
                  type="number"
                  min={0}
                  value={upForm.cost_gold}
                  onChange={(e) => setUpForm({ ...upForm, cost_gold: Number(e.target.value) })}
                  className="w-28 border rounded px-2 py-1.5 bg-background block"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                + Adicionar nível
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
