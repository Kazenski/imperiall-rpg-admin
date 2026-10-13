'use client'

import { useState, useEffect, useTransition } from 'react'
import { listMobs, createMob, updateMob, deleteMob } from '@/lib/actions/mobs'
import { Tooltip } from '@/components/ui/tooltip'
import { ImageUpload } from '@/components/ui/image-upload'
import { DetailModal, DetailRow, DetailImage } from '@/components/ui/detail-modal'
import { suggestMobStats } from '@/lib/balance'
import { Sword, Shield, Heart, Coins, Star, Plus, Pencil, Trash2, Zap, Eye, Sparkles, Copy } from 'lucide-react'
import { useTable, SearchBox, Th, Counters } from '@/components/ui/data-table'

const TIERS: Record<string, { label: string; color: string }> = {
  normal: { label: 'Normal', color: '#9ca3af' },
  elite: { label: 'Elite', color: '#3b82f6' },
  boss: { label: 'Chefão', color: '#ef4444' },
  mini_boss: { label: 'Sub-Chefão', color: '#f59e0b' },
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
  const [viewing, setViewing] = useState<any>(null)
  const [refLevel, setRefLevel] = useState(5)

  function applySuggestion() {
    const s = suggestMobStats(form.tier, refLevel)
    setForm({
      ...form,
      hp: s.hp,
      atk: s.atk,
      def: s.def,
      exp_reward: s.exp_reward,
      gold_reward: s.gold_reward,
      attack_cooldown_ms: s.attack_cooldown_ms,
      scale: s.scale,
    })
  }

  const load = () => listMobs().then(setMobs).catch(() => setMobs([]))
  const table = useTable(mobs, {
    search: (m) => `${m.name} ${m.slug}`,
    sort: {
      name: (m) => m.name,
      tier: (m) => Object.keys(TIERS).indexOf(m.tier),
      hp: (m) => m.hp,
      atk: (m) => m.atk,
      exp: (m) => m.exp_reward,
    },
  })
  const activeCount = mobs.filter((m) => m.is_active).length
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
      setShowForm(false); setEditing(null); setForm(emptyForm); load()
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir este inimigo?')) startTransition(() => deleteMob(id).then(load))
  }

  const handleClone = (mob: any) => {
    handleEdit(mob)
    setEditing(null)
    setForm((f) => ({ ...f, slug: `${mob.slug}-copia`, name: `${mob.name} (cópia)` }))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Inimigos (Mobs)</h2>
          <p className="text-sm text-muted-foreground">Cadastre os monstros do jogo com seus sprites de animação</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2">
          <Plus size={16} /> Novo Inimigo
        </button>
      </div>

      {/* Referência de Tier */}
      <div className="border rounded p-4 mb-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Zap size={16} /> Referência de Tier</h3>
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
          <div className="flex items-end gap-2 rounded bg-muted/60 p-3">
            <div>
              <label className="text-sm font-medium">Nível de referência <Tooltip text="Nível do jogador que vai enfrentar este inimigo. Usado só para calcular a sugestão — não é salvo." /></label>
              <input type="number" min={1} max={100} value={refLevel} onChange={e => setRefLevel(Number(e.target.value) || 1)} className="w-24 border rounded px-2 py-1" />
            </div>
            <button type="button" onClick={applySuggestion} className="px-3 py-1.5 rounded border bg-background hover:bg-muted inline-flex items-center gap-1 text-sm">
              <Sparkles size={14} /> Sugerir valores
            </button>
            <p className="text-xs text-muted-foreground">Preenche HP/ATK/DEF/EXP/ouro pelo tier + nível.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Slug <Tooltip text="Identificador único (sem espaços). Ex.: slime_verde, dragao_fogo" /></label>
              <input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Nome de Exibição <Tooltip text="Nome que o jogador verá" /></label>
              <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Tier <Tooltip text="Força do inimigo. Normal = comum, Elite = forte, Chefão = boss de fase, Sub-Chefão = semi-boss" /></label>
              <select name="tier" value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} className="w-full border rounded px-2 py-1">
                {Object.entries(TIERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm flex items-center gap-1"><Heart size={14} /> Vida (HP) <Tooltip text="Pontos de vida. Jogador precisa causar esta quantidade de dano para derrotar" /></label>
              <input name="hp" type="number" value={form.hp} onChange={e => setForm({...form, hp: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm flex items-center gap-1"><Sword size={14} /> Ataque (ATK) <Tooltip text="Dano que causa ao jogador a cada golpe" /></label>
              <input name="atk" type="number" value={form.atk} onChange={e => setForm({...form, atk: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm flex items-center gap-1"><Shield size={14} /> Defesa (DEF) <Tooltip text="Redução de dano recebido. Cada ponto reduz 1 de dano por golpe" /></label>
              <input name="def" type="number" value={form.def} onChange={e => setForm({...form, def: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm flex items-center gap-1"><Star size={14} /> Recompensa de EXP <Tooltip text="XP que o jogador ganha ao derrotar" /></label>
              <input name="exp_reward" type="number" value={form.exp_reward} onChange={e => setForm({...form, exp_reward: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm flex items-center gap-1"><Coins size={14} /> Recompensa de Ouro <Tooltip text="Ouro que dropa ao derrotar" /></label>
              <input name="gold_reward" type="number" value={form.gold_reward} onChange={e => setForm({...form, gold_reward: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Velocidade <Tooltip text="Velocidade de movimento na tela (100 = normal, 200 = rápido)" /></label>
              <input name="speed" type="number" value={form.speed} onChange={e => setForm({...form, speed: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Intervalo de Ataque (ms) <Tooltip text="Tempo entre ataques em milissegundos. Ex.: 1000 = ataca a cada 1 segundo" /></label>
              <input name="attack_cooldown_ms" type="number" value={form.attack_cooldown_ms} onChange={e => setForm({...form, attack_cooldown_ms: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Escala (Tamanho) <Tooltip text="Tamanho do sprite na tela. 1.0 = normal, 2.0 = dobro do tamanho" /></label>
              <input name="scale" type="number" step="0.25" value={form.scale} onChange={e => setForm({...form, scale: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Hitbox Largura <Tooltip text="Largura da área de colisão em pixels. Geralmente igual à largura do sprite" /></label>
              <input name="hitbox_w" type="number" value={form.hitbox_w} onChange={e => setForm({...form, hitbox_w: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Hitbox Altura <Tooltip text="Altura da área de colisão em pixels" /></label>
              <input name="hitbox_h" type="number" value={form.hitbox_h} onChange={e => setForm({...form, hitbox_h: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="col-span-3 border-t pt-3 mt-1">
              <p className="text-sm font-semibold mb-2">Sprites de animação — arraste a imagem estática com fundo transparente. Pré-visualização aparece antes de salvar.</p>
              <div className="grid grid-cols-2 gap-3">
                <ImageUpload label="Sprite Parado (Idle)" fieldName="sprite_idle_url" tooltipText="Pose parada do inimigo (2-4 frames no jogo final). Por agora suba 1 imagem estática PNG transparente." folder="mobs" value={form.sprite_idle_url} onChange={(url) => setForm({ ...form, sprite_idle_url: url })} hint="PNG transparente (limite 512px)" maxSize={512} />
                <ImageUpload label="Sprite Correndo (Run)" fieldName="sprite_run_url" tooltipText="Animação de movimento (4-6 frames no jogo final). Por agora suba 1 imagem estática." folder="mobs" value={form.sprite_run_url} onChange={(url) => setForm({ ...form, sprite_run_url: url })} hint="PNG transparente (limite 512px)" maxSize={512} />
                <ImageUpload label="Sprite Atacando (Attack)" fieldName="sprite_attack_url" tooltipText="Animação de ataque (3-4 frames no jogo final). Por agora suba 1 imagem estática." folder="mobs" value={form.sprite_attack_url} onChange={(url) => setForm({ ...form, sprite_attack_url: url })} hint="PNG transparente (limite 512px)" maxSize={512} />
                <ImageUpload label="Sprite Atingido (Hit)" fieldName="sprite_hit_url" tooltipText="Animação ao tomar dano (1-2 frames). Por agora suba 1 imagem estática." folder="mobs" value={form.sprite_hit_url} onChange={(url) => setForm({ ...form, sprite_hit_url: url })} hint="PNG transparente (limite 512px)" maxSize={512} />
                <ImageUpload label="Sprite Morte (Death)" fieldName="sprite_death_url" tooltipText="Animação de morte (2-3 frames). Por agora suba 1 imagem estática." folder="mobs" value={form.sprite_death_url} onChange={(url) => setForm({ ...form, sprite_death_url: url })} hint="PNG transparente (limite 512px)" maxSize={512} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm">Descrição <Tooltip text="Texto exibido no bestiário ou tooltip do inimigo" /></label>
            <textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" placeholder="Uma criatura..." />
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativo <Tooltip text="Inimigos inativos ficam salvos mas não aparecem no jogo" /></label>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <SearchBox value={table.q} onChange={table.setQ} placeholder="Pesquisar inimigo..." />
        <Counters total={mobs.length} active={activeCount} shown={table.visible.length} totalLabel="inimigos" />
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Sprite</th>
              <Th label="Nome" k="name" active={table.sortKey === 'name'} dir={table.sortDir} onClick={table.toggle} />
              <Th label="Tier" k="tier" active={table.sortKey === 'tier'} dir={table.sortDir} onClick={table.toggle} />
              <Th label="HP" k="hp" active={table.sortKey === 'hp'} dir={table.sortDir} onClick={table.toggle} />
              <Th label="ATK" k="atk" active={table.sortKey === 'atk'} dir={table.sortDir} onClick={table.toggle} />
              <th className="p-2 text-left">DEF</th>
              <Th label="EXP" k="exp" active={table.sortKey === 'exp'} dir={table.sortDir} onClick={table.toggle} />
              <th className="p-2 text-left">Ouro</th><th className="p-2 text-left">Ativo</th><th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {table.visible.map((mob, i) => (
              <tr key={mob.id} className="border-t">
                <td className="p-2 text-muted-foreground">{i + 1}</td>
                <td className="p-2">
                  {mob.sprite_idle_url
                    ? <img src={mob.sprite_idle_url} alt={mob.name} className="w-10 h-10 object-contain rounded border bg-muted" />
                    : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="p-2 font-medium">
                  <button onClick={() => setViewing(mob)} className="underline underline-offset-2 hover:text-primary text-left">{mob.name}</button>
                </td>
                <td className="p-2"><span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: TIERS[mob.tier]?.color + '20', color: TIERS[mob.tier]?.color }}>{TIERS[mob.tier]?.label || mob.tier}</span></td>
                <td className="p-2">{mob.hp}</td><td className="p-2">{mob.atk}</td><td className="p-2">{mob.def}</td>
                <td className="p-2">{mob.exp_reward}</td><td className="p-2">{mob.gold_reward}</td>
                <td className="p-2">{mob.is_active ? 'Sim' : 'Não'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => setViewing(mob)} className="text-green-700 underline inline-flex items-center gap-1"><Eye size={12} /> Ver</button>
                  <button onClick={() => handleEdit(mob)} className="text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                  <button onClick={() => handleClone(mob)} className="underline inline-flex items-center gap-1" title="Abre edição com cópia para salvar com outro slug"><Copy size={12} /> Clonar</button>
                  <button onClick={() => handleDelete(mob.id)} className="text-red-600 underline inline-flex items-center gap-1"><Trash2 size={12} /> Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <DetailModal title={viewing.name} onClose={() => setViewing(null)}>
          <DetailImage label="Parado (Idle)" url={viewing.sprite_idle_url} />
          <DetailImage label="Correndo (Run)" url={viewing.sprite_run_url} />
          <DetailImage label="Atacando (Attack)" url={viewing.sprite_attack_url} />
          <DetailImage label="Atingido (Hit)" url={viewing.sprite_hit_url} />
          <DetailImage label="Morte (Death)" url={viewing.sprite_death_url} />
          <DetailRow label="Slug" value={<code>{viewing.slug}</code>} />
          <DetailRow label="Tier" value={TIERS[viewing.tier]?.label || viewing.tier} />
          <DetailRow label="HP / ATK / DEF" value={`${viewing.hp} / ${viewing.atk} / ${viewing.def}`} />
          <DetailRow label="EXP / Ouro" value={`${viewing.exp_reward} / ${viewing.gold_reward}`} />
          <DetailRow label="Descrição" value={viewing.description || '—'} />
          <DetailRow label="Ativo" value={viewing.is_active ? 'Sim' : 'Não'} />
        </DetailModal>
      )}
    </div>
  )
}
