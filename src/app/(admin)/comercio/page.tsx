'use client'

import { useEffect, useState, useTransition } from 'react'
import { Store, Coins, Package, Percent, Trophy, ScrollText, Plus, Pencil, Trash2, X, Info } from 'lucide-react'

import {
  listMerchants, createMerchant, updateMerchant, deleteMerchant,
  listShops, createShop, updateShop, deleteShop,
  listAllShopItems, createShopItem, updateShopItem, deleteShopItem, patchShopItem, restockShopItem,
  listCommerceEvents, createCommerceEvent, updateCommerceEvent, deleteCommerceEvent,
  listEventItems, createEventItem, updateEventItem, deleteEventItem,
  listReputation, listCommerceTransactions,
} from '@/lib/actions/commerce'
import { listItems } from '@/lib/actions/items'
import { listZones } from '@/lib/actions/zones'
import { ImageUpload } from '@/components/ui/image-upload'
import { Tooltip } from '@/components/ui/tooltip'
import { DetailModal } from '@/components/ui/detail-modal'
import { Counters } from '@/components/ui/data-table'

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
}

const DAYS = [
  [1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [7, 'Dom'],
]

type Tab = 'comerciantes' | 'lojas' | 'itens' | 'eventos' | 'reputacao' | 'transacoes'

export default function ComercioPage() {
  const [tab, setTab] = useState<Tab>('comerciantes')

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-amber-400 flex items-center gap-2">
            <Store size={22} /> Comércio
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Comerciantes, lojas, itens à venda, eventos e reputação (Gallar).
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {([
            ['comerciantes', 'Comerciantes', Store],
            ['lojas', 'Lojas', Coins],
            ['itens', 'Itens à venda', Package],
            ['eventos', 'Eventos', Percent],
            ['reputacao', 'Reputação', Trophy],
            ['transacoes', 'Transações', ScrollText],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border transition ${
                tab === key
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'comerciantes' && <Merchants />}
      {tab === 'lojas' && <Shops />}
      {tab === 'itens' && <ShopItems />}
      {tab === 'eventos' && <Events />}
      {tab === 'reputacao' && <Reputation />}
      {tab === 'transacoes' && <Transactions />}
    </div>
  )
}

// ==================== COMERCIANTES ====================

function Merchants() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  const reload = () => start(async () => {
    setRows(await listMerchants()); setLoading(false)
  })
  useEffect(() => { reload() }, [])

  const blank = {
    slug: '', name: '', title: '', description: '', portrait_url: '',
    rep_min_level: 1, rep_max_level: 50,
    rep_buy_low: 0.5, rep_buy_high: 1.5,
    rep_sell_low: 1.5, rep_sell_high: 0.9,
    rep_xp_per_sale: 10, is_active: true, sort_order: 0,
  }
  const form = editing ?? blank

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      if (editing) await updateMerchant(editing.id, fd)
      else await createMerchant(fd)
      setShowForm(false); setEditing(null); await reload()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <Counters items={[
        { label: 'Cadastrados', value: rows.length },
        { label: 'Ativos', value: rows.filter((r) => r.is_active).length },
      ]} />
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">
          <Plus size={14} /> Novo comerciante
        </button>
      </div>

      {showForm && (
        <MerchantForm form={form} onSubmit={submit} err={err}
          onCancel={() => { setShowForm(false); setEditing(null) }} />
      )}

      {loading ? <p className="text-sm text-slate-500">Carregando…</p> : (
        <div className="grid gap-2 md:grid-cols-2">
          {rows.map((m) => (
            <div key={m.id} className="border border-slate-700 rounded bg-slate-900/70 p-3 flex gap-3">
              {m.portrait_url ? (
                <img src={m.portrait_url} alt="" className="w-14 h-14 rounded object-cover border border-slate-600" />
              ) : (
                <div className="w-14 h-14 rounded border border-slate-700 bg-slate-800 flex items-center justify-center">
                  <Store size={18} className="text-slate-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-amber-300">{m.name}</p>
                <p className="text-xs text-slate-500">{m.title || '—'}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Compra {Number(m.rep_buy_low).toFixed(2)}x → {Number(m.rep_buy_high).toFixed(2)}x •
                  Vende {Number(m.rep_sell_low).toFixed(2)}x → {Number(m.rep_sell_high).toFixed(2)}x
                </p>
                <p className="text-xs text-slate-600">nível {m.rep_min_level}–{m.rep_max_level} • {m.rep_xp_per_sale} XP/venda</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => { setEditing(m); setShowForm(true) }}
                  className="p-1.5 rounded border border-slate-600 hover:border-amber-500/60 text-amber-400">
                  <Pencil size={12} />
                </button>
                <button onClick={() => start(async () => {
                  if (!confirm(`Apagar "${m.name}"?`)) return
                  await deleteMerchant(m.id); await reload()
                })}
                  className="p-1.5 rounded border border-slate-600 hover:border-red-500/60 text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MerchantForm({ form, onSubmit, onCancel, err }: any) {
  const f = { ...form }
  return (
    <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
      <h3 className="text-lg font-bold text-amber-400">{form.name ? 'Editar' : 'Novo'} Comerciante</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm">Nome <Tooltip text="Nome exibido do comerciante na loja" /></label>
          <input name="name" defaultValue={f.name} required className={inputCls} />
        </div>
        <div>
          <label className="text-sm">Slug <Tooltip text="Identificador único (sem espaços). Ex: mercador_reliquias" /></label>
          <input name="slug" defaultValue={f.slug} required className={inputCls} />
        </div>
        <div>
          <label className="text-sm">Título <Tooltip text="Título exibido abaixo do nome. Ex: Mercador de Relíquias" /></label>
          <input name="title" defaultValue={f.title ?? ''} className={inputCls} />
        </div>
        <div>
          <label className="text-sm">Ordem <Tooltip text="Ordem de exibição (menor = primeiro)" /></label>
          <input name="sort_order" type="number" defaultValue={String(f.sort_order)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="text-sm">Descrição <Tooltip text="Descrição do comerciante exibida na loja" /></label>
        <textarea name="description" defaultValue={f.description ?? ''} className={inputCls} />
      </div>
      <div>
        <label className="text-sm">Retrato <Tooltip text="Foto do comerciante exibida ao lado esquerdo da tela de comércio" /></label>
        <ImageUpload label="Retrato" fieldName="portrait_url" folder="merchants" value={f.portrait_url}
          tooltipText="Foto do comerciante" hint="PNG/JPG quadrado"
          onChange={(url) => { (document.getElementById('m-portrait') as HTMLInputElement).value = url }} />
        <input type="hidden" id="m-portrait" name="portrait_url" defaultValue={f.portrait_url ?? ''} />
      </div>
      <div className="border border-slate-700 rounded p-3 space-y-2">
        <p className="text-sm text-amber-300 font-bold">Curva de reputação</p>
        <p className="text-xs text-slate-400">No nível 1 o comerciante paga menos e cobra mais. No nível máximo inverte.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-sm">Nível mín. <Tooltip text="Nível mínimo de reputação (padrão 1)" /></label>
            <input name="rep_min_level" type="number" defaultValue={String(f.rep_min_level)} className={inputCls} />
          </div>
          <div>
            <label className="text-sm">Nível máx. <Tooltip text="Nível máximo de reputação (padrão 50)" /></label>
            <input name="rep_max_level" type="number" defaultValue={String(f.rep_max_level)} className={inputCls} />
          </div>
          <div>
            <label className="text-sm">XP por venda <Tooltip text="XP de reputação ganho por venda (padrão 10)" /></label>
            <input name="rep_xp_per_sale" type="number" defaultValue={String(f.rep_xp_per_sale)} className={inputCls} />
          </div>
          <div>
            <label className="text-sm">Compra no nv.1 <Tooltip text="Multiplicador de compra no nível 1 (padrão 0.5 = 50% do valor)" /></label>
            <input name="rep_buy_low" type="number" step="0.01" defaultValue={String(f.rep_buy_low)} className={inputCls} />
          </div>
          <div>
            <label className="text-sm">Compra no nv.máx <Tooltip text="Multiplicador de compra no nível máximo (padrão 1.5 = 150% do valor)" /></label>
            <input name="rep_buy_high" type="number" step="0.01" defaultValue={String(f.rep_buy_high)} className={inputCls} />
          </div>
          <div>
            <label className="text-sm">Vende no nv.1 <Tooltip text="Multiplicador de venda no nível 1 (padrão 1.5 = 150% do valor)" /></label>
            <input name="rep_sell_low" type="number" step="0.01" defaultValue={String(f.rep_sell_low)} className={inputCls} />
          </div>
          <div>
            <label className="text-sm">Vende no nv.máx <Tooltip text="Multiplicador de venda no nível máximo (padrão 0.9 = 90% do valor)" /></label>
            <input name="rep_sell_high" type="number" step="0.01" defaultValue={String(f.rep_sell_high)} className={inputCls} />
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={f.is_active} /> Ativo
      </label>
      {err && <p className="text-red-400 text-sm">{err}</p>}
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Salvar</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 transition">Cancelar</button>
      </div>
    </div>
  )
}

// ==================== LOJAS ====================

function Shops() {
  const [rows, setRows] = useState<any[]>([])
  const [merchants, setMerchants] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  const reload = () => start(async () => {
    setRows(await listShops())
    setMerchants(await listMerchants())
    setZones(await listZones())
  })
  useEffect(() => { reload() }, [])

  const blank = {
    merchant_id: '', slug: '', name: '', description: '', banner_url: '',
    always_open: true, open_time: '00:00', close_time: '23:59',
    requires_hero_level: '', requires_zone_id: '', is_active: true, sort_order: 0,
  }
  const form = editing ?? blank
  const hours = editing?.opening_hours ?? { always: true, days: [1,2,3,4,5,6,7], open: '00:00', close: '23:59' }

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      if (editing) await updateShop(editing.id, fd)
      else await createShop(fd)
      setShowForm(false); setEditing(null); await reload()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  const fmtHours = (h: any) =>
    !h || h.always ? 'Sempre aberto'
      : `${h.open}–${h.close} · ${(h.days ?? []).map((d: number) => DAYS[d-1]?.[1]).join(',')}`

  return (
    <div className="space-y-3">
      <Counters items={[
        { label: 'Lojas', value: rows.length },
        { label: 'Ativas', value: rows.filter((r) => r.is_active).length },
      ]} />
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">
          <Plus size={14} /> Nova loja
        </button>
      </div>

      {showForm && (
        <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-lg font-bold text-amber-400">{form.name ? 'Editar' : 'Nova'} Loja</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Comerciante <Tooltip text="Comerciante dono desta loja" /></label>
              <select name="merchant_id" defaultValue={form.merchant_id} required className={inputCls}>
                <option value="">— escolha —</option>
                {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Nome da loja <Tooltip text="Nome exibido ao jogador" /></label>
              <input name="name" defaultValue={form.name} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Slug <Tooltip text="Identificador único (sem espaços)" /></label>
              <input name="slug" defaultValue={form.slug} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Ordem <Tooltip text="Ordem de exibição (menor = primeiro)" /></label>
              <input name="sort_order" type="number" defaultValue={String(form.sort_order)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-sm">Descrição <Tooltip text="Descrição da loja exibida ao jogador" /></label>
            <textarea name="description" defaultValue={form.description ?? ''} className={inputCls} />
          </div>

          <div className="border border-slate-700 rounded p-3 space-y-2">
            <p className="text-sm text-amber-300 font-bold">Horário real (do seu relógio)</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="always_open" defaultChecked={hours.always} /> Sempre aberto
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm">Abre <Tooltip text="Horário que a loja abre (hora real)" /></label>
                <input name="open_time" type="time" defaultValue={hours.open} className={inputCls} />
              </div>
              <div>
                <label className="text-sm">Fecha <Tooltip text="Horário que a loja fecha (hora real)" /></label>
                <input name="close_time" type="time" defaultValue={hours.close} className={inputCls} />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Nível mín. do herói <Tooltip text="Nível mínimo do herói para ver esta loja (vazio = todos)" /></label>
              <input name="requires_hero_level" type="number" defaultValue={form.requires_hero_level ?? ''} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Zona obrigatória <Tooltip text="Zona que o herói precisa estar para ver esta loja (vazio = qualquer)" /></label>
              <select name="requires_zone_id" defaultValue={form.requires_zone_id ?? ''} className={inputCls}>
                <option value="">— qualquer zona —</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm">Banner <Tooltip text="Imagem de capa da loja" /></label>
            <ImageUpload label="Banner" fieldName="banner_url" folder="shops" value={form.banner_url}
              tooltipText="Banner da loja" hint="Imagem de capa"
              onChange={(url) => { (document.getElementById('s-banner') as HTMLInputElement).value = url }} />
            <input type="hidden" id="s-banner" name="banner_url" defaultValue={form.banner_url ?? ''} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={form.is_active} /> Ativa
          </label>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Salvar</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 transition">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-2">
        {rows.map((s) => (
          <div key={s.id} className="border border-slate-700 rounded bg-slate-900/70 p-3">
            <p className="font-bold text-sm text-amber-300">{s.name}</p>
            <p className="text-xs text-slate-500">por {s.merchants?.name ?? '—'}</p>
            <p className="text-xs text-slate-400">{fmtHours(s.opening_hours)}</p>
            <div className="flex gap-1 mt-2">
              <button onClick={() => { setEditing(s); setShowForm(true) }}
                className="p-1.5 rounded border border-slate-600 text-amber-400"><Pencil size={12} /></button>
              <button onClick={() => start(async () => {
                if (!confirm(`Apagar "${s.name}"?`)) return
                await deleteShop(s.id); await reload()
              })} className="p-1.5 rounded border border-slate-600 text-red-400"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== ITENS ====================

function ShopItems() {
  const [rows, setRows] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [shops, setShops] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [shopFilter, setShopFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  const reload = () => start(async () => {
    setRows(await listAllShopItems())
    setItems(await listItems())
    setShops(await listShops())
    setZones(await listZones())
  })
  useEffect(() => { reload() }, [])

  const filtered = rows.filter((r) => {
    if (shopFilter && r.shop_id !== shopFilter) return false
    if (!q.trim()) return true
    return `${r.items?.name ?? ''} ${r.shops?.name ?? ''}`.toLowerCase().includes(q.toLowerCase())
  })

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      if (editing) await updateShopItem(editing.id, fd)
      else await createShopItem(fd)
      setShowForm(false); setEditing(null); await reload()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  const quick = (id: string, patch: any) => start(async () => {
    await patchShopItem(id, patch); await reload()
  })

  return (
    <div className="space-y-3">
      <Counters items={[
        { label: 'Itens em loja', value: rows.length },
        { label: 'Ativos', value: rows.filter((r) => r.is_enabled).length },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..."
          className="px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-sm text-slate-300" />
        <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}
          className="px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-sm text-slate-300">
          <option value="">Todas as lojas</option>
          {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {showForm && (
        <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-lg font-bold text-amber-400">{editing ? 'Editar' : 'Novo'} Item</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Loja <Tooltip text="Loja onde este item será vendido" /></label>
              <select name="shop_id" defaultValue={editing?.shop_id ?? ''} required className={inputCls}>
                <option value="">— escolha —</option>
                {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Item <Tooltip text="Item do catálogo que será vendido" /></label>
              <select name="item_id" defaultValue={editing?.item_id ?? ''} required className={inputCls}>
                <option value="">— escolha —</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.rarity})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Preço compra (Gallar) <Tooltip text="Quanto o comerciante paga para o jogador vender este item" /></label>
              <input name="base_price" type="number" defaultValue={String(editing?.base_price ?? 100)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Preço venda (Gallar) <Tooltip text="Quanto o jogador paga para comprar este item da loja" /></label>
              <input name="sell_price" type="number" defaultValue={String(editing?.sell_price ?? 50)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Estoque <Tooltip text="Quantidade disponível (-1 = ilimitado)" /></label>
              <input name="stock" type="number" defaultValue={String(editing?.stock ?? -1)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Nível mín. do herói <Tooltip text="Nível mínimo do herói para ver este item (vazio = todos)" /></label>
              <input name="min_hero_level" type="number" defaultValue={editing?.min_hero_level ?? ''} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Zona obrigatória <Tooltip text="Zona que o herói precisa estar para ver este item (vazio = qualquer)" /></label>
              <select name="required_zone_id" defaultValue={editing?.required_zone_id ?? ''} className={inputCls}>
                <option value="">— qualquer —</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_enabled" defaultChecked={editing?.is_enabled ?? true} /> À venda
          </label>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Salvar</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 transition">Cancelar</button>
          </div>
        </div>
      )}

      <div className="border border-slate-800 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1.5">Item</th>
              <th className="px-2 py-1.5">Loja</th>
              <th className="px-2 py-1.5">Compra</th>
              <th className="px-2 py-1.5">Venda</th>
              <th className="px-2 py-1.5">Estoque</th>
              <th className="px-2 py-1.5">Ativo</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-slate-800">
                <td className="px-2 py-1.5">{r.items?.name ?? '—'}</td>
                <td className="px-2 py-1.5 text-slate-400">{r.shops?.name ?? '—'}</td>
                <td className="px-2 py-1.5">
                  <input type="number" defaultValue={r.base_price}
                    onBlur={(e) => quick(r.id, { base_price: e.target.value })}
                    className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300" />
                </td>
                <td className="px-2 py-1.5">
                  <input type="number" defaultValue={r.sell_price}
                    onBlur={(e) => quick(r.id, { sell_price: e.target.value })}
                    className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300" />
                </td>
                <td className="px-2 py-1.5">
                  <input type="number" defaultValue={r.stock}
                    onBlur={(e) => quick(r.id, { stock: e.target.value })}
                    className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700" />
                </td>
                <td className="px-2 py-1.5">
                  <input type="checkbox" checked={r.is_enabled}
                    onChange={(e) => quick(r.id, { is_enabled: e.target.checked })}
                    className="accent-amber-500" />
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => { setEditing(r); setShowForm(true) }}
                    className="p-1 rounded border border-slate-700 text-amber-400"><Pencil size={11} /></button>
                  <button onClick={() => start(async () => { await deleteShopItem(r.id); await reload() })}
                    className="p-1 rounded border border-slate-700 text-red-400 ml-1"><Trash2 size={11} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== EVENTOS ====================

function Events() {
  const [rows, setRows] = useState<any[]>([])
  const [merchants, setMerchants] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  const reload = () => start(async () => {
    setRows(await listCommerceEvents())
    setMerchants(await listMerchants())
  })
  useEffect(() => { reload() }, [])

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      if (editing) await updateCommerceEvent(editing.id, fd)
      else await createCommerceEvent(fd)
      setShowForm(false); setEditing(null); await reload()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <Counters items={[{ label: 'Eventos', value: rows.length }]} />
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">
          <Plus size={14} /> Novo evento
        </button>
      </div>

      {showForm && (
        <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-lg font-bold text-amber-400">{editing ? 'Editar' : 'Novo'} Evento</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Nome <Tooltip text="Nome do evento exibido ao jogador" /></label>
              <input name="name" defaultValue={editing?.name ?? ''} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Slug <Tooltip text="Identificador único (sem espaços)" /></label>
              <input name="slug" defaultValue={editing?.slug ?? ''} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Desconto (%) <Tooltip text="Desconto aplicado nas compras durante o evento" /></label>
              <input name="discount_percent" type="number" defaultValue={String(editing?.discount_percent ?? 0)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Começa em <Tooltip text="Data e hora que o evento começa" /></label>
              <input name="starts_at" type="datetime-local" defaultValue={editing?.starts_at ? new Date(editing.starts_at).toISOString().slice(0, 16) : ''} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Termina em <Tooltip text="Data e hora que o evento termina" /></label>
              <input name="ends_at" type="datetime-local" defaultValue={editing?.ends_at ? new Date(editing.ends_at).toISOString().slice(0, 16) : ''} required className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-sm">Descrição <Tooltip text="Descrição do evento exibida ao jogador" /></label>
            <textarea name="description" defaultValue={editing?.description ?? ''} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /> Ativo
          </label>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Salvar</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 transition">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {rows.map((e) => (
          <div key={e.id} className="border border-slate-700 rounded bg-slate-900/70 p-3">
            <p className="font-bold text-sm text-amber-300">{e.name}</p>
            <p className="text-xs text-slate-500">
              {new Date(e.starts_at).toLocaleString('pt-BR')} → {new Date(e.ends_at).toLocaleString('pt-BR')}
            </p>
            {e.discount_percent > 0 && (
              <p className="text-xs text-emerald-400 font-bold">-{e.discount_percent}% em todas as compras</p>
            )}
            <div className="flex gap-1 mt-2">
              <button onClick={() => { setEditing(e); setShowForm(true) }}
                className="p-1.5 rounded border border-slate-600 text-amber-400"><Pencil size={12} /></button>
              <button onClick={() => start(async () => { await deleteCommerceEvent(e.id); await reload() })}
                className="p-1.5 rounded border border-slate-600 text-red-400"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== REPUTAÇÃO ====================

function Reputation() {
  const [rows, setRows] = useState<any[]>([])
  const [, start] = useTransition()
  useEffect(() => {
    let alive = true
    listReputation().then((r) => { if (alive) setRows(r) })
    return () => { alive = false }
  }, [])
  return (
    <div className="border border-slate-800 rounded overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-1.5">Jogador</th>
            <th className="px-2 py-1.5">Comerciante</th>
            <th className="px-2 py-1.5">Nível</th>
            <th className="px-2 py-1.5">XP</th>
            <th className="px-2 py-1.5">Vendeu</th>
            <th className="px-2 py-1.5">Comprou</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-800">
              <td className="px-2 py-1.5">{r.profiles?.username ?? r.player_id?.slice(0, 8)}</td>
              <td className="px-2 py-1.5 text-amber-300">{r.merchants?.name}</td>
              <td className="px-2 py-1.5 text-emerald-300 font-bold">{r.reputation_level}</td>
              <td className="px-2 py-1.5">{Number(r.reputation_xp).toLocaleString('pt-BR')}</td>
              <td className="px-2 py-1.5">{r.total_units_sold}</td>
              <td className="px-2 py-1.5">{r.total_units_bought}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ==================== TRANSAÇÕES ====================

function Transactions() {
  const [rows, setRows] = useState<any[]>([])
  const [, start] = useTransition()
  useEffect(() => {
    let alive = true
    listCommerceTransactions().then((r) => { if (alive) setRows(r) })
    return () => { alive = false }
  }, [])
  return (
    <div className="border border-slate-800 rounded overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-1.5">Quando</th>
            <th className="px-2 py-1.5">Tipo</th>
            <th className="px-2 py-1.5">Item</th>
            <th className="px-2 py-1.5">Qtd</th>
            <th className="px-2 py-1.5">Total</th>
            <th className="px-2 py-1.5">Loja</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-slate-800">
              <td className="px-2 py-1.5 text-slate-500">{new Date(t.created_at).toLocaleString('pt-BR')}</td>
              <td className={`px-2 py-1.5 ${t.trade_type === 'buy' ? 'text-amber-300' : 'text-emerald-300'}`}>{t.trade_type}</td>
              <td className="px-2 py-1.5">{t.items?.name ?? '—'}</td>
              <td className="px-2 py-1.5">{t.quantity}</td>
              <td className="px-2 py-1.5">{Number(t.total_price).toLocaleString('pt-BR')}g</td>
              <td className="px-2 py-1.5 text-slate-400">{t.shops?.name ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ==================== HELPERS ====================

const inputCls = 'w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-sm text-slate-200 outline-none focus:border-amber-500'
