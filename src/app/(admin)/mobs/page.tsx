'use client'

import { useState, useTransition } from 'react'
import { listMobs, createMob, updateMob, deleteMob } from '@/lib/actions/mobs'

const TIERS = ['normal','elite','boss','mini_boss']

const emptyForm = {
  slug: '', name: '', description: '', tier: 'normal',
  hp: 50, atk: 5, def: 2, exp_reward: 10, gold_reward: 5,
  speed: 100, attack_cooldown_ms: 800, scale: 1,
  sprite_idle_url: '', sprite_run_url: '', sprite_attack_url: '', sprite_hit_url: '', sprite_death_url: '',
  hitbox_w: 32, hitbox_h: 32, is_active: true,
}

export default function MobsPage() {
  const [mobs, setMobs] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isPending, startTransition] = useTransition()

  const load = () => listMobs().then(setMobs)

  useState(() => { load() })

  const handleEdit = (mob: any) => {
    setEditing(mob)
    setForm({
      slug: mob.slug, name: mob.name, description: mob.description || '', tier: mob.tier,
      hp: mob.hp, atk: mob.atk, def: mob.def, exp_reward: mob.exp_reward, gold_reward: mob.gold_reward,
      speed: mob.speed, attack_cooldown_ms: mob.attack_cooldown_ms, scale: mob.scale,
      sprite_idle_url: mob.sprite_idle_url || '', sprite_run_url: mob.sprite_run_url || '',
      sprite_attack_url: mob.sprite_attack_url || '', sprite_hit_url: mob.sprite_hit_url || '',
      sprite_death_url: mob.sprite_death_url || '',
      hitbox_w: mob.hitbox_w, hitbox_h: mob.hitbox_h, is_active: mob.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateMob(editing.id, fd)
      else await createMob(fd)
      setShowForm(false); setEditing(null); setForm(emptyForm)
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir este mob?')) startTransition(() => deleteMob(id).then(load))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Mobs</h2>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">+ Novo</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm">Slug</label><input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
            <div><label className="text-sm">Nome</label><input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required /></div>
            <div><label className="text-sm">Tier</label><select name="tier" value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} className="w-full border rounded px-2 py-1">{TIERS.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="text-sm">HP</label><input name="hp" type="number" value={form.hp} onChange={e => setForm({...form, hp: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">ATK</label><input name="atk" type="number" value={form.atk} onChange={e => setForm({...form, atk: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">DEF</label><input name="def" type="number" value={form.def} onChange={e => setForm({...form, def: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">EXP Reward</label><input name="exp_reward" type="number" value={form.exp_reward} onChange={e => setForm({...form, exp_reward: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Gold Reward</label><input name="gold_reward" type="number" value={form.gold_reward} onChange={e => setForm({...form, gold_reward: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Speed</label><input name="speed" type="number" value={form.speed} onChange={e => setForm({...form, speed: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Attack CD (ms)</label><input name="attack_cooldown_ms" type="number" value={form.attack_cooldown_ms} onChange={e => setForm({...form, attack_cooldown_ms: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Scale</label><input name="scale" type="number" step="0.25" value={form.scale} onChange={e => setForm({...form, scale: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Hitbox W</label><input name="hitbox_w" type="number" value={form.hitbox_w} onChange={e => setForm({...form, hitbox_w: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Hitbox H</label><input name="hitbox_h" type="number" value={form.hitbox_h} onChange={e => setForm({...form, hitbox_h: Number(e.target.value)})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Sprite Idle URL</label><input name="sprite_idle_url" value={form.sprite_idle_url} onChange={e => setForm({...form, sprite_idle_url: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Sprite Run URL</label><input name="sprite_run_url" value={form.sprite_run_url} onChange={e => setForm({...form, sprite_run_url: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Sprite Attack URL</label><input name="sprite_attack_url" value={form.sprite_attack_url} onChange={e => setForm({...form, sprite_attack_url: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Sprite Hit URL</label><input name="sprite_hit_url" value={form.sprite_hit_url} onChange={e => setForm({...form, sprite_hit_url: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
            <div><label className="text-sm">Sprite Death URL</label><input name="sprite_death_url" value={form.sprite_death_url} onChange={e => setForm({...form, sprite_death_url: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
          </div>
          <div><label className="text-sm">Descrição</label><textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" /></div>
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
              <th className="p-2 text-left">Nome</th><th className="p-2 text-left">Tier</th><th className="p-2 text-left">HP</th>
              <th className="p-2 text-left">ATK</th><th className="p-2 text-left">DEF</th><th className="p-2 text-left">EXP</th>
              <th className="p-2 text-left">Gold</th><th className="p-2 text-left">Ativo</th><th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {mobs.map(mob => (
              <tr key={mob.id} className="border-t">
                <td className="p-2">{mob.name}</td><td className="p-2">{mob.tier}</td><td className="p-2">{mob.hp}</td>
                <td className="p-2">{mob.atk}</td><td className="p-2">{mob.def}</td><td className="p-2">{mob.exp_reward}</td>
                <td className="p-2">{mob.gold_reward}</td><td className="p-2">{mob.is_active ? 'Sim' : 'Nao'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => handleEdit(mob)} className="text-blue-600 underline">Editar</button>
                  <button onClick={() => handleDelete(mob.id)} className="text-red-600 underline">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
