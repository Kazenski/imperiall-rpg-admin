'use client'

import { useState, useTransition, useEffect } from 'react'
import { listStages, createStage, updateStage, deleteStage } from '@/lib/actions/stages'
import { listZones, createZone, updateZone, deleteZone } from '@/lib/actions/zones'

const emptyStage = {
  zone_id: '', slug: '', name: '', description: '', stage_number: 1,
  recommended_level: 1, energy_cost: 1, is_boss_stage: false, is_active: true, sort_order: 0,
}

const emptyZone = { slug: '', name: '', description: '', bg_url: '', bg_parallax: false, is_active: true, sort_order: 0 }

export default function StagesPage() {
  const [stages, setStages] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyStage)
  const [isPending, startTransition] = useTransition()

  // Zone form
  const [zoneForm, setZoneForm] = useState(emptyZone)
  const [zoneEditing, setZoneEditing] = useState<any>(null)
  const [showZoneForm, setShowZoneForm] = useState(false)

  const load = () => { listStages().then(setStages); listZones().then(setZones) }

  useEffect(() => { load() }, [])


  const handleEdit = (stage: any) => {
    setEditing(stage)
    setForm({
      zone_id: stage.zone_id || '', slug: stage.slug, name: stage.name, description: stage.description || '',
      stage_number: stage.stage_number, recommended_level: stage.recommended_level,
      energy_cost: stage.energy_cost, is_boss_stage: stage.is_boss_stage, is_active: stage.is_active,
      sort_order: stage.sort_order,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateStage(editing.id, fd)
      else await createStage(fd)
      setShowForm(false); setEditing(null); setForm(emptyStage)
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir este stage?')) startTransition(() => deleteStage(id).then(load))
  }

  // Zones
  const handleZoneEdit = (zone: any) => {
    setZoneEditing(zone)
    setZoneForm({
      slug: zone.slug, name: zone.name, description: zone.description || '',
      bg_url: zone.bg_url || '', bg_parallax: zone.bg_parallax, is_active: zone.is_active, sort_order: zone.sort_order,
    })
    setShowZoneForm(true)
  }

  const handleZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (zoneEditing) await updateZone(zoneEditing.id, fd)
      else await createZone(fd)
      setShowZoneForm(false); setZoneEditing(null); setZoneForm(emptyZone)
    })
  }

  const handleZoneDelete = (id: string) => {
    if (confirm('Excluir esta zona?')) startTransition(() => deleteZone(id).then(load))
  }

  return (
    <div className="space-y-8">
      {/* ZONES */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Zonas</h2>
          <button onClick={() => { setZoneEditing(null); setZoneForm(emptyZone); setShowZoneForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">+ Nova Zona</button>
        </div>

        {showZoneForm && (
          <form onSubmit={handleZoneSubmit} className="border rounded p-4 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm">Slug</label><input name="slug" value={zoneForm.slug} onChange={e => setZoneForm({...zoneForm, slug: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
              <div><label className="text-sm">Nome</label><input name="name" value={zoneForm.name} onChange={e => setZoneForm({...zoneForm, name: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
              <div><label className="text-sm">Sort Order</label><input name="sort_order" type="number" value={zoneForm.sort_order} onChange={e => setZoneForm({...zoneForm, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
              <div><label className="text-sm">BG URL</label><input name="bg_url" value={zoneForm.bg_url} onChange={e => setZoneForm({...zoneForm, bg_url: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            </div>
            <div><label className="text-sm">Descrição</label><textarea name="description" value={zoneForm.description} onChange={e => setZoneForm({...zoneForm, description: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" name="bg_parallax" checked={zoneForm.bg_parallax} onChange={e => setZoneForm({...zoneForm, bg_parallax: e.target.checked})} /> Parallax</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={zoneForm.is_active} onChange={e => setZoneForm({...zoneForm, is_active: e.target.checked})} /> Ativo</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : zoneEditing ? 'Atualizar' : 'Criar'}</button>
              <button type="button" onClick={() => { setShowZoneForm(false); setZoneEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
            </div>
          </form>
        )}

        <div className="border rounded overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="p-2 text-left">Nome</th><th className="p-2 text-left">BG</th><th className="p-2 text-left">Ativo</th><th className="p-2 text-left">Ações</th></tr></thead>
            <tbody>
              {zones.map(zone => (
                <tr key={zone.id} className="border-t">
                  <td className="p-2">{zone.name}</td><td className="p-2">{zone.bg_url ? 'Sim' : 'Nao'}</td>
                  <td className="p-2">{zone.is_active ? 'Sim' : 'Nao'}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => handleZoneEdit(zone)} className="text-blue-600 underline">Editar</button>
                    <button onClick={() => handleZoneDelete(zone.id)} className="text-red-600 underline">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* STAGES */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Stages</h2>
          <button onClick={() => { setEditing(null); setForm(emptyStage); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">+ Novo</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm">Zona</label><select name="zone_id" value={form.zone_id} onChange={e => setForm({...form, zone_id: e.target.value})} className="w-full border rounded px-2 py-1"><option value="">—</option>{zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}</select></div>
              <div><label className="text-sm">Slug</label><input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
              <div><label className="text-sm">Nome</label><input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
              <div><label className="text-sm">Número</label><input name="stage_number" type="number" value={form.stage_number} onChange={e => setForm({...form, stage_number: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
              <div><label className="text-sm">Nível Recomendado</label><input name="recommended_level" type="number" value={form.recommended_level} onChange={e => setForm({...form, recommended_level: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
              <div><label className="text-sm">Custo Energia</label><input name="energy_cost" type="number" value={form.energy_cost} onChange={e => setForm({...form, energy_cost: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
              <div><label className="text-sm">Sort Order</label><input name="sort_order" type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            </div>
            <div><label className="text-sm">Descrição</label><textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" name="is_boss_stage" checked={form.is_boss_stage} onChange={e => setForm({...form, is_boss_stage: e.target.checked})} /> Boss Stage</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativo</label>
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
                <th className="p-2 text-left">Nome</th><th className="p-2 text-left">Zona</th><th className="p-2 text-left">Número</th>
                <th className="p-2 text-left">Nível</th><th className="p-2 text-left">Boss</th><th className="p-2 text-left">Ativo</th><th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {stages.map(stage => (
                <tr key={stage.id} className="border-t">
                  <td className="p-2">{stage.name}</td><td className="p-2">{stage.zones?.name || '—'}</td>
                  <td className="p-2">{stage.stage_number}</td><td className="p-2">{stage.recommended_level}</td>
                  <td className="p-2">{stage.is_boss_stage ? 'Sim' : 'Nao'}</td>
                  <td className="p-2">{stage.is_active ? 'Sim' : 'Nao'}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => handleEdit(stage)} className="text-blue-600 underline">Editar</button>
                    <button onClick={() => handleDelete(stage.id)} className="text-red-600 underline">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
