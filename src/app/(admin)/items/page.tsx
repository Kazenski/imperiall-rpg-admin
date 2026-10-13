'use client'

import { useState, useEffect } from 'react'
import { listItems, createItem, updateItem, deleteItem } from '@/lib/actions/items'
import { useTransition } from 'react'

const ITEM_TYPES: Record<string, string> = {
  weapon: 'Arma', helmet: 'Capacete', chest: 'Peitoral', gloves: 'Luvas',
  boots: 'Botas', ring: 'Anel', necklace: 'Amuleto', consumable: 'Consumível',
  material: 'Material', misc: 'Diversos',
}
const RARITIES: Record<string, { label: string; color: string }> = {
  common: { label: 'Comum', color: '#9ca3af' },
  uncommon: { label: 'Incomum', color: '#22c55e' },
  rare: { label: 'Raro', color: '#3b82f6' },
  epic: { label: 'Épico', color: '#a855f7' },
  legendary: { label: 'Lendário', color: '#f59e0b' },
  mythic: { label: 'Mítico', color: '#ef4444' },
}
const SLOTS: Record<string, string> = {
  weapon: 'Arma', helmet: 'Cabeça', chest: 'Tronco', gloves: 'Mãos',
  boots: 'Pés', ring: 'Mão (anel)', necklace: 'Pescoço', none: 'Nenhum',
}

function Tip({ text }: { text: string }) {
  return (
    <span className="ml-1 cursor-help text-muted-foreground" title={text}>?</span>
  )
}

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
        <div>
          <h2 className="text-2xl font-semibold">Itens</h2>
          <p className="text-sm text-muted-foreground">Cadastre armas, armaduras e consumíveis do jogo</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">+ Novo Item</button>
      </div>

      {/* Tabela de Balanceamento */}
      <div className="border rounded p-4 mb-4">
        <h3 className="font-semibold mb-2">Referência de Balanceamento</h3>
        <div className="grid grid-cols-6 gap-2 text-xs">
          {Object.entries(RARITIES).map(([key, { label, color }]) => (
            <div key={key} className="border rounded p-2" style={{ borderColor: color }}>
              <div className="font-semibold" style={{ color }}>{label}</div>
              <div className="text-muted-foreground">x{Math.pow(2, Object.keys(RARITIES).indexOf(key))} stats base</div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Slug <Tip text="Identificador único do item (sem espaços). Usado no código do jogo. Ex.: espada_aco_comum" /></label>
              <input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Nome de Exibição <Tip text="Nome que o jogador verá no jogo" /></label>
              <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Tipo de Item <Tip text="Categoria do item. Armas causam dano, armaduras defendem, consumíveis são usados uma vez" /></label>
              <select name="type" value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border rounded px-2 py-1">
                {Object.entries(ITEM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Raridade <Tip text="Define o poder e a cor do nome do item. Comum é o mais fraco, Mítico o mais forte" /></label>
              <select name="rarity" value={form.rarity} onChange={e => setForm({...form, rarity: e.target.value})} className="w-full border rounded px-2 py-1">
                {Object.entries(RARITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Slot de Equipamento <Tip text="Onde o item é equipado. 'Nenhum' para consumíveis e materiais" /></label>
              <select name="slot" value={form.slot} onChange={e => setForm({...form, slot: e.target.value})} className="w-full border rounded px-2 py-1">
                {Object.entries(SLOTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Preço em Ouro <Tip text="Quanto o jogador paga para comprar na loja (0 = não vendável)" /></label>
              <input name="price_gold" type="number" value={form.price_gold} onChange={e => setForm({...form, price_gold: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Preço em Gemas <Tip text="Moeda premium (comprada com dinheiro real). 0 = só ouro" /></label>
              <input name="price_gems" type="number" value={form.price_gems} onChange={e => setForm({...form, price_gems: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Máximo por Pilha <Tip text="Quantos deste item cabem num slot do inventário. 1 para equipamentos" /></label>
              <input name="max_stack" type="number" value={form.max_stack} onChange={e => setForm({...form, max_stack: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Ataque (ATK) <Tip text="Dano que o item adiciona ao jogador. 0 para armaduras puras" /></label>
              <input name="atk" type="number" value={form.atk} onChange={e => setForm({...form, atk: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Defesa (DEF) <Tip text="Redução de dano recebido. Alta em armaduras, zero em armas ofensivas" /></label>
              <input name="def" type="number" value={form.def} onChange={e => setForm({...form, def: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Vida (HP) <Tip text="Pontos de vida extras concedidos ao equipar" /></label>
              <input name="hp" type="number" value={form.hp} onChange={e => setForm({...form, hp: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Crítico (CRIT) <Tip text="Chance de crítico (%). Ex.: 5 = 5% de chance de dano dobrado" /></label>
              <input name="crit" type="number" value={form.crit} onChange={e => setForm({...form, crit: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Ordem de Exibição <Tip text="Menor número = aparece primeiro nas listas. Use para ordenar a loja" /></label>
              <input name="sort_order" type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">URL do Ícone <Tip text="Imagem 64x64 ou 128x128 PNG com fundo transparente. Obtida após upload no Storage" /></label>
              <input name="icon_url" value={form.icon_url} onChange={e => setForm({...form, icon_url: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm">URL do Sprite <Tip text="Imagem do item no inventário ou loja (opcional). PNG com transparência" /></label>
              <input name="sprite_url" value={form.sprite_url} onChange={e => setForm({...form, sprite_url: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-sm">Descrição <Tip text="Texto exibido ao jogador passar o mouse no item" /></label>
            <textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="Uma espada simples de aço..." />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" name="stackable" checked={form.stackable} onChange={e => setForm({...form, stackable: e.target.checked})} /> Empilhável <Tip text="Se o item pode ter quantidade > 1 num slot (ex.: poções)" /></label>
            <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativo <Tip text="Itens inativos ficam salvos mas não aparecem no jogo" /></label>
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
                <td className="p-2 font-medium">{item.name}</td>
                <td className="p-2">{ITEM_TYPES[item.type] || item.type}</td>
                <td className="p-2"><span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: RARITIES[item.rarity]?.color + '20', color: RARITIES[item.rarity]?.color }}>{RARITIES[item.rarity]?.label || item.rarity}</span></td>
                <td className="p-2">{item.stats?.atk || 0}</td><td className="p-2">{item.stats?.def || 0}</td><td className="p-2">{item.stats?.hp || 0}</td>
                <td className="p-2">{item.price_gold > 0 ? `${item.price_gold} ouro` : ''} {item.price_gems > 0 ? `${item.price_gems} gemas` : ''}</td>
                <td className="p-2">{item.is_active ? 'Sim' : 'Não'}</td>
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
