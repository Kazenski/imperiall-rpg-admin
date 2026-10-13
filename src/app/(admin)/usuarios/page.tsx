'use client'

import { useState, useEffect, useTransition } from 'react'
import { listUsers, setUserRole, listPunishments, punishUser, revokePunishment } from '@/lib/actions/users'
import { Tooltip } from '@/components/ui/tooltip'
import { DetailModal, DetailRow } from '@/components/ui/detail-modal'
import { Search, ShieldAlert, VolumeX, Ban, Undo2, Crown, Eye } from 'lucide-react'

const DURATIONS = [
  { label: '10 minutos', minutes: 10 },
  { label: '1 hora', minutes: 60 },
  { label: '24 horas', minutes: 1440 },
  { label: '7 dias', minutes: 10080 },
  { label: '30 dias', minutes: 43200 },
  { label: 'Permanente', minutes: 0 },
]

function isActive(date?: string | null) {
  return !!date && new Date(date).getTime() > Date.now()
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [punishing, setPunishing] = useState<{ user: any; type: string } | null>(null)
  const [reason, setReason] = useState('')
  const [minutes, setMinutes] = useState(60)
  const [isPending, startTransition] = useTransition()

  const load = (s = search) => listUsers(s).then(setUsers).catch(() => setUsers([]))
  useEffect(() => { load('') }, [])

  const openDetail = (user: any) => {
    setViewing(user)
    listPunishments(user.id).then(setHistory).catch(() => setHistory([]))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => load(search))
  }

  const handleRole = (id: string, role: 'user' | 'admin') => {
    if (!confirm(role === 'admin' ? 'Promover a admin?' : 'Remover admin?')) return
    startTransition(() => setUserRole(id, role).then(() => load()))
  }

  const handlePunish = (e: React.FormEvent) => {
    e.preventDefault()
    if (!punishing) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('type', punishing.type)
      fd.set('reason', reason)
      fd.set('minutes', String(minutes))
      await punishUser(punishing.user.id, fd)
      setPunishing(null); setReason(''); setMinutes(60); load()
      if (viewing && viewing.id === punishing.user.id) {
        listPunishments(viewing.id).then(setHistory).catch(() => {})
      }
    })
  }

  const handleRevoke = (punId: string, playerId: string, type: string) => {
    if (!confirm('Remover esta punição?')) return
    startTransition(() => revokePunishment(punId, playerId, type).then(() => {
      load()
      if (viewing) listPunishments(viewing.id).then(setHistory).catch(() => {})
    }))
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Usuários</h2>
        <p className="text-sm text-muted-foreground">Veja jogadores, promova a admin, silencie (mute) ou bana. O jogo bloqueia o acesso pelo <code>banned_until</code> e o chat pelo <code>muted_until</code>.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-2 top-2.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome..." className="w-full border rounded pl-8 pr-2 py-1.5" />
        </div>
        <button type="submit" className="px-4 py-1.5 border rounded">Buscar</button>
      </form>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Jogador</th><th className="p-2 text-left">Nível</th><th className="p-2 text-left">Função</th>
              <th className="p-2 text-left">Status</th><th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const muted = isActive(u.muted_until)
              const banned = isActive(u.banned_until)
              return (
                <tr key={u.id} className="border-t">
                  <td className="p-2">
                    <button onClick={() => openDetail(u)} className="underline underline-offset-2 hover:text-primary text-left font-medium">
                      {u.display_name || u.username}
                    </button>
                    <div className="text-xs text-muted-foreground">@{u.username}</div>
                  </td>
                  <td className="p-2">Nv {u.level} <span className="text-muted-foreground">({u.xp} xp)</span></td>
                  <td className="p-2">{u.role === 'admin' ? <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Admin</span> : 'Jogador'}</td>
                  <td className="p-2">
                    {banned && <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 mr-1">Banido</span>}
                    {muted && <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">Silenciado</span>}
                    {!banned && !muted && <span className="text-muted-foreground">OK</span>}
                  </td>
                  <td className="p-2 flex flex-wrap gap-2">
                    <button onClick={() => openDetail(u)} className="text-green-700 underline inline-flex items-center gap-1"><Eye size={12} /> Ver</button>
                    <button onClick={() => setPunishing({ user: u, type: 'mute' })} className="text-orange-600 underline inline-flex items-center gap-1"><VolumeX size={12} /> Silenciar</button>
                    <button onClick={() => setPunishing({ user: u, type: 'ban' })} className="text-red-600 underline inline-flex items-center gap-1"><Ban size={12} /> Banir</button>
                    {u.role === 'admin'
                      ? <button onClick={() => handleRole(u.id, 'user')} className="underline inline-flex items-center gap-1">Remover admin</button>
                      : <button onClick={() => handleRole(u.id, 'admin')} className="underline inline-flex items-center gap-1"><Crown size={12} /> Tornar admin</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum usuário encontrado. Se a lista está sempre vazia, rode o <code>dev_open_access.sql</code> no banco.</p>}
      </div>

      {viewing && (
        <DetailModal title={viewing.display_name || viewing.username} onClose={() => setViewing(null)}>
          <DetailRow label="Usuário" value={<span>@{viewing.username}</span>} />
          <DetailRow label="Nível / XP" value={`${viewing.level} / ${viewing.xp}`} />
          <DetailRow label="Função" value={viewing.role} />
          <DetailRow label="Silenciado até" value={viewing.muted_until ? new Date(viewing.muted_until).toLocaleString('pt-BR') : '—'} />
          <DetailRow label="Banido até" value={viewing.banned_until ? new Date(viewing.banned_until).toLocaleString('pt-BR') : '—'} />
          <h4 className="font-semibold mt-4 mb-2 flex items-center gap-1"><ShieldAlert size={14} /> Histórico de punições</h4>
          {history.length === 0 && <p className="text-sm text-muted-foreground">Sem punições registradas.</p>}
          {history.map(h => (
            <div key={h.id} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
              <span>
                <strong>{h.type === 'mute' ? 'Silêncio' : h.type === 'ban' ? 'Ban' : 'Advertência'}</strong>
                {h.reason ? ` — ${h.reason}` : ''}
                <span className="text-muted-foreground"> ({new Date(h.created_at).toLocaleString('pt-BR')}{h.expires_at ? ` até ${new Date(h.expires_at).toLocaleString('pt-BR')}` : ', permanente'}{h.revoked_at ? ', revogada' : ''})</span>
              </span>
              {!h.revoked_at && (h.type === 'mute' || h.type === 'ban') && (
                <button onClick={() => handleRevoke(h.id, viewing.id, h.type)} className="underline inline-flex items-center gap-1"><Undo2 size={12} /> Remover</button>
              )}
            </div>
          ))}
        </DetailModal>
      )}

      {punishing && (
        <DetailModal title={`${punishing.type === 'mute' ? 'Silenciar' : punishing.type === 'ban' ? 'Banir' : 'Advertir'} ${punishing.user.display_name || punishing.user.username}`} onClose={() => setPunishing(null)}>
          <form onSubmit={handlePunish} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Duração <Tooltip text="Por quanto tempo vale a punição. Permanente deixa sem prazo (só sai com remoção manual)." /></label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DURATIONS.map(d => (
                  <button key={d.label} type="button" onClick={() => setMinutes(d.minutes)}
                    className={`px-3 py-1.5 rounded border text-sm ${minutes === d.minutes ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Motivo <Tooltip text="Registrado no histórico. O jogo pode exibir ao jogador." /></label>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex.: spam no chat" className="w-full border rounded px-2 py-1.5" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">
                {isPending ? 'Aplicando...' : 'Aplicar'}
              </button>
              <button type="button" onClick={() => setPunishing(null)} className="px-4 py-2 border rounded">Cancelar</button>
            </div>
          </form>
        </DetailModal>
      )}
    </div>
  )
}
