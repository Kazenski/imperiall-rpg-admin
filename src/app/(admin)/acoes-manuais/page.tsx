'use client'

import { useEffect, useState, useTransition } from 'react'
import { Zap, Plus, Pencil, Trash2, Clock, Shield, Hammer, Factory, Info } from 'lucide-react'

import {
  listManualActionsWithInteractions, createManualAction, updateManualAction, deleteManualAction,
  addActionInteraction, updateActionInteraction, deleteActionInteraction,
  listVassals,
} from '@/lib/actions/vassals'
import { Tooltip } from '@/components/ui/tooltip'
import { Counters } from '@/components/ui/data-table'

const AFFINITY_COLORS: Record<string, string> = {
  ideal: '#22c55e',
  ok: '#3b82f6',
  improper: '#ef4444',
}

type Tab = 'acoes' | 'interacoes'

export default function AcoesManuaisPage() {
  const [actions, setActions] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('acoes')
  const [, start] = useTransition()

  const reload = () => start(async () => {
    const list = await listManualActionsWithInteractions()
    setActions(list)
    setActive((cur: any) => (cur ? list.find((a) => a.id === cur.id) ?? cur : list[0] ?? null))
  })

  useEffect(() => {
    let alive = true
    listManualActionsWithInteractions().then((list) => {
      if (!alive) return
      setActions(list)
      setActive(list[0] ?? null)
    })
    return () => { alive = false }
  }, [])

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-amber-400 flex items-center gap-2">
            <Hammer size={22} /> Ações Manuais
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Life skills (mineração, ervas, comida, etc.) que vassalos executam com cooldown.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {([
            ['acoes', 'Ações', Hammer],
            ['interacoes', 'Interações × Vassalo', Factory],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              disabled={key !== 'acoes' && !active}
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
            <p className="text-sm text-slate-400 font-bold uppercase">Ações</p>
            <button onClick={() => { setActive(null); setTab('acoes') }}
              className="p-1 rounded border border-slate-700 text-amber-400 hover:border-amber-500/60">
              <Plus size={12} />
            </button>
          </div>
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => setActive(a)}
              className={`w-full flex items-center gap-2 p-2 rounded border text-left transition ${
                active?.id === a.id
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              <div className="w-9 h-9 rounded border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                <Zap size={14} className="text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-200 truncate">{a.name}</p>
                <p className="text-xs text-slate-500 truncate">{a.cooldown_seconds}s cooldown</p>
              </div>
            </button>
          ))}
          {actions.length === 0 && (
            <p className="text-sm text-slate-600 px-2">Nenhuma ação cadastrada.</p>
          )}
        </aside>

        <main className="space-y-3">
          {tab === 'acoes' && <ActionForm editing={active} onDone={reload} />}
          {tab === 'interacoes' && active && <InteractionsTab action={active} onDone={reload} />}
        </main>
      </div>
    </div>
  )
}

// ==================== ACTION FORM ====================

function ActionForm({ editing, onDone }: any) {
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [, start] = useTransition()
  const f = editing ?? {
    slug: '', name: '', description: '', icon_url: '',
    cooldown_seconds: 3600, energy_cost: 10, base_result_qty: 1,
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
            await deleteManualAction(editing.id)
            onDone()
          })} className="flex items-center gap-1.5 px-4 py-2 rounded border border-red-800 text-red-400 hover:bg-red-900/20">
            <Trash2 size={14} /> Apagar
          </button>
        </div>
      )}

      {(!editing || show) && (
        <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-lg font-bold text-amber-400">{editing ? 'Editar' : 'Nova'} Ação Manual</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Nome <Tooltip text="Nome da ação exibido ao jogador" /></label>
              <input name="name" defaultValue={f.name} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Slug <Tooltip text="Identificador único (sem espaços). Ex: mineracao, herborismo" /></label>
              <input name="slug" defaultValue={f.slug} required className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Descrição <Tooltip text="Descrição detalhada da ação para o jogador" /></label>
              <textarea name="description" rows={2} defaultValue={f.description ?? ''} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Ícone <Tooltip text="URL do ícone da ação" /></label>
              <input name="icon_url" defaultValue={f.icon_url ?? ''} className={inputCls} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-sm">Cooldown (seg) <Tooltip text="Tempo em segundos que o jogador deve esperar entre execuções" /></label>
              <input name="cooldown_seconds" type="number" defaultValue={String(f.cooldown_seconds)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Energia <Tooltip text="Custo de energia do vassalo por execução" /></label>
              <input name="energy_cost" type="number" defaultValue={String(f.energy_cost)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Qtd base <Tooltip text="Quantidade base de itens obtidos na ação" /></label>
              <input name="base_result_qty" type="number" defaultValue={String(f.base_result_qty)} className={inputCls} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={f.is_active} /> Ativa
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

// ==================== INTERAÇÕES AÇÃO × VASSALO ====================

function InteractionsTab({ action, onDone }: any) {
  const [rows, setRows] = useState<any[]>(action.action_vassal_interactions || [])
  const [vassals, setVassals] = useState<any[]>([])
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  useEffect(() => {
    let alive = true
    listVassals().then((r) => { if (alive) setVassals(r) })
    return () => { alive = false }
  }, [])

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      fd.set('action_id', action.id)
      if (editing) await updateActionInteraction(editing.id, fd)
      else await addActionInteraction(fd)
      setShow(false); setEditing(null); onDone()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-amber-400">Interações × Vassalo</h3>
        <button onClick={() => { setEditing(null); setShow(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">
          <Plus size={14} /> Nova interação
        </button>
      </div>

      <p className="text-xs text-slate-400">
        <Info size={14} /> <Tooltip text="Defina para cada vassalo: tempo de conclusão, energia, multiplicador de resultado e quantidade de itens. Use para balancear qual vassalo é melhor em cada ação." />
      </p>

      {rows.length === 0 && <p className="text-sm text-slate-600">Nenhuma interação cadastrada.</p>}
      <div className="border border-slate-800 rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1.5">Vassalo</th>
              <th className="px-2 py-1.5">Afinidade</th>
              <th className="px-2 py-1.5">Tempo (s)</th>
              <th className="px-2 py-1.5">Energia</th>
              <th className="px-2 py-1.5">Multiplicador</th>
              <th className="px-2 py-1.5">Qtd itens</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i: any) => {
              const aff = i.vassals?.vassal_affinities?.find((fa: any) => fa.action_id === action.id)
              const affType = aff?.affinity_type || 'ok'
              const affColor = AFFINITY_COLORS[affType] || AFFINITY_COLORS.ok
              return (
                <tr key={i.id} className="border-t border-slate-800">
                  <td className="px-2 py-1.5">{i.vassals?.name ?? '—'}</td>
                  <td className={`px-2 py-1.5 text-[10px] font-bold ${affColor}`}>{affType}</td>
                  <td className="px-2 py-1.5">{i.completion_seconds}</td>
                  <td className="px-2 py-1.5">{i.energy_cost}</td>
                  <td className="px-2 py-1.5 text-amber-300 font-mono">{i.result_multiplier}x</td>
                  <td className="px-2 py-1.5">{i.result_qty}</td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => { setEditing(i); setShow(true) }}
                      className="p-1 rounded border border-slate-700 text-amber-400"><Pencil size={11} /></button>
                    <button onClick={() => start(async () => { await deleteActionInteraction(i.id); onDone() })}
                      className="p-1 rounded border border-slate-700 text-red-400 ml-1"><Trash2 size={11} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <h3 className="text-lg font-bold text-amber-400">{editing ? 'Editar' : 'Nova'} Interação</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm">Vassalo <Tooltip text="Vassalo que pode executar esta ação" /></label>
              <select name="vassal_id" defaultValue={editing?.vassal_id ?? ''} required className={inputCls}>
                <option value="">— escolha —</option>
                {vassals.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Tempo (seg) <Tooltip text="Tempo em segundos para o vassalo concluir a ação" /></label>
              <input name="completion_seconds" type="number" defaultValue={String(editing?.completion_seconds ?? 300)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Energia <Tooltip text="Custo de energia para este vassalo nesta ação" /></label>
              <input name="energy_cost" type="number" defaultValue={String(editing?.energy_cost ?? 10)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Multiplicador <Tooltip text="Multiplicador de recompensa (1.0 = normal, 1.1 = +10%, até 3.0)" /></label>
              <input name="result_multiplier" type="number" step="0.1" defaultValue={String(editing?.result_multiplier ?? 1.0)} className={inputCls} />
            </div>
            <div>
              <label className="text-sm">Qtd itens <Tooltip text="Quantidade de itens obtidos (1x, 1.1x, até 3x)" /></label>
              <input name="result_qty" type="number" defaultValue={String(editing?.result_qty ?? 1)} className={inputCls} />
            </div>
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

// ==================== HELPERS ====================

const inputCls = 'w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-sm text-slate-200 outline-none focus:border-amber-500'
