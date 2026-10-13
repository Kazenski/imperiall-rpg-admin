'use client'

import { useState, useEffect, useTransition } from 'react'
import { listStages, createStage, updateStage, deleteStage } from '@/lib/actions/stages'
import { listZones, createZone, updateZone, deleteZone } from '@/lib/actions/zones'

function Tip({ text }: { text: string }) {
  return <span className="ml-1 cursor-help text-muted-foreground" title={text}>?</span>
}

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
    if (confirm('Excluir esta fase?')) startTransition(() => deleteStage(id).then(load))
  }

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
      {/* ZONAS */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Zonas</h2>
            <p className="text-sm text-muted-foreground">Regiões do mapa onde as fases acontecem</p>
          </div>
          <button onClick={() => { setZoneEditing(null); setZoneForm(emptyZone); setShowZoneForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">+ Nova Zona</button>
        </div>

        {showZoneForm && (
          <form onSubmit={handleZoneSubmit} className="border rounded p-4 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm">Slug <Tip text="Identificador único. Ex.: floresta_sombria, caos_gelido" /></label>
                <input name="slug" value={zoneForm.slug} onChange={e => setZoneForm({...zoneForm, slug: e.target.value})} className="w-full border rounded px-2 py-1" required />
              </div>
              <div>
                <label className="text-sm">Nome de Exibição</label>
                <input name="name" value={zoneForm.name} onChange={e => setZoneForm({...zoneForm, name: e.target.value})} className="w-full border rounded px-2 py-1" required />
              </div>
              <div>
                <label className="text-sm">Ordem de Exibição</label>
                <input name="sort_order" type="number" value={zoneForm.sort_order} onChange={e => setZoneForm({...zoneForm, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="col-span-2">
                <label className="text-sm">URL do Fundo (Background) <Tip text="Imagem de fundo da zona. Recomendado: 1920x1080 PNG ou JPG" /></label>
                <input name="bg_url" value={zoneForm.bg_url} onChange={e => setZoneForm({...zoneForm, bg_url: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="text-sm">Descrição</label>
              <textarea name="description" value={zoneForm.description} onChange={e => setZoneForm({...zoneForm, description: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" name="bg_parallax" checked={zoneForm.bg_parallax} onChange={e => setZoneForm({...zoneForm, bg_parallax: e.target.checked})} /> Efeito Parallax <Tip text="Fundo se move em camadas para dar sensação de profundidade" /></label>
              <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={zoneForm.is_active} onChange={e => setZoneForm({...zoneForm, is_active: e.target.checked})} /> Ativa</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : zoneEditing ? 'Atualizar' : 'Criar'}</button>
              <button type="button" onClick={() => { setShowZoneForm(false); setZoneEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
            </div>
          </form>
        )}

        <div className="border rounded overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Fundo</th><th className="p-2 text-left">Parallax</th><th className="p-2 text-left">Ativa</th><th className="p-2 text-left">Ações</th></tr></thead>
            <tbody>
              {zones.map(zone => (
                <tr key={zone.id} className="border-t">
                  <td className="p-2 font-medium">{zone.name}</td>
                  <td className="p-2">{zone.bg_url ? 'Sim' : 'Não'}</td>
                  <td className="p-2">{zone.bg_parallax ? 'Sim' : 'Não'}</td>
                  <td className="p-2">{zone.is_active ? 'Sim' : 'Não'}</td>
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
          <div>
            <h2 className="text-2xl font-semibold">Fases (Stages)</h2>
            <p className="text-sm text-muted-foreground">Fases dentro de cada zona. Cada fase tem ondas de inimigos</p>
          </div>
          <button onClick={() => { setEditing(null); setForm(emptyStage); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">+ Nova Fase</button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm">Zona <Tip text="Zona onde esta fase pertence" /></label>
                <select name="zone_id" value={form.zone_id} onChange={e => setForm({...form, zone_id: e.target.value})} className="w-full border rounded px-2 py-1">
                  <option value="">—</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm">Slug <Tip text="Identificador único. Ex.: floresta_sombria_fase1" /></label>
                <input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required />
              </div>
              <div>
                <label className="text-sm">Nome de Exibição</label>
                <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required />
              </div>
              <div>
                <label className="text-sm">Número da Fase <Tip text="Ordem da fase dentro da zona (1, 2, 3...)" /></label>
                <input name="stage_number" type="number" value={form.stage_number} onChange={e => setForm({...form, stage_number: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="text-sm">Nível Recomendado <Tip text="Nível mínimo do jogador para jogar esta fase sem dificuldade extrema" /></label>
                <input name="recommended_level" type="number" value={form.recommended_level} onChange={e => setForm({...form, recommended_level: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="text-sm">Custo de Energia <Tip text="Energia que o jogador gasta ao entrar na fase. 0 = gratuita" /></label>
                <input name="energy_cost" type="number" value={form.energy_cost} onChange={e => setForm({...form, energy_cost: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="text-sm">Ordem de Exibição</label>
                <input name="sort_order" type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
              </div>
            </div>
            <div>
              <label className="text-sm">Descrição</label>
              <textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" name="is_boss_stage" checked={form.is_boss_stage} onChange={e => setForm({...form, is_boss_stage: e.target.checked})} /> Fase de Chefão <Tip text="Se ativada, esta fase tem um boss no final (geralmente recompensas melhores)" /></label>
              <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativa</label>
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
                <th className="p-2 text-left">Nome</th><th className="p-2 text-left">Zona</th><th className="p-2 text-left">Nº</th>
                <th className="p-2 text-left">Nível</th><th className="p-2 text-left">Energia</th><th className="p-2 text-left">Boss</th><th className="p-2 text-left">Ativa</th><th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {stages.map(stage => (
                <tr key={stage.id} className="border-t">
                  <td className="p-2 font-medium">{stage.name}</td>
                  <td className="p-2">{stage.zones?.name || '—'}</td>
                  <td className="p-2">{stage.stage_number}</td>
                  <td className="p-2">{stage.recommended_level}</td>
                  <td className="p-2">{stage.energy_cost}</td>
                  <td className="p-2">{stage.is_boss_stage ? 'Sim' : 'Não'}</td>
                  <td className="p-2">{stage.is_active ? 'Sim' : 'Não'}</td>
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
