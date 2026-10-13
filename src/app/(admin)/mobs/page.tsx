'use client'

import { useState, useEffect, useTransition } from 'react'
import { listMobs, createMob, updateMob, deleteMob } from '@/lib/actions/mobs'

const TIERS: Record<string, { label: string; color: string }> = {
  normal: { label: 'Normal', color: '#9ca3af' },
  elite: { label: 'Elite', color: '#3b82f6' },
  boss: { label: 'Chefão', color: '#ef4444' },
  mini_boss: { label: 'Sub-Chefão', color: '#f59e0b' },
}

function Tip({ text }: { text: string }) {
  return (
    <span className="ml-1 cursor-help text-muted-foreground" title={text}>?</span>
  )
}

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
  useEffect(() => { load() }, [])

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
    if (confirm('Excluir este inimigo?')) startTransition(() => deleteMob(id).then(load))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Inimigos (Mobs)</h2>
          <p className="text-sm text-muted-foreground">Cadastre os monstros do jogo com seus sprites de animação</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">+ Novo Inimigo</button>
      </div>

      {/* Referência de Balanceamento */}
      <div className="border rounded p-4 mb-4">
        <h3 className="font-semibold mb-2">Referência de Tier</h3>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {Object.entries(TIERS).map(([key, { label, color }]) => (
            <div key={key} className="border rounded p-2" style={{ borderColor: color }}>
              <div className="font-semibold" style={{ color }}>{label}</div>
              <div className="text-muted-foreground">
                {key === 'normal' && 'Inimigo comum, spawns em grupo'}
                {key === 'elite' && 'Mais forte, sprite maior'}
                {key === 'boss' && 'Chefão de fase, sprite grande'}
                {key === 'mini_boss' && 'Semi-chefe, recompensa extra'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Slug <Tip text="Identificador único (sem espaços). Ex.: slime_verde, dragao_fogo" /></label>
              <input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Nome de Exibição <Tip text="Nome que o jogador verá" /></label>
              <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Tier <Tip text="Força do inimigo. Normal = comum, Elite = forte, Chefão = boss de fase, Sub-Chefão = semi-boss" /></label>
              <select name="tier" value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} className="w-full border rounded px-2 py-1">
                {Object.entries(TIERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Vida (HP) <Tip text="Pontos de vida. Jogador precisa causar esta quantidade de dano para derrotar" /></label>
              <input name="hp" type="number" value={form.hp} onChange={e => setForm({...form, hp: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Ataque (ATK) <Tip text="Dano que causa ao jogador a cada golpe" /></label>
              <input name="atk" type="number" value={form.atk} onChange={e => setForm({...form, atk: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Defesa (DEF) <Tip text="Redução de dano recebido. Cada ponto reduz 1 de dano por golpe" /></label>
              <input name="def" type="number" value={form.def} onChange={e => setForm({...form, def: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Recompensa de EXP <Tip text="XP que o jogador ganha ao derrotar" /></label>
              <input name="exp_reward" type="number" value={form.exp_reward} onChange={e => setForm({...form, exp_reward: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Recompensa de Ouro <Tip text="Ouro que dropa ao derrotar" /></label>
              <input name="gold_reward" type="number" value={form.gold_reward} onChange={e => setForm({...form, gold_reward: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Velocidade <Tip text="Velocidade de movimento na tela (100 = normal, 200 = rápido)" /></label>
              <input name="speed" type="number" value={form.speed} onChange={e => setForm({...form, speed: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Intervalo de Ataque (ms) <Tip text="Tempo entre ataques em milissegundos. Ex.: 1000 = ataca a cada 1 segundo" /></label>
              <input name="attack_cooldown_ms" type="number" value={form.attack_cooldown_ms} onChange={e => setForm({...form, attack_cooldown_ms: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Escala (Tamanho) <Tip text="Tamanho do sprite na tela. 1.0 = normal, 2.0 = dobro do tamanho" /></label>
              <input name="scale" type="number" step="0.25" value={form.scale} onChange={e => setForm({...form, scale: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Hitbox Largura <Tip text="Largura da área de colisão em pixels. Geralmente igual à largura do sprite" /></label>
              <input name="hitbox_w" type="number" value={form.hitbox_w} onChange={e => setForm({...form, hitbox_w: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Hitbox Altura <Tip text="Altura da área de colisão em pixels" /></label>
              <input name="hitbox_h" type="number" value={form.hitbox_h} onChange={e => setForm({...form, hitbox_h: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">URL Sprite Idle <Tip text="Imagem parada (2-4 frames). PNG com fundo transparente, ex.: 64x64 ou 128x128" /></label>
              <input name="sprite_idle_url" value={form.sprite_idle_url} onChange={e => setForm({...form, sprite_idle_url: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm">URL Sprite Run <Tip text="Animação de corrida (4-6 frames)" /></label>
              <input name="sprite_run_url" value={form.sprite_run_url} onChange={e => setForm({...form, sprite_run_url: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm">URL Sprite Attack <Tip text="Animação de ataque (3-4 frames)" /></label>
              <input name="sprite_attack_url" value={form.sprite_attack_url} onChange={e => setForm({...form, sprite_attack_url: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm">URL Sprite Hit <Tip text="Animação ao tomar dano (1-2 frames)" /></label>
              <input name="sprite_hit_url" value={form.sprite_hit_url} onChange={e => setForm({...form, sprite_hit_url: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm">URL Sprite Death <Tip text="Animação de morte (2-3 frames)" /></label>
              <input name="sprite_death_url" value={form.sprite_death_url} onChange={e => setForm({...form, sprite_death_url: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-sm">Descrição <Tip text="Texto exibido no bestiário ou tooltip do inimigo" /></label>
            <textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="Uma criatura..." />
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativo <Tip text="Inimigos inativos ficam salvos mas não aparecem no jogo" /></label>
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
              <th className="p-2 text-left">Ouro</th><th className="p-2 text-left">Ativo</th><th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {mobs.map(mob => (
              <tr key={mob.id} className="border-t">
                <td className="p-2 font-medium">{mob.name}</td>
                <td className="p-2"><span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: TIERS[mob.tier]?.color + '20', color: TIERS[mob.tier]?.color }}>{TIERS[mob.tier]?.label || mob.tier}</span></td>
                <td className="p-2">{mob.hp}</td><td className="p-2">{mob.atk}</td><td className="p-2">{mob.def}</td>
                <td className="p-2">{mob.exp_reward}</td><td className="p-2">{mob.gold_reward}</td>
                <td className="p-2">{mob.is_active ? 'Sim' : 'Não'}</td>
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
