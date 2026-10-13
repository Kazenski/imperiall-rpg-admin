'use client'

import { useState, useEffect, useTransition } from 'react'
import { listSkills, createSkill, updateSkill, deleteSkill } from '@/lib/actions/skills'

const SKILL_TYPES = ['active','passive']
const TARGETS = ['self','enemy','enemies','ally','allies','aoe']

const emptyForm = {
  slug: '', name: '', description: '', type: 'active', target: 'enemy',
  cooldown_ms: 0, mana_cost: 0, base_damage: 0, icon_url: '', animation_key: '',
  effects: '', is_active: true, sort_order: 0,
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isPending, startTransition] = useTransition()

  const load = () => listSkills().then(setSkills)
  useEffect(() => { load() }, [])

  const handleEdit = (skill: any) => {
    setEditing(skill)
    setForm({
      slug: skill.slug, name: skill.name, description: skill.description || '', type: skill.type,
      target: skill.target, cooldown_ms: skill.cooldown_ms, mana_cost: skill.mana_cost,
      base_damage: skill.base_damage, icon_url: skill.icon_url || '', animation_key: skill.animation_key || '',
      effects: JSON.stringify(skill.effects || {}, null, 2), is_active: skill.is_active, sort_order: skill.sort_order,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateSkill(editing.id, fd)
      else await createSkill(fd)
      setShowForm(false); setEditing(null); setForm(emptyForm)
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta skill?')) startTransition(() => deleteSkill(id).then(load))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Skills</h2>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">+ Novo</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm">Slug</label><input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
            <div><label className="text-sm">Nome</label><input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
            <div><label className="text-sm">Tipo</label><select name="type" value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border rounded px-2 py-1">{SKILL_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="text-sm">Target</label><select name="target" value={form.target} onChange={e => setForm({...form, target: e.target.value})} className="w-full border rounded px-2 py-1">{TARGETS.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="text-sm">Cooldown (ms)</label><input name="cooldown_ms" type="number" value={form.cooldown_ms} onChange={e => setForm({...form, cooldown_ms: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Mana Cost</label><input name="mana_cost" type="number" value={form.mana_cost} onChange={e => setForm({...form, mana_cost: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Base Damage</label><input name="base_damage" type="number" value={form.base_damage} onChange={e => setForm({...form, base_damage: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Animation Key</label><input name="animation_key" value={form.animation_key} onChange={e => setForm({...form, animation_key: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Sort Order</label><input name="sort_order" type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Icon URL</label><input name="icon_url" value={form.icon_url} onChange={e => setForm({...form, icon_url: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
          </div>
          <div><label className="text-sm">Descrição</label><textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
          <div><label className="text-sm">Effects (JSON)</label><textarea name="effects" value={form.effects} onChange={e => setForm({...form, effects: e.target.value})} className="w-full border rounded px-2 py-1 font-mono text-xs" rows={4} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativo</label>
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
              <th className="p-2 text-left">Nome</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Target</th>
              <th className="p-2 text-left">Cooldown</th><th className="p-2 text-left">Mana</th><th className="p-2 text-left">Damage</th>
              <th className="p-2 text-left">Ativo</th><th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {skills.map(skill => (
              <tr key={skill.id} className="border-t">
                <td className="p-2">{skill.name}</td><td className="p-2">{skill.type}</td><td className="p-2">{skill.target}</td>
                <td className="p-2">{skill.cooldown_ms}ms</td><td className="p-2">{skill.mana_cost}</td><td className="p-2">{skill.base_damage}</td>
                <td className="p-2">{skill.is_active ? 'Sim' : 'Nao'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => handleEdit(skill)} className="text-blue-600 underline">Editar</button>
                  <button onClick={() => handleDelete(skill.id)} className="text-red-600 underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
