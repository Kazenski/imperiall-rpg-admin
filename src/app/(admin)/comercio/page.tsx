'use client'

import { useEffect, useState, useTransition } from 'react'
import { Store, Coins, Package, Percent, Trophy, ScrollText, Plus, Pencil, Trash2, Search, ArrowRightLeft } from 'lucide-react'

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
import { Counters } from '@/components/ui/data-table'

const RARITY_COLORS: Record<string, string> = {
  common: 'border-slate-500 text-slate-300',
  uncommon: 'border-green-500 text-green-300',
  rare: 'border-blue-500 text-blue-300',
  epic: 'border-purple-500 text-purple-300',
  legendary: 'border-amber-500 text-amber-300',
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
          <h1 className="text-lg font-bold text-amber-300 flex items-center gap-2">
            <Store size={18} /> Comércio
          </h1>
          <p className="text-[11px] text-slate-500">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border transition ${
                tab === key
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <Icon size={13} />
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
  const [editing, setEditing] = useState<any>(null)
  const [show, setShow] = useState(false)
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
      setEditing(null); setShow(false); await reload()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <Counters items={[
        { label: 'Cadastrados', value: rows.length },
        { label: 'Ativos', value: rows.filter((r) => r.is_active).length },
      ]} />
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShow(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white">
          <Plus size={13} /> Novo comerciante
        </button>
      </div>

      {show && (
        <MerchantForm form={form} onSubmit={submit} err={err}
          onClose={() => { setShow(false); setEditing(null) }} />
      )}

      {loading ? <p className="text-xs text-slate-500">Carregando…</p> : (
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
                <p className="text-[10px] text-slate-500">{m.title || '—'}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Compra {Number(m.rep_buy_low).toFixed(2)}x → {Number(m.rep_buy_high).toFixed(2)}x •
                  Vende {Number(m.rep_sell_low).toFixed(2)}x → {Number(m.rep_sell_high).toFixed(2)}x
                </p>
                <p className="text-[10px] text-slate-600">nível {m.rep_min_level}–{m.rep_max_level} • {m.rep_xp_per_sale} XP/venda</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => { setEditing(m); setShow(true) }}
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

function MerchantForm({ form, onSubmit, onClose, err }: any) {
  const f = { ...form }
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <form action={onSubmit} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-3">
        <div className="flex justify-between">
          <h3 className="font-bold text-amber-300">Comerciante</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <F name="name" label="Nome" defaultValue={f.name} required />
          <F name="slug" label="Slug" defaultValue={f.slug} required />
          <F name="title" label="Título" defaultValue={f.title ?? ''} />
          <F name="sort_order" label="Ordem" type="number" defaultValue={String(f.sort_order)} />
        </div>
        <F name="description" label="Descrição" defaultValue={f.description ?? ''} textarea />
        <Field label="Retrato">
          <ImageUpload label="Retrato" fieldName="portrait_url" folder="merchants" value={f.portrait_url}
            tooltipText="Foto do comerciante" hint="PNG/JPG quadrado"
            onChange={(url) => { (document.getElementById('m-portrait') as HTMLInputElement). value = url }} />
          <input type="hidden" id="m-portrait" name="portrait_url" defaultValue={f.portrait_url ?? ''} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <F name="rep_min_level" label="Nível mín." type="number" defaultValue={String(f.rep_min_level)} />
          <F name="rep_max_level" label="Nível máx." type="number" defaultValue={String(f.rep_max_level)} />
          <F name="rep_xp_per_sale" label="XP por venda" type="number" defaultValue={String(f.rep_xp_per_sale)} />
          <F name="rep_buy_low" label="Compra no nv.1" type="number" step="0.01" defaultValue={String(f.rep_buy_low)} />
          <F name="rep_buy_high" label="Compra no nv.máx" type="number" step="0.01" defaultValue={String(f.rep_buy_high)} />
          <F name="rep_sell_low" label="Vende no nv.1" type="number" step="0.01" defaultValue={String(f.rep_sell_low)} />
          <F name="rep_sell_high" label="Vende no nv.máx" type="number" step="0.01" defaultValue={String(f.rep_sell_high)} />
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" name="is_active" defaultChecked={f.is_active} /> Ativo
        </label>
        {err && <p className="text-red-400 text-xs">{err}</p>}
        <button className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold">Salvar</button>
      </form>
    </div>
  )
}

// ==================== LOJAS ====================

function Shops() {
  const [rows, setRows] = useState<any[]>([])
  const [merchants, setMerchants] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [show, setShow] = useState(false)
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
      setShow(false); setEditing(null); await reload()
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
        <button onClick={() => { setEditing(null); setShow(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white">
          <Plus size={13} /> Nova loja
        </button>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <form action={submit} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-3">
            <h3 className="font-bold text-amber-300">Loja</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField name="merchant_id" label="Comerciante" defaultValue={form.merchant_id} required
                options={merchants.map((m) => ({ value: m.id, label: m.name }))} />
              <F name="name" label="Nome da loja" defaultValue={form.name} required />
              <F name="slug" label="Slug" defaultValue={form.slug} required />
              <F name="sort_order" label="Ordem" type="number" defaultValue={String(form.sort_order)} />
            </div>
            <F name="description" label="Descrição" defaultValue={form.description ?? ''} textarea />

            <div className="border border-slate-700 rounded p-3 space-y-2">
              <p className="text-[11px] text-amber-300 font-bold">Horário real</p>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" name="always_open" defaultChecked={hours.always} /> Sempre aberto
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <F name="open_time" label="Abre" type="time" defaultValue={hours.open} />
                <F name="close_time" label="Fecha" type="time" defaultValue={hours.close} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <F name="requires_hero_level" label="Nível mín. do herói" type="number" defaultValue={form.requires_hero_level ?? ''} />
              <SelectField name="requires_zone_id" label="Zona obrigatória" defaultValue={form.requires_zone_id ?? ''}
                options={[{ value: '', label: '— qualquer —' }, ...zones.map((z) => ({ value: z.id, label: z.name }))]} />
            </div>

            <Field label="Banner">
              <ImageUpload label="Banner" fieldName="banner_url" folder="shops" value={form.banner_url}
                tooltipText="Banner da loja" hint="Imagem de capa"
                onChange={(url) => { (document.getElementById('s-banner') as HTMLInputElement). value = url }} />
              <input type="hidden" id="s-banner" name="banner_url" defaultValue={form.banner_url ?? ''} />
            </Field>

            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="is_active" defaultChecked={form.is_active} /> Ativa
            </label>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold">Salvar</button>
          </form>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-2">
        {rows.map((s) => (
          <div key={s.id} className="border border-slate-700 rounded bg-slate-900/70 p-3">
            <p className="font-bold text-sm text-amber-300">{s.name}</p>
            <p className="text-[10px] text-slate-500">por {s.merchants?.name ?? '—'}</p>
            <p className="text-[10px] text-slate-400">{fmtHours(s.opening_hours)}</p>
            <div className="flex gap-1 mt-2">
              <button onClick={() => { setEditing(s); setShow(true) }}
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
  const [show, setShow] = useState(false)
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
      setShow(false); setEditing(null); await reload()
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
          className="px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300" />
        <select value={shopFilter} onChange={(e) => setShopFilter(e.target.value)}
          className="px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300">
          <option value="">Todas as lojas</option>
          {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={() => { setEditing(null); setShow(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white">
          <Plus size={13} /> Adicionar
        </button>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <form action={submit} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-2xl space-y-3">
            <h3 className="font-bold text-amber-300">Item na loja</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField name="shop_id" label="Loja" defaultValue={editing?.shop_id ?? ''} required
                options={shops.map((s) => ({ value: s.id, label: s.name }))} />
              <SelectField name="item_id" label="Item" defaultValue={editing?.item_id ?? ''} required
                options={items.map((i) => ({ value: i.id, label: i.name }))} />
              <F name="base_price" label="Preço compra (Gallar)" type="number" defaultValue={String(editing?.base_price ?? 100)} />
              <F name="sell_price" label="Preço venda (Gallar)" type="number" defaultValue={String(editing?.sell_price ?? 50)} />
              <F name="stock" label="Estoque (-1 = inf.)" type="number" defaultValue={String(editing?.stock ?? -1)} />
            </div>
            <F name="min_hero_level" label="Nível mín. do herói" type="number" defaultValue={editing?.min_hero_level ?? ''} />
            <SelectField name="required_zone_id" label="Zona obrigatória" defaultValue={editing?.required_zone_id ?? ''}
              options={[{ value: '', label: '— qualquer —' }, ...zones.map((z) => ({ value: z.id, label: z.name }))]} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="is_enabled" defaultChecked={editing?.is_enabled ?? true} /> À venda
            </label>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold">Salvar</button>
          </form>
        </div>
      )}

      <div className="border border-slate-800 rounded overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-400">
            <tr className="text-left">
              <Th>Item</Th><Th>Loja</Th><Th>Compra</Th><Th>Venda</Th><Th>Estoque</Th><Th>Ativo</Th><Th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-slate-800">
                <Td>{r.items?.name ?? '—'}</Td>
                <Td className="text-slate-400">{r.shops?.name ?? '—'}</Td>
                <Td>
                  <input type="number" defaultValue={r.base_price}
                    onBlur={(e) => quick(r.id, { base_price: e.target.value })}
                    className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300" />
                </Td>
                <Td>
                  <input type="number" defaultValue={r.sell_price}
                    onBlur={(e) => quick(r.id, { sell_price: e.target.value })}
                    className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300" />
                </Td>
                <Td>
                  <input type="number" defaultValue={r.stock}
                    onBlur={(e) => quick(r.id, { stock: e.target.value })}
                    className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700" />
                </Td>
                <Td>
                  <input type="checkbox" checked={r.is_enabled}
                    onChange={(e) => quick(r.id, { is_enabled: e.target.checked })}
                    className="accent-amber-500" />
                </Td>
                <Td>
                  <button onClick={() => { setEditing(r); setShow(true) }}
                    className="p-1 rounded border border-slate-700 text-amber-400"><Pencil size={11} /></button>
                  <button onClick={() => start(async () => { await deleteShopItem(r.id); await reload() })}
                    className="p-1 rounded border border-slate-700 text-red-400 ml-1"><Trash2 size={11} /></button>
                </Td>
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
  const [show, setShow] = useState(false)
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
      setShow(false); setEditing(null); await reload()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <Counters items={[{ label: 'Eventos', value: rows.length }]} />
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShow(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white">
          <Plus size={13} /> Novo evento
        </button>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <form action={submit} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-2xl space-y-3">
            <h3 className="font-bold text-amber-300">Evento</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <F name="name" label="Nome" defaultValue={editing?.name ?? ''} required />
              <F name="slug" label="Slug" defaultValue={editing?.slug ?? ''} required />
              <F name="discount_percent" label="Desconto (%)" type="number" defaultValue={String(editing?.discount_percent ?? 0)} />
              <F name="starts_at" label="Começa em" type="datetime-local" defaultValue={editing?.starts_at ? new Date(editing.starts_at).toISOString().slice(0, 16) : ''} required />
              <F name="ends_at" label="Termina em" type="datetime-local" defaultValue={editing?.ends_at ? new Date(editing.ends_at).toISOString().slice(0, 16) : ''} required />
            </div>
            <F name="description" label="Descrição" defaultValue={editing?.description ?? ''} textarea />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /> Ativo
            </label>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold">Salvar</button>
          </form>
        </div>
      )}

      <div className="grid gap-2">
        {rows.map((e) => (
          <div key={e.id} className="border border-slate-700 rounded bg-slate-900/70 p-3">
            <p className="font-bold text-sm text-amber-300">{e.name}</p>
            <p className="text-[10px] text-slate-500">
              {new Date(e.starts_at).toLocaleString('pt-BR')} → {new Date(e.ends_at).toLocaleString('pt-BR')}
            </p>
            {e.discount_percent > 0 && (
              <p className="text-[10px] text-emerald-400 font-bold">-{e.discount_percent}% em todas as compras</p>
            )}
            <div className="flex gap-1 mt-2">
              <button onClick={() => { setEditing(e); setShow(true) }}
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
      <table className="w-full text-xs">
        <thead className="bg-slate-900 text-slate-400">
          <tr className="text-left"><Th>Jogador</Th><Th>Comerciante</Th><Th>Nível</Th><Th>XP</Th><Th>Vendeu</Th><Th>Comprou</Th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-800">
              <Td>{r.profiles?.username ?? r.player_id?.slice(0, 8)}</Td>
              <Td className="text-amber-300">{r.merchants?.name}</Td>
              <Td className="text-emerald-300 font-bold">{r.reputation_level}</Td>
              <Td>{Number(r.reputation_xp).toLocaleString('pt-BR')}</Td>
              <Td>{r.total_units_sold}</Td>
              <Td>{r.total_units_bought}</Td>
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
      <table className="w-full text-xs">
        <thead className="bg-slate-900 text-slate-400">
          <tr className="text-left"><Th>Quando</Th><Th>Tipo</Th><Th>Item</Th><Th>Qtd</Th><Th>Total</Th><Th>Loja</Th></tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-slate-800">
              <Td className="text-slate-500">{new Date(t.created_at).toLocaleString('pt-BR')}</Td>
              <Td className={t.trade_type === 'buy' ? 'text-amber-300' : 'text-emerald-300'}>{t.trade_type}</Td>
              <Td>{t.items?.name ?? '—'}</Td>
              <Td>{t.quantity}</Td>
              <Td>{Number(t.total_price).toLocaleString('pt-BR')}g</Td>
              <Td className="text-slate-400">{t.shops?.name ?? '—'}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ==================== HELPERS ====================

const inputCls = 'w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-xs text-slate-200 outline-none focus:border-amber-500'

function Field({ label, children }: any) {
  return <div className="space-y-1"><label className="block text-[11px] text-slate-400">{label}</label>{children}</div>
}

function F({ name, label, type = 'text', defaultValue, required, textarea }: any) {
  if (textarea) return <Field label={label}><textarea name={name} defaultValue={defaultValue} rows={3} className={inputCls} /></Field>
  return <Field label={label}><input name={name} type={type} defaultValue={defaultValue} required={required} className={inputCls} /></Field>
}

function SelectField({ name, label, options, defaultValue, required }: any) {
  return (
    <Field label={label}>
      <select name={name} defaultValue={defaultValue} required={required} className={inputCls}>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

function Th({ children }: any) { return <th className="px-2 py-1.5 font-bold uppercase text-[10px]">{children}</th> }
function Td({ children, className = '' }: any) { return <td className={`px-2 py-1.5 ${className}`}>{children}</td> }
