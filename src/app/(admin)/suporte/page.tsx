'use client'

import { useEffect, useState, useTransition } from 'react'
import { HelpCircle, Plus, Pencil, Trash2, Shield, Ticket, Clock, Mail, User, Zap, Settings, Info, X } from 'lucide-react'

import {
  listSupportCategories, createSupportCategory, updateSupportCategory, deleteSupportCategory,
  listGameMasters, createGameMaster, updateGameMaster, deleteGameMaster,
  listSupportTickets, createSupportTicket, updateSupportTicket, deleteSupportTicket,
  listSupportMessages, createSupportMessage, deleteSupportMessage,
  listOnlinePlayers,
} from '@/lib/actions/support'
import { Tooltip } from '@/components/ui/tooltip'

type Tab = 'chamados' | 'categorias' | 'gms' | 'online'

const STATUS_COLORS: Record<string, string> = {
  open: '#f59e0b',
  in_progress: '#3b82f6',
  waiting_player: '#a855f7',
  resolved: '#22c55e',
  closed: '#6b7280',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6b7280',
  normal: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
}

const inputCls = 'w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-sm text-slate-200 outline-none focus:border-amber-500'

export default function SuportePage() {
  const [tab, setTab] = useState<Tab>('chamados')
  const [tickets, setTickets] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [gms, setGMs] = useState<any[]>([])
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [ticketMessages, setTicketMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  const reload = () => start(async () => {
    const [t, c, g, o] = await Promise.all([
      listSupportTickets(),
      listSupportCategories(),
      listGameMasters(),
      listOnlinePlayers(),
    ])
    setTickets(t)
    setCategories(c)
    setGMs(g)
    setOnlinePlayers(o)
    setLoading(false)
  })

  useEffect(() => {
    reload()
  }, [])

  const openTicket = (ticket: any) => {
    setSelectedTicket(ticket)
    start(async () => {
      try {
        const msgs = await listSupportMessages(ticket.id)
        setTicketMessages(msgs)
      } catch (e: any) {
        setErr(e?.message ?? String(e))
      }
    })
  }

  const closeTicket = () => {
    setSelectedTicket(null)
    setTicketMessages([])
    setNewMessage('')
    setIsInternal(false)
    setEmailSent(false)
  }

  // ── Estatísticas resumidas ──
  const stats = {
    total: tickets.length,
    open: tickets.filter((t: any) => t.status === 'open').length,
    inProgress: tickets.filter((t: any) => t.status === 'in_progress').length,
    resolved: tickets.filter((t: any) => t.status === 'resolved').length,
    closed: tickets.filter((t: any) => t.status === 'closed').length,
    waitingPlayer: tickets.filter((t: any) => t.status === 'waiting_player').length,
    online: onlinePlayers.length,
  }

  // ── Verificar SLA expirado ──
  const isSLAExpired = (ticket: any) => {
    if (!ticket.sla_expires_at) return false
    return new Date(ticket.sla_expires_at) < new Date()
  }

  // ── Salvar mensagem ──
  const saveMessage = async (formData: FormData) => {
    if (!selectedTicket) return
    setErr('')
    try {
      await createSupportMessage(formData)
      const msgs = await listSupportMessages(selectedTicket.id)
      setTicketMessages(msgs)
      setNewMessage('')
      setIsInternal(false)
      setEmailSent(false)
    } catch (e: any) {
      setErr(e?.message ?? String(e))
    }
  }

  // ── Atualizar chamado ──
  const updateTicketAction = async (formData: FormData) => {
    if (!selectedTicket) return
    setErr('')
    try {
      await updateSupportTicket(selectedTicket.id, formData)
      await reload()
    } catch (e: any) {
      setErr(e?.message ?? String(e))
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-amber-400 flex items-center gap-2">
            <Ticket size={22} /> Suporte ao Jogador
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie chamados, categorias, GMs e SLA. Responda jogadores por email.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {([
            ['chamados', 'Chamados', Ticket],
            ['categorias', 'Categorias', Settings],
            ['gms', 'Game Masters', Shield],
            ['online', 'Jogadores Online', Zap],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border transition ${tab === key
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'chamados' && (
        <TicketsTab
          tickets={tickets}
          categories={categories}
          gms={gms}
          openTicket={openTicket}
          stats={stats}
          isSLAExpired={isSLAExpired}
          start={start}
          setErr={setErr}
          err={err}
          reload={reload}
        />
      )}
      {tab === 'categorias' && (
        <CategoriesTab categories={categories} reload={reload} />
      )}
      {tab === 'gms' && (
        <GMsTab gms={gms} reload={reload} />
      )}
      {tab === 'online' && (
        <OnlineTab onlinePlayers={onlinePlayers} />
      )}

      {/* Modal de detalhes do chamado */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          messages={ticketMessages}
          categories={categories}
          gms={gms}
          newMessage={newMessage}
          isInternal={isInternal}
          emailSent={emailSent}
          onClose={closeTicket}
          onNewMessage={setNewMessage}
          onIsInternal={setIsInternal}
          onEmailSent={setEmailSent}
          onSaveMessage={saveMessage}
          onUpdateTicket={updateTicketAction}
          isSLAExpired={isSLAExpired(selectedTicket)}
        />
      )}
    </div>
  )
}

// ==================== TABS ====================

function TicketsTab({ tickets, categories, gms, openTicket, stats, isSLAExpired, start, setErr, err, reload }: any) {
  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      {/* Lista de chamados */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge label="Total" value={stats.total} color="text-amber-300" />
          <Badge label="Abertos" value={stats.open} color="text-f59e0b" />
          <Badge label="Andamento" value={stats.inProgress} color="text-3b82f6" />
          <Badge label="Resolvidos" value={stats.resolved} color="text-22c55e" />
          <Badge label="Fechados" value={stats.closed} color="text-6b7280" />
          <Badge label="Esperando Jogador" value={stats.waitingPlayer} color="text-a855f7" />
        </div>

        <div className="border border-slate-700 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-xs uppercase">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Jogador</th>
                <th className="px-3 py-2 text-left">Categoria</th>
                <th className="px-3 py-2 text-left">GM</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Prioridade</th>
                <th className="px-3 py-2 text-left">SLA</th>
                <th className="px-3 py-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t: any) => {
                const slaExpired = isSLAExpired(t)
                return (
                  <tr key={t.id} className={`border-t border-slate-800 ${slaExpired ? 'bg-red-900/10' : ''}`}>
                    <td className="px-3 py-2 font-mono text-xs text-amber-300">{t.ticket_number}</td>
                    <td className="px-3 py-2 text-sm text-slate-300">{t.player_id?.slice(0, 8) ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-slate-400">{t.support_categories?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-slate-400">{t.game_masters?.name ?? 'Não atribuído'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PRIORITY_COLORS[t.priority]}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {slaExpired
                        ? <span className="text-red-400 font-bold">EXPIRADO</span>
                        : t.sla_expires_at ? new Date(t.sla_expires_at).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => openTicket(t)} className="p-1.5 rounded border border-slate-600 text-amber-400 hover:border-amber-500/60">
                        <User size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {tickets.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-500">Nenhum chamado cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form novo chamado */}
      <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3 sticky top-5">
        <h3 className="text-sm font-bold text-amber-400 uppercase">Novo Chamado</h3>
        <form action={(fd: FormData) => start(async () => {
          setErr('')
          try {
            await createSupportTicket(fd)
            await reload()
          } catch (e: any) { setErr(e?.message ?? String(e)) }
        })} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Número <Tooltip text="Identificador único do chamado. Ex: SUP-00123" /></label>
              <input name="ticket_number" required className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Jogador ID <Tooltip text="ID do jogador no Supabase auth" /></label>
              <input name="player_id" required className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Categoria <Tooltip text="Categoria do chamado" /></label>
              <select name="category_id" className={inputCls}>
                <option value="">— nenhuma —</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">GM <Tooltip text="Game Master responsável" /></label>
              <select name="gm_id" className={inputCls}>
                <option value="">— não atribuído —</option>
                {gms.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Status <Tooltip text="Status atual do chamado" /></label>
              <select name="status" defaultValue="open" className={inputCls}>
                <option value="open">Aberto</option>
                <option value="in_progress">Em Andamento</option>
                <option value="waiting_player">Esperando Jogador</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Prioridade <Tooltip text="Prioridade do chamado" /></label>
              <select name="priority" defaultValue="normal" className={inputCls}>
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Assunto <Tooltip text="Título curto do chamado" /></label>
            <input name="subject" required className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-400">Descrição <Tooltip text="Descrição detalhada do problema" /></label>
            <textarea name="description" rows={3} required className={inputCls} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">SLA (minutos) <Tooltip text="Tempo máximo para resposta em minutos" /></label>
              <input name="sla_minutes" type="number" defaultValue="60" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">SLA expira em <Tooltip text="Data e hora de expiração do SLA" /></label>
              <input name="sla_expires_at" type="datetime-local" className={inputCls} />
            </div>
          </div>
          {err && <p className="text-red-400 text-xs">{err}</p>}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Criar Chamado</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Badge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-3 py-2 rounded bg-slate-800 border border-slate-700">
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  )
}

function CategoriesTab({ categories, reload }: any) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      if (editing) await updateSupportCategory(editing.id, fd)
      else await createSupportCategory(fd)
      setShowForm(false); setEditing(null); await reload()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-amber-400">Categorias de Chamado</h3>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">
          <Plus size={14} /> Nova Categoria
        </button>
      </div>
      <p className="text-xs text-slate-400">
        <Info size={14} /> <Tooltip text="Categorias definem o tipo de chamado, tempo SLA e cor de exibição." />
      </p>

      {showForm && (
        <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <form action={submit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Nome <Tooltip text="Nome da categoria exibido ao jogador" /></label>
              <input name="name" defaultValue={editing?.name ?? ''} required className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Slug <Tooltip text="Identificador único (sem espaços)" /></label>
              <input name="slug" defaultValue={editing?.slug ?? ''} required className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Descrição <Tooltip text="Descrição da categoria" /></label>
              <input name="description" defaultValue={editing?.description ?? ''} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">SLA (min) <Tooltip text="Tempo máximo para resposta em minutos" /></label>
              <input name="sla_minutes" type="number" defaultValue={String(editing?.sla_minutes ?? 60)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Cor <Tooltip text="Cor de exibição da categoria" /></label>
              <input name="color" type="color" defaultValue={editing?.color ?? '#f59e0b'} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Ordem <Tooltip text="Ordem de exibição (menor = primeiro)" /></label>
              <input name="sort_order" type="number" defaultValue={String(editing?.sort_order ?? 0)} className={inputCls} />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /> Ativa
            </label>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 transition">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-slate-700 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-slate-400 text-xs uppercase">
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">SLA (min)</th>
              <th className="px-3 py-2 text-left">Cor</th>
              <th className="px-3 py-2 text-left">Ativa</th>
              <th className="px-3 py-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c: any) => (
              <tr key={c.id} className="border-t border-slate-800">
                <td className="px-3 py-2 text-sm">{c.name}</td>
                <td className="px-3 py-2 text-sm font-mono">{c.slug}</td>
                <td className="px-3 py-2 text-sm">{c.sla_minutes}</td>
                <td className="px-3 py-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                </td>
                <td className="px-3 py-2 text-sm">{c.is_active ? 'Sim' : 'Não'}</td>
                <td className="px-3 py-2">
                  <button onClick={() => { setEditing(c); setShowForm(true) }} className="p-1 rounded border border-slate-700 text-amber-400"><Pencil size={11} /></button>
                  <button onClick={() => start(async () => { await deleteSupportCategory(c.id); await reload() })} className="p-1 rounded border border-slate-700 text-red-400 ml-1"><Trash2 size={11} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GMsTab({ gms, reload }: any) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      if (editing) await updateGameMaster(editing.id, fd)
      else await createGameMaster(fd)
      setShowForm(false); setEditing(null); await reload()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-amber-400">Game Masters (GM)</h3>
        <button onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">
          <Plus size={14} /> Novo GM
        </button>
      </div>
      <p className="text-xs text-slate-400">
        <Info size={14} /> <Tooltip text="GMs são jogadores que ajudam a resolver chamados de suporte. Atribua chamados a um GM para acompanhamento." />
      </p>

      {showForm && (
        <div className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <form action={submit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">Nome <Tooltip text="Nome do GM exibido no chamado" /></label>
              <input name="name" defaultValue={editing?.name ?? ''} required className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Email <Tooltip text="Email do GM para notificações" /></label>
              <input name="email" type="email" defaultValue={editing?.email ?? ''} required className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Player ID <Tooltip text="ID do jogador no Supabase (opcional)" /></label>
              <input name="player_id" defaultValue={editing?.player_id ?? ''} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Discord <Tooltip text="Usuário do Discord (opcional)" /></label>
              <input name="discord" defaultValue={editing?.discord ?? ''} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Especialidade <Tooltip text="Área de atuação do GM" /></label>
              <input name="specialty" defaultValue={editing?.specialty ?? ''} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Máx. Chamados <Tooltip text="Limite de chamados simultâneos" /></label>
              <input name="max_tickets" type="number" defaultValue={String(editing?.max_tickets ?? 10)} className={inputCls} />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /> Ativo
            </label>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 transition">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-slate-700 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-slate-400 text-xs uppercase">
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Especialidade</th>
              <th className="px-3 py-2 text-left">Máx. Chamados</th>
              <th className="px-3 py-2 text-left">Ativo</th>
              <th className="px-3 py-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {gms.map((g: any) => (
              <tr key={g.id} className="border-t border-slate-800">
                <td className="px-3 py-2 text-sm">{g.name}</td>
                <td className="px-3 py-2 text-sm text-slate-400">{g.email}</td>
                <td className="px-3 py-2 text-sm">{g.specialty ?? '—'}</td>
                <td className="px-3 py-2 text-sm">{g.max_tickets}</td>
                <td className="px-3 py-2 text-sm">{g.is_active ? 'Sim' : 'Não'}</td>
                <td className="px-3 py-2">
                  <button onClick={() => { setEditing(g); setShowForm(true) }} className="p-1 rounded border border-slate-700 text-amber-400"><Pencil size={11} /></button>
                  <button onClick={() => start(async () => { await deleteGameMaster(g.id); await reload() })} className="p-1 rounded border border-slate-700 text-red-400 ml-1"><Trash2 size={11} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OnlineTab({ onlinePlayers }: any) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-amber-400">Jogadores Online</h3>
      <p className="text-xs text-slate-400">
        <Info size={14} /> <Tooltip text="Jogadores com sessão ativa no app. Os dados vêm do rastreamento de sessão do cliente." />
      </p>

      <div className="border border-slate-700 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-slate-400 text-xs uppercase">
              <th className="px-3 py-2 text-left">Jogador ID</th>
              <th className="px-3 py-2 text-left">Último Acesso</th>
              <th className="px-3 py-2 text-left">Sessão</th>
              <th className="px-3 py-2 text-left">Dispositivo</th>
            </tr>
          </thead>
          <tbody>
            {onlinePlayers.map((p: any) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="px-3 py-2 font-mono text-xs text-amber-300">{p.player_id?.slice(0, 8) ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-slate-300">{new Date(p.last_seen_at).toLocaleString('pt-BR')}</td>
                <td className="px-3 py-2 text-xs text-slate-400">{p.session_id?.slice(0, 8) ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-slate-400">{p.device_info ?? '—'}</td>
              </tr>
            ))}
            {onlinePlayers.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">Nenhum jogador online no momento.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== MODAL DETALHE DO CHAMADO ====================

function TicketDetailModal({
  ticket,
  messages,
  categories,
  gms,
  newMessage,
  isInternal,
  emailSent,
  onClose,
  onNewMessage,
  onIsInternal,
  onEmailSent,
  onSaveMessage,
  onUpdateTicket,
  isSLAExpired,
}: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-amber-400">{ticket.subject}</h3>
            <p className="text-xs text-slate-400">#{ticket.ticket_number} • {ticket.player_id?.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="px-6 py-4 border-b border-slate-700">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500 uppercase">Status</p>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[ticket.status]}`}>{ticket.status}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Prioridade</p>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Categoria</p>
              <span className="text-sm text-slate-300">{ticket.support_categories?.name ?? '—'}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">GM</p>
              <span className="text-sm text-slate-300">{ticket.game_masters?.name ?? 'Não atribuído'}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">SLA</p>
              <span className={`text-sm ${isSLAExpired ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                {ticket.sla_expires_at ? new Date(ticket.sla_expires_at).toLocaleString('pt-BR') : '—'}
                {isSLAExpired && <span className="ml-1 text-[10px]">⚠ EXPIRADO</span>}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-500 uppercase">Descrição</p>
            <p className="text-sm text-slate-300 whitespace-pre-line">{ticket.description}</p>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-slate-500 mt-10">Nenhuma mensagem ainda.</p>
          )}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.sender_type === 'player' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                m.sender_type === 'player'
                  ? 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-none'
                  : m.sender_type === 'gm'
                  ? 'bg-amber-900/30 border border-amber-500/30 text-amber-300 rounded-tr-none'
                  : 'bg-slate-900 border border-slate-700/50 text-slate-500'
              } ${m.is_internal ? 'bg-red-900/20 border border-red-800/50' : ''}`}>
                <p className="text-xs text-slate-400 mb-1">
                  {m.sender_type === 'player' ? 'Jogador' : m.sender_type === 'gm' ? 'GM' : 'Sistema'}
                  {m.is_internal && ' <span class="text-[9px] text-red-400 ml-1">(Interna)</span>'}
                </p>
                <p className="text-sm whitespace-pre-line">{m.message}</p>
                <p className="text-[10px] text-slate-500 mt-1">{m.email_sent ? '✉ Email enviado' : ''}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form nova mensagem */}
        <div className="border-t border-slate-700 p-4 bg-slate-950">
          <form action={(fd: FormData) => onSaveMessage(fd)} className="grid gap-2 sm:grid-cols-4">
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <input type="hidden" name="sender_type" value="gm" />
            <div className="flex-1">
              <textarea name="message" rows={2} placeholder="Digite sua resposta…" className={inputCls} required />
            </div>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" name="is_internal" defaultChecked={isInternal} onChange={(e: any) => onIsInternal(e.target.checked)} /> Interna
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" name="email_sent" defaultChecked={emailSent} onChange={(e: any) => onEmailSent(e.target.checked)} /> Enviar Email
            </label>
            <button className="px-4 py-2 rounded bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition">Enviar</button>
          </form>
        </div>

        {/* Ações rápidas */}
        <div className="border-t border-slate-700 p-4 flex gap-2">
          <form action={(fd: FormData) => onUpdateTicket(fd)} className="flex-1">
            <input type="hidden" name="status" value="in_progress" />
            <button className="w-full py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition">Iniciar Andamento</button>
          </form>
          <form action={(fd: FormData) => onUpdateTicket(fd)} className="flex-1">
            <input type="hidden" name="status" value="waiting_player" />
            <button className="w-full py-2 rounded bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition">Esperar Jogador</button>
          </form>
          <form action={(fd: FormData) => onUpdateTicket(fd)} className="flex-1">
            <input type="hidden" name="status" value="resolved" />
            <button className="w-full py-2 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition">Resolver</button>
          </form>
          <form action={(fd: FormData) => onUpdateTicket(fd)} className="flex-1">
            <input type="hidden" name="status" value="closed" />
            <button className="w-full py-2 rounded bg-rose-600 text-white text-sm font-medium hover:bg-rose-500 transition">Fechar</button>
          </form>
        </div>
      </div>
    </div>
  )
}
