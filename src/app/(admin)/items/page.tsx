'use client'

import { useState, useEffect } from 'react'
import { listItems, createItem, updateItem, deleteItem } from '@/lib/actions/items'
import { useTransition } from 'react'
import { Tooltip } from '@/components/ui/tooltip'
import { ImageUpload } from '@/components/ui/image-upload'
import { DetailModal, DetailRow, DetailImage } from '@/components/ui/detail-modal'
import { suggestItemStats } from '@/lib/balance'
import { listEffects, listItemEffects, addItemEffect, deleteItemEffect } from '@/lib/actions/effects'
import { Sword, Shield, Heart, Coins, Gem, Plus, Pencil, Trash2, Eye, Sparkles, Copy } from 'lucide-react'
import { useTable, SearchBox, Th, Counters } from '@/components/ui/data-table'

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
  const [viewing, setViewing] = useState<any>(null)
  const [refLevel, setRefLevel] = useState(5)
  const [allEffects, setAllEffects] = useState<any[]>([])
  const [usedEffects, setUsedEffects] = useState<any[]>([])
  const [effPick, setEffPick] = useState({ effect_id: '', value: 0 })

  const openDetail = (item: any) => {
    setViewing(item)
    listEffects().then(setAllEffects).catch(() => {})
    listItemEffects(item.id).then(setUsedEffects).catch(() => setUsedEffects([]))
  }

  function applySuggestion() {
    const s = suggestItemStats(form.rarity, form.type, refLevel)
    setForm({
      ...form,
      atk: String(s.atk),
      def: String(s.def),
      hp: String(s.hp),
      crit: String(s.crit),
      price_gold: s.price_gold,
    })
  }

  const load = () => listItems().then(setItems).catch(() => setItems([]))
  const table = useTable(items, {
    search: (i) => `${i.name} ${i.slug}`,
    sort: {
      name: (i) => i.name,
      type: (i) => ITEM_TYPES[i.type] || i.type,
      rarity: (i) => Object.keys(RARITIES).indexOf(i.rarity),
      atk: (i) => i.stats?.atk || 0,
      price: (i) => i.price_gold || 0,
    },
  })
  const activeCount = items.filter((i) => i.is_active).length
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
      setShowForm(false); setEditing(null); setForm(emptyForm); load()
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir este item?')) startTransition(() => deleteItem(id).then(load))
  }

  const handleClone = (item: any) => {
    handleEdit(item)
    setEditing(null)
    setForm((f) => ({ ...f, slug: `${item.slug}-copia`, name: `${item.name} (cópia)` }))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Itens</h2>
          <p className="text-sm text-muted-foreground">Cadastre armas, armaduras e consumíveis do jogo</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2">
          <Plus size={16} /> Novo Item
        </button>
      </div>

      {/* Tabela de Balanceamento - Sempre visível */}
      <div className="border rounded p-4 mb-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Shield size={16} /> Referência de Balanceamento</h3>
        <div className="grid grid-cols-6 gap-2 text-xs">
          {Object.entries(RARITIES).map(([key, { label, color }]) => (
            <div key={key} className="border rounded p-2" style={{ borderColor: color }}>
              <div className="font-semibold" style={{ color }}>{label}</div>
              <div className="text-muted-foreground">x{Math.pow(2, Object.keys(RARITIES).indexOf(key))} stats base</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">💡 Raridades mais altas multiplicam os stats base do item. Use como referência ao balancear.</p>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="flex items-end gap-2 rounded bg-muted/60 p-3">
            <div>
              <label className="text-sm font-medium">Nível de referência <Tooltip text="Nível do jogador para o qual este item é adequado. Usado só para calcular a sugestão — não é salvo." /></label>
              <input type="number" min={1} max={100} value={refLevel} onChange={e => setRefLevel(Number(e.target.value) || 1)} className="w-24 border rounded px-2 py-1" />
            </div>
            <button type="button" onClick={applySuggestion} className="px-3 py-1.5 rounded border bg-background hover:bg-muted inline-flex items-center gap-1 text-sm">
              <Sparkles size={14} /> Sugerir valores
            </button>
            <p className="text-xs text-muted-foreground">Preenche ATK/DEF/HP/CRIT/preço pelo equilíbrio do Guia.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Slug <Tooltip text="Identificador único do item (sem espaços). Usado no código do jogo. Ex.: espada_aco_comum" /></label>
              <input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Nome de Exibição <Tooltip text="Nome que o jogador verá no jogo" /></label>
              <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Tipo de Item <Tooltip text="Categoria do item. Armas causam dano, armaduras defendem, consumíveis são usados uma vez" /></label>
              <select name="type" value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border rounded px-2 py-1">
                {Object.entries(ITEM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Raridade <Tooltip text="Define o poder e a cor do nome do item. Comum é o mais fraco, Mítico o mais forte" /></label>
              <select name="rarity" value={form.rarity} onChange={e => setForm({...form, rarity: e.target.value})} className="w-full border rounded px-2 py-1">
                {Object.entries(RARITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Slot de Equipamento <Tooltip text="Onde o item é equipado. 'Nenhum' para consumíveis e materiais" /></label>
              <select name="slot" value={form.slot} onChange={e => setForm({...form, slot: e.target.value})} className="w-full border rounded px-2 py-1">
                {Object.entries(SLOTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm flex items-center gap-1"><Coins size={14} /> Preço em Ouro <Tooltip text="Quanto o jogador paga para comprar na loja (0 = não vendável)" /></label>
              <input name="price_gold" type="number" value={form.price_gold} onChange={e => setForm({...form, price_gold: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm flex items-center gap-1"><Gem size={14} /> Preço em Gemas <Tooltip text="Moeda premium (comprada com dinheiro real). 0 = só ouro" /></label>
              <input name="price_gems" type="number" value={form.price_gems} onChange={e => setForm({...form, price_gems: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Máximo por Pilha <Tooltip text="Quantos deste item cabem num slot do inventário. 1 para equipamentos" /></label>
              <input name="max_stack" type="number" value={form.max_stack} onChange={e => setForm({...form, max_stack: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm flex items-center gap-1"><Sword size={14} /> Ataque (ATK) <Tooltip text="Dano que o item adiciona ao jogador. 0 para armaduras puras" /></label>
              <input name="atk" type="number" value={form.atk} onChange={e => setForm({...form, atk: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm flex items-center gap-1"><Shield size={14} /> Defesa (DEF) <Tooltip text="Redução de dano recebido. Alta em armaduras, zero em armas ofensivas" /></label>
              <input name="def" type="number" value={form.def} onChange={e => setForm({...form, def: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm flex items-center gap-1"><Heart size={14} /> Vida (HP) <Tooltip text="Pontos de vida extras concedidos ao equipar" /></label>
              <input name="hp" type="number" value={form.hp} onChange={e => setForm({...form, hp: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Crítico (CRIT) <Tooltip text="Chance de crítico (%). Ex.: 5 = 5% de chance de dano dobrado" /></label>
              <input name="crit" type="number" value={form.crit} onChange={e => setForm({...form, crit: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Ordem de Exibição <Tooltip text="Menor número = aparece primeiro nas listas. Use para ordenar a loja" /></label>
              <input name="sort_order" type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <ImageUpload
              label="Ícone do item"
              fieldName="icon_url"
              tooltipText="Imagem 64x64 ou 128x128 PNG com fundo transparente. Arraste o arquivo ou clique para enviar ao Storage."
              folder="items"
              value={form.icon_url}
              onChange={(url) => setForm({ ...form, icon_url: url })}
              hint="PNG transparente 128x128 — gerado na IA, fundo removido (saída 512×512)"
              forceSize={512}
            />
            <ImageUpload
              label="Sprite do item (opcional)"
              fieldName="sprite_url"
              tooltipText="Imagem do item no inventário ou loja. PNG com transparência. Pode ser a mesma do ícone."
              folder="items"
              value={form.sprite_url}
              onChange={(url) => setForm({ ...form, sprite_url: url })}
              hint="PNG transparente — opcional, pode repetir o ícone (saída 512×512)"
              forceSize={512}
            />
          </div>
          <div>
            <label className="text-sm">Descrição <Tooltip text="Texto exibido ao jogador passar o mouse no item" /></label>
            <textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="Uma espada simples de aço..." />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" name="stackable" checked={form.stackable} onChange={e => setForm({...form, stackable: e.target.checked})} /> Empilhável <Tooltip text="Se o item pode ter quantidade > 1 num slot (ex.: poções)" /></label>
            <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativo <Tooltip text="Itens inativos ficam salvos mas não aparecem no jogo" /></label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <SearchBox value={table.q} onChange={table.setQ} placeholder="Pesquisar item..." />
        <Counters total={items.length} active={activeCount} shown={table.visible.length} totalLabel="itens" />
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Ícone</th>
              <Th label="Nome" k="name" active={table.sortKey === 'name'} dir={table.sortDir} onClick={table.toggle} />
              <Th label="Tipo" k="type" active={table.sortKey === 'type'} dir={table.sortDir} onClick={table.toggle} />
              <Th label="Raridade" k="rarity" active={table.sortKey === 'rarity'} dir={table.sortDir} onClick={table.toggle} />
              <Th label="ATK" k="atk" active={table.sortKey === 'atk'} dir={table.sortDir} onClick={table.toggle} />
              <th className="p-2 text-left">DEF</th><th className="p-2 text-left">HP</th>
              <Th label="Preço" k="price" active={table.sortKey === 'price'} dir={table.sortDir} onClick={table.toggle} />
              <th className="p-2 text-left">Ativo</th><th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {table.visible.map((item, i) => (
              <tr key={item.id} className="border-t">
                <td className="p-2 text-muted-foreground">{i + 1}</td>
                <td className="p-2">
                  {item.icon_url
                    ? <img src={item.icon_url} alt={item.name} className="w-10 h-10 object-contain rounded border bg-muted" />
                    : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="p-2 font-medium">
                  <button onClick={() => openDetail(item)} className="underline underline-offset-2 hover:text-primary text-left">{item.name}</button>
                </td>
                <td className="p-2">{ITEM_TYPES[item.type] || item.type}</td>
                <td className="p-2"><span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: RARITIES[item.rarity]?.color + '20', color: RARITIES[item.rarity]?.color }}>{RARITIES[item.rarity]?.label || item.rarity}</span></td>
                <td className="p-2">{item.stats?.atk || 0}</td><td className="p-2">{item.stats?.def || 0}</td><td className="p-2">{item.stats?.hp || 0}</td>
                <td className="p-2">{item.price_gold > 0 ? `${item.price_gold} ouro` : ''} {item.price_gems > 0 ? `${item.price_gems} gemas` : ''}</td>
                <td className="p-2">{item.is_active ? 'Sim' : 'Não'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => openDetail(item)} className="text-green-700 underline inline-flex items-center gap-1"><Eye size={12} /> Ver</button>
                  <button onClick={() => handleEdit(item)} className="text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                  <button onClick={() => handleClone(item)} className="underline inline-flex items-center gap-1" title="Abre edição com cópia para salvar com outro slug"><Copy size={12} /> Clonar</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 underline inline-flex items-center gap-1"><Trash2 size={12} /> Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <DetailModal title={viewing.name} onClose={() => setViewing(null)}>
          <DetailImage label="Ícone" url={viewing.icon_url} />
          <DetailImage label="Sprite" url={viewing.sprite_url} />
          <DetailRow label="Slug" value={<code>{viewing.slug}</code>} />
          <DetailRow label="Tipo" value={ITEM_TYPES[viewing.type] || viewing.type} />
          <DetailRow label="Raridade" value={RARITIES[viewing.rarity]?.label || viewing.rarity} />
          <DetailRow label="Slot" value={SLOTS[viewing.slot] || viewing.slot || '—'} />
          <DetailRow label="ATK / DEF / HP" value={`${viewing.stats?.atk || 0} / ${viewing.stats?.def || 0} / ${viewing.stats?.hp || 0}`} />
          <DetailRow label="Crítico" value={viewing.stats?.crit ? `${viewing.stats.crit}%` : '—'} />
          <DetailRow label="Preço" value={`${viewing.price_gold || 0} ouro${viewing.price_gems ? ` + ${viewing.price_gems} gemas` : ''}`} />
          <DetailRow label="Empilhável" value={viewing.stackable ? `Sim (máx ${viewing.max_stack})` : 'Não'} />
          <DetailRow label="Descrição" value={viewing.description || '—'} />
          <DetailRow label="Ativo" value={viewing.is_active ? 'Sim' : 'Não'} />

          <h4 className="font-semibold mt-4 mb-1">Efeitos deste item <Tooltip text="Ex.: poção com efeito Cura de 50. Selecione o efeito e informe o valor." /></h4>
          {usedEffects.map((ue: any) => (
            <div key={ue.id} className="flex justify-between text-sm py-1 border-b last:border-0">
              <span>{ue.effects?.name}: <strong>{String(ue.value)}</strong></span>
              <button onClick={() => startTransition(() => deleteItemEffect(ue.id).then(() => listItemEffects(viewing.id).then(setUsedEffects)))} className="text-red-600 underline text-xs">Remover</button>
            </div>
          ))}
          {usedEffects.length === 0 && <p className="text-xs text-muted-foreground">Nenhum efeito vinculado.</p>}
          <form onSubmit={(e) => { e.preventDefault(); startTransition(async () => { const fd = new FormData(); fd.set('item_id', viewing.id); fd.set('effect_id', effPick.effect_id); fd.set('value', String(effPick.value)); await addItemEffect(fd); setEffPick({ effect_id: '', value: 0 }); listItemEffects(viewing.id).then(setUsedEffects) }) }} className="flex gap-2 mt-2">
            <select value={effPick.effect_id} onChange={e => setEffPick({ ...effPick, effect_id: e.target.value })} className="flex-1 border rounded px-2 py-1 text-sm" required>
              <option value="">Efeito…</option>
              {allEffects.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <input type="number" step="0.01" value={effPick.value} onChange={e => setEffPick({ ...effPick, value: Number(e.target.value) })} className="w-24 border rounded px-2 py-1 text-sm" title="Valor personalizado" />
            <button type="submit" className="px-3 py-1 border rounded text-sm">Adicionar</button>
          </form>
        </DetailModal>
      )}
    </div>
  )
}

