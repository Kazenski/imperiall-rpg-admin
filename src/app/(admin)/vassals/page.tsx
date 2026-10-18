'use client'

import { useEffect, useState, useTransition } from 'react'
import { PawPrint, Plus, Pencil, Trash2, Sparkles, Edit, DollarSign, Zap, Shield, Info, Layers } from 'lucide-react'

import {
  listVassalsWithAffinities, createVassal, updateVassal, deleteVassal,
  addVassalAffinity, updateVassalAffinity, deleteVassalAffinity,
  listManualActions,
  upsertVassalLevelRule, listVassalLevelRules, deleteVassalLevelRule,
} from '@/lib/actions/vassals'
import { ImageUpload } from '@/components/ui/image-upload'
import { Tooltip } from '@/components/ui/tooltip'
import { Counters } from '@/components/ui/data-table'

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
}

const AFFINITY_COLORS: Record<string, string> = {
  ideal: '#22c55e',
  ok: '#3b82f6',
  improper: '#ef4444',
}

type Tab = 'vassalos' | 'afinidades' | 'niveis'

export default function VassalsPage() {
  const [vassals, setVassals] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('vassalos')
  const [, start] = useTransition()

  const reload = () => start(async () => {
    const list = await listVassalsWithAffinities()
    setVassals(list)
    setActive((cur: any) => (cur ? list.find((v) => v.id === cur.id) ?? cur : list[0] ?? null))
  })

  useEffect(() => {
    let alive = true
    listVassalsWithAffinities().then((list) => {
      if (!alive) return
      setVassals(list)
      setActive(list[0] ?? null)
    })
    return () => { alive = false }
  }, [])

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-amber-400 flex items-center gap-2">
            <PawPrint size={22} /> Vassalos
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Heróis de suporte para ações AFK (mineração, ervas, comida, etc.). Não usam em combate.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {([
            ['vassalos', 'Vassalos', PawPrint],
            ['afinidades', 'Afinidades', Edit],
            ['niveis', 'Regras de Nível', Layers],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              disabled={key !== 'vassalos' && !active}
              onClick={() => setTab(key as Tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border transition disabled:opacity-40 ${
                tab === key
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <aside className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400 font-bold uppercase">Vassalos</p>
            <button onClick={() => { setActive(null); setTab('vassalos') }}
              className="p-1 rounded border border-slate-700 text-amber-400 hover:border-amber-500/60">
              <Plus size={12} />
            </button>
          </div>
          {vassals.map((v) => (
            <button
              key={v.id}
              onClick={() => setActive(v)}
              className={`w-full flex items-center gap-2 p-2 rounded border text-left transition ${
                active?.id === v.id
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              {v.image_url
                ? <img src={v.image_url} className="w-9 h-9 rounded object-cover border border-amber-500/30" />
                : <div className="w-9 h-9 rounded border border-slate-700 bg-slate-800 flex items-center justify-center">
                    <PawPrint size={14} className="text-amber-600" />
                  </div>}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-200 truncate">{v.name}</p>
                <p className="text-xs text-slate-500 truncate">{v.class_name || '—'}</p>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${RARITY_COLORS[v.rarity] || RARITY_COLORS.common}`}>
                {v.rarity.slice(0, 3).toUpperCase()}
              </span>
              {v.is_for_sale && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/20 text-green-300 border border-green-500/30">À VENDA</span>}
            </button>
          ))}
          {vassals.length === 0 && (
            <p className="text-sm text-slate-600 px-2">Nenhum vassalo cadastrado.</p>
          )}
        </aside>

        <main className="space-y-3">
          {tab === 'vassalos' && <VassalForm editing={active} onDone={reload} />}
          {tab === 'afinidades' && active && <AffinitiesTab vassal={active} onDone={reload} />}
          {tab === 'niveis' && <LevelsTab onDone={reload} />}
        </main>
      </div>
    </div>
  )
}

// ==================== VASSAL FORM ====================

function VassalForm({ editing, onDone }: any) {
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [, start] = useTransition()
  const f = editing ?? {
    slug: '', name: '', class_name: '', description: '', image_url: '', image_attack_url: '',
    rarity: 'common',
    price_real: 0, price_gold: 0, is_for_sale: false,
    base_energy: 100, base_speed: 100,
    is_active: true, sort_order: 0,
  }

  return (
    <div className="space-y-3">
      {!show && editing && (
        <div className="flex gap-2">
          <button onClick={() => setShow(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">
            <Pencil size={14} /> Editar
          </button>
          <button onClick={() => start(async () => {
            if (!confirm(`Apagar "${editing.name}"?`)) return
            await deleteVassal(editing.id)
            onDone()
          })} className="flex items-center gap-1.5 px-4 py-2 rounded border border-red-800 text-red-400 hover:bg-red-900/20">
            <Trash2 size={14} /> Apagar
          </button>
        </div>
      )}

      {(!editing || show) && (
        <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-lg font-bold text-amber-400">{editing ? 'Editar' : 'Novo'} Vassalo</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Nome <Tooltip text="Nome do vassalo exibido ao jogador" /></label>
              <input name="name" defaultValue={f.name} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Slug <Tooltip text="Identificador único (sem espaços). Ex: minerador_anao" /></label>
              <input name="slug" defaultValue={f.slug} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Classe <Tooltip text="Classe do vassalo. Ex: Minerador, Herborista, Cozinheiro" /></label>
              <input name="class_name" defaultValue={f.class_name ?? ''} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Raridade <Tooltip text="Raridade do vassalo afeta visual e valor" /></label>
              <select name="rarity" defaultValue={f.rarity} className={inputCls}>
                <option value="common">Comum</option>
                <option value="uncommon">Incomum</option>
                <option value="rare">Raro</option>
                <option value="epic">Épico</option>
                <option value="legendary">Lendário</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm">Descrição <Tooltip text="Descrição do vassalo exibida ao jogador" /></label>
            <textarea name="description" rows={2} defaultValue={f.description ?? ''} className={inputCls} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Imagem <Tooltip text="Imagem do vassalo (parado)" /></label>
              <ImageUpload label="Imagem" fieldName="image_url" folder="vassals" value={f.image_url ?? ''}
                tooltipText="Imagem do vassalo" hint="PNG/JPG quadrado"
                onChange={(url) => { (document.getElementById('v-img') as HTMLInputElement).value = url }} />
              <input type="hidden" id="v-img" name="image_url" defaultValue={f.image_url ?? ''} />
            </div>
            <div>
              <label className="text-sm">Imagem Ataque <Tooltip text="Imagem do vassalo executando ação" /></label>
              <ImageUpload label="Ataque" fieldName="image_attack_url" folder="vassals" value={f.image_attack_url ?? ''}
                tooltipText="Imagem de ação" hint="PNG/JPG quadrado"
                onChange={(url) => { (document.getElementById('v-atk-img') as HTMLInputElement).value = url }} />
              <input type="hidden" id="v-atk-img" name="image_attack_url" defaultValue={f.image_attack_url ?? ''} />
            </div>
          </div>

          <div className="border border-slate-700 rounded p-3 space-y-2">
            <p className="text-sm text-amber-300 font-bold uppercase">Preço de venda</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm">Reais (R$) <Tooltip text="Preço em reais para venda com dinheiro real" /></label>
                <input name="price_real" type="number" step="0.01" defaultValue={String(f.price_real)} className={inputCls} />
              </div>
              <div>
                <label className="text-sm">Moedas (Gallar) <Tooltip text="Preço em moedas do jogo para compra" /></label>
                <input name="price_gold" type="number" defaultValue={String(f.price_gold)} className={inputCls} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_for_sale" defaultChecked={f.is_for_sale} /> À venda
                <Tooltip text="Marque para este vassalo aparecer na loja de venda" />
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Energia base <Tooltip text="Energia máxima do vassalo para executar ações" /></label>
              <input name="base_energy" type="number" defaultValue={String(f.base_energy)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Velocidade base <Tooltip text="Velocidade base para concluir ações" /></label>
              <input name="base_speed" type="number" defaultValue={String(f.base_speed)} className={inputCls} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={f.is_active} /> Ativo
          </label>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Salvar</button>
            {editing && <button type="button" onClick={() => setShow(false)} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 transition">Cancelar</button>}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== AFINIDADES ====================

function AffinitiesTab({ vassal, onDone }: any) {
  const [rows, setRows] = useState<any[]>(vassal.vassal_affinities || [])
  const [actions, setActions] = useState<any[]>([])
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  useEffect(() => {
    let alive = true
    listManualActions().then((r) => { if (alive) setActions(r) })
    return () => { alive = false }
  }, [])

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      fd.set('vassal_id', vassal.id)
      if (editing) await updateVassalAffinity(editing.id, fd)
      else await addVassalAffinity(fd)
      setShow(false); setEditing(null); onDone()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShow(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">
          <Plus size={14} /> Nova afinidade
        </button>
      </div>
      {rows.length === 0 && <p className="text-sm text-slate-600">Nenhuma afinidade cadastrada.</p>}
      <div className="grid gap-2">
        {rows.map((a: any) => (
          <div key={a.id} className="border border-slate-700 rounded bg-slate-900/60 p-3 flex gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-200">{a.manual_actions?.name ?? '—'}</p>
              <p className="text-xs text-slate-500">Tipo: {a.affinity_type}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => { setEditing(a); setShow(true) }}
                className="p-1.5 rounded border border-slate-700 text-amber-400"><Pencil size={11} /></button>
              <button onClick={() => start(async () => { await deleteVassalAffinity(a.id); onDone() })}
                className="p-1.5 rounded border border-slate-700 text-red-400"><Trash2 size={11} /></button>
            </div>
          </div>
        ))}
      </div>
      {show && (
        <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-lg font-bold text-amber-400">{editing ? 'Editar' : 'Nova'} Afinidade</h3>
          <div>
            <label className="text-sm">Ação <Tooltip text="Ação manual que este vassalo pode executar" /></label>
            <select name="action_id" defaultValue={editing?.action_id ?? ''} required className={inputCls}>
              <option value="">— escolha —</option>
              {actions.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Tipo de afinidade <Tooltip text="Ideal = bônus, Ok = normal, Improper = -50% resultado" /></label>
            <select name="affinity_type" defaultValue={editing?.affinity_type ?? 'ok'} className={inputCls}>
              <option value="ideal">Ideal (bônus)</option>
              <option value="ok">Ok (normal)</option>
              <option value="improper">Impróprio (-50%)</option>
            </select>
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Salvar</button>
            <button type="button" onClick={() => setShow(false)} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 transition">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== REGRAS DE NÍVEL ====================

function LevelsTab({ onDone }: any) {
  const [rows, setRows] = useState<any[]>([])
  const [err, setErr] = useState('')
  const [editingRow, setEditingRow] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [, start] = useTransition()

  const reload = () => start(async () => setRows(await listVassalLevelRules()))
  useEffect(() => { reload() }, [])

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      await upsertVassalLevelRule(fd)
      await reload()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-amber-400">Regras de Nível do Vassalo</h3>
        <button onClick={() => { setEditingRow(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">
          <Plus size={14} /> Nova regra
        </button>
      </div>

      <p className="text-xs text-slate-400">
        <Info size={14} /> <Tooltip text="Cada vassalo ganha XP ao concluir ações. Quando atinge o XP necessário, sobe de nível. O custo de energia e velocidade podem mudar por nível." />
      </p>

      <div className="border border-slate-700 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1.5">Nível</th>
              <th className="px-2 py-1.5">XP necessário</th>
              <th className="px-2 py-1.5">XP por ação</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.level} className="border-t border-slate-800">
                <td className="px-2 py-1.5 font-bold text-amber-300">{r.level}</td>
                <td className="px-2 py-1.5">{Number(r.xp_required).toLocaleString('pt-BR')}</td>
                <td className="px-2 py-1.5">{r.xp_per_action}</td>
                <td className="px-2 py-1.5">
                  <button onClick={() => start(async () => { await deleteVassalLevelRule(r.level); await reload() })}
                    className="p-1 rounded border border-slate-700 text-red-400"><Trash2 size={11} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {setShowForm && (
        <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-lg font-bold text-amber-400">Nova Regra de Nível</h3>
          <form action={submit} className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-sm">Nível <Tooltip text="Nível do vassalo (1, 2, 3...)" /></label>
              <input name="level" type="number" defaultValue={String(editingRow?.level ?? 1)} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">XP necessário <Tooltip text="XP total acumulado para alcançar este nível" /></label>
              <input name="xp_required" type="number" defaultValue={String(editingRow?.xp_required ?? 0)} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">XP por ação <Tooltip text="XP ganho por cada ação concluída neste nível" /></label>
              <input name="xp_per_action" type="number" defaultValue={String(editingRow?.xp_per_action ?? 10)} required className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 transition">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// ==================== HELPERS ====================

const inputCls = 'w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-sm text-slate-200 outline-none focus:border-amber-500'

function Field({ label, children }: any) {
  return <div className="space-y-1"><label className="block text-[11px] text-slate-400">{label}</label>{children}</div>
}
