'use client'

import { useState, useEffect, useTransition } from 'react'
import { listWaves, listWaveMobs, createWave, updateWave, deleteWave, addWaveMob, deleteWaveMob } from '@/lib/actions/waves'
import { listStages } from '@/lib/actions/stages'
import { listMobs } from '@/lib/actions/mobs'
import { Tooltip } from '@/components/ui/tooltip'
import { Waves, Plus, Pencil, Trash2 } from 'lucide-react'

const emptyWave = { stage_id: '', wave_number: 1, spawn_delay_ms: 500 }
const emptyWaveMob = { wave_id: '', mob_id: '', quantity: 1, delay_between_ms: 250, sort_order: 0 }

export default function WavesPage() {
  const [waves, setWaves] = useState<any[]>([])
  const [waveMobs, setWaveMobs] = useState<Record<string, any[]>>({})
  const [stages, setStages] = useState<any[]>([])
  const [mobs, setMobs] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyWave)
  const [isPending, startTransition] = useTransition()
  const [mobForm, setMobForm] = useState(emptyWaveMob)
  const [mobWaveId, setMobWaveId] = useState('')
  const [showMobForm, setShowMobForm] = useState(false)

  const load = () => {
    listWaves().then(ws => {
      setWaves(ws)
      ws.forEach(w => listWaveMobs(w.id).then(m => setWaveMobs(prev => ({ ...prev, [w.id]: m }))))
    })
  }
  useEffect(() => { load(); listStages().then(setStages); listMobs().then(setMobs) }, [])

  const handleEdit = (wave: any) => {
    setEditing(wave)
    setForm({ stage_id: wave.stage_id, wave_number: wave.wave_number, spawn_delay_ms: wave.spawn_delay_ms })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateWave(editing.id, fd)
      else await createWave(fd)
      setShowForm(false); setEditing(null); setForm(emptyWave)
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta onda?')) startTransition(() => deleteWave(id).then(load))
  }

  const handleAddMob = (waveId: string) => {
    setMobWaveId(waveId)
    setMobForm({ ...emptyWaveMob, wave_id: waveId })
    setShowMobForm(true)
  }

  const handleMobSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      await addWaveMob(fd)
      setShowMobForm(false); setMobForm(emptyWaveMob)
    })
  }

  const handleDeleteMob = (id: string) => {
    if (confirm('Remover este inimigo da onda?')) startTransition(() => deleteWaveMob(id).then(load))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Waves size={20} /> Ondas (Waves)</h2>
          <p className="text-sm text-muted-foreground">Configure os grupos de inimigos que aparecem em cada fase</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyWave); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2">
          <Plus size={16} /> Nova Onda
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Fase (Stage) <Tooltip text="Fase onde esta onda vai aparecer" /></label>
              <select name="stage_id" value={form.stage_id} onChange={e => setForm({...form, stage_id: e.target.value})} className="w-full border rounded px-2 py-1" required>
                <option value="">—</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Número da Onda <Tooltip text="Ordem dentro da fase (1, 2, 3...). A onda 1 aparece primeiro" /></label>
              <input name="wave_number" type="number" value={form.wave_number} onChange={e => setForm({...form, wave_number: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Atraso de Spawn (ms) <Tooltip text="Tempo antes de iniciar a onda (milissegundos). Ex.: 1000 = 1 segundo de preparação" /></label>
              <input name="spawn_delay_ms" type="number" value={form.spawn_delay_ms} onChange={e => setForm({...form, spawn_delay_ms: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {waves.map(wave => (
          <div key={wave.id} className="border rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-semibold">Onda {wave.wave_number}</span>
                <span className="text-sm text-muted-foreground ml-2">— {wave.stages?.name || 'Sem fase'}</span>
                <span className="text-sm text-muted-foreground ml-2">Atraso: {wave.spawn_delay_ms}ms</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAddMob(wave.id)} className="text-sm text-blue-600 underline inline-flex items-center gap-1"><Plus size={12} /> Inimigo</button>
                <button onClick={() => handleEdit(wave)} className="text-sm text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                <button onClick={() => handleDelete(wave.id)} className="text-sm text-red-600 underline inline-flex items-center gap-1"><Trash2 size={12} /> Excluir</button>
              </div>
            </div>
            <div className="text-sm space-y-1">
              {(waveMobs[wave.id] || []).map(wm => (
                <div key={wm.id} className="flex justify-between items-center">
                  <span>
                    {wm.mobs?.name || '—'} x{wm.quantity}
                    <span className="text-muted-foreground ml-2">(intervalo: {wm.delay_between_ms}ms)</span>
                  </span>
                  <button onClick={() => handleDeleteMob(wm.id)} className="text-red-600 underline">Remover</button>
                </div>
              ))}
              {(!waveMobs[wave.id] || waveMobs[wave.id].length === 0) && <span className="text-muted-foreground">Sem inimigos nesta onda</span>}
            </div>
          </div>
        ))}
      </div>

      {showMobForm && (
        <form onSubmit={handleMobSubmit} className="border rounded p-4 mb-4 space-y-3">
          <h3 className="font-semibold">Adicionar Inimigo à Onda</h3>
          <input type="hidden" name="wave_id" value={mobWaveId} />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Inimigo <Tooltip text="Inimigo que vai aparecer nesta onda" /></label>
              <select name="mob_id" value={mobForm.mob_id} onChange={e => setMobForm({...mobForm, mob_id: e.target.value})} className="w-full border rounded px-2 py-1" required>
                <option value="">—</option>
                {mobs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Quantidade <Tooltip text="Quantos deste inimigo spawnam nesta onda" /></label>
              <input name="quantity" type="number" value={mobForm.quantity} onChange={e => setMobForm({...mobForm, quantity: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Intervalo (ms) <Tooltip text="Tempo entre cada spawn individual (milissegundos). Ex.: 300 = 0.3s entre cada inimigo" /></label>
              <input name="delay_between_ms" type="number" value={mobForm.delay_between_ms} onChange={e => setMobForm({...mobForm, delay_between_ms: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Ordem <Tooltip text="Ordem de spawn (0 = primeiro)" /></label>
              <input name="sort_order" type="number" value={mobForm.sort_order} onChange={e => setMobForm({...mobForm, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : 'Adicionar'}</button>
            <button type="button" onClick={() => setShowMobForm(false)} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  )
}
