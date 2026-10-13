'use client'

import { useState, useEffect, useTransition } from 'react'
import { listSkills, createSkill, updateSkill, deleteSkill } from '@/lib/actions/skills'
import { Tooltip } from '@/components/ui/tooltip'
import { Zap, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { DetailModal, DetailRow, DetailImage } from '@/components/ui/detail-modal'

const SKILL_TYPES: Record<string, string> = { active: 'Ativa', passive: 'Passiva' }
const TARGETS: Record<string, string> = {
  self: 'Próprio jogador', enemy: 'Um inimigo', enemies: 'Todos os inimigos',
  ally: 'Um aliado', allies: 'Todos os aliados', aoe: 'Área (ao redor)',
}

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
  const [viewing, setViewing] = useState<any>(null)

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
    if (confirm('Excluir esta habilidade?')) startTransition(() => deleteSkill(id).then(load))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Habilidades</h2>
          <p className="text-sm text-muted-foreground">Cadastre skills ativas e passivas do jogador e dos inimigos</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2">
          <Plus size={16} /> Nova Skill
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Slug <Tooltip text="Identificador único. Ex.: golpe_poderoso, cura_basica" /></label>
              <input name="slug" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Nome de Exibição</label>
              <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="text-sm">Tipo <Tooltip text="Ativa: jogador usa manualmente. Passiva: efeito automático (ex.: +10% HP)" /></label>
              <select name="type" value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border rounded px-2 py-1">
                {Object.entries(SKILL_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Alvo <Tooltip text="Quem recebe o efeito da skill" /></label>
              <select name="target" value={form.target} onChange={e => setForm({...form, target: e.target.value})} className="w-full border rounded px-2 py-1">
                {Object.entries(TARGETS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Recarga (ms) <Tooltip text="Tempo de espera em milissegundos antes de poder usar de novo. 0 = sem recarga" /></label>
              <input name="cooldown_ms" type="number" value={form.cooldown_ms} onChange={e => setForm({...form, cooldown_ms: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Custo de Mana <Tooltip text="Mana consumida ao usar. 0 = skill gratuita" /></label>
              <input name="mana_cost" type="number" value={form.mana_cost} onChange={e => setForm({...form, mana_cost: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Dano Base <Tooltip text="Quantidade de dano causado (0 para skills de suporte/cura)" /></label>
              <input name="base_damage" type="number" value={form.base_damage} onChange={e => setForm({...form, base_damage: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Chave de Animação <Tooltip text="Nome da animação no código do jogo. Ex.: slash_01, fireball_cast" /></label>
              <input name="animation_key" value={form.animation_key} onChange={e => setForm({...form, animation_key: e.target.value})} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="text-sm">Ordem de Exibição</label>
              <input name="sort_order" type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: Number(e.target.value)})} className="w-full border rounded px-2 py-1" />
            </div>
            <ImageUpload
              label="Ícone da skill"
              fieldName="icon_url"
              tooltipText="Ícone 64x64 ou 128x128 PNG transparente. Arraste ou clique para enviar."
              folder="skills"
              value={form.icon_url}
              onChange={(url) => setForm({ ...form, icon_url: url })}
              hint="PNG transparente 128x128 — gerado na IA"
            />
          </div>
          <div>
            <label className="text-sm">Descrição <Tooltip text="Texto exibido ao jogador. Ex.: 'Causa 150 de dano e atordoa o inimigo por 1s'" /></label>
            <textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-sm">Efeitos (JSON) <Tooltip text='Efeitos adicionais em formato JSON. Ex.: {"stun_ms":1000} para atordoar, {"heal":50} para curar' /></label>
            <textarea name="effects" value={form.effects} onChange={e => setForm({...form, effects: e.target.value})} className="w-full border rounded px-2 py-1 font-mono text-xs" rows={4} placeholder='{"stun_ms":1000}' />
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativa</label>
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
              <th className="p-2 text-left">Ícone</th><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Alvo</th>
              <th className="p-2 text-left">Recarga</th><th className="p-2 text-left">Mana</th><th className="p-2 text-left">Dano</th>
              <th className="p-2 text-left">Ativa</th><th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {skills.map(skill => (
              <tr key={skill.id} className="border-t">
                <td className="p-2">
                  {skill.icon_url
                    ? <img src={skill.icon_url} alt={skill.name} className="w-10 h-10 object-contain rounded border bg-muted" />
                    : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="p-2 font-medium">
                  <button onClick={() => setViewing(skill)} className="underline underline-offset-2 hover:text-primary text-left">{skill.name}</button>
                </td>
                <td className="p-2">{SKILL_TYPES[skill.type] || skill.type}</td>
                <td className="p-2">{TARGETS[skill.target] || skill.target}</td>
                <td className="p-2">{skill.cooldown_ms}ms</td><td className="p-2">{skill.mana_cost}</td><td className="p-2">{skill.base_damage}</td>
                <td className="p-2">{skill.is_active ? 'Sim' : 'Não'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => setViewing(skill)} className="text-green-700 underline inline-flex items-center gap-1"><Eye size={12} /> Ver</button>
                  <button onClick={() => handleEdit(skill)} className="text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                  <button onClick={() => handleDelete(skill.id)} className="text-red-600 underline inline-flex items-center gap-1"><Trash2 size={12} /> Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <DetailModal title={viewing.name} onClose={() => setViewing(null)}>
          <DetailImage label="Ícone" url={viewing.icon_url} />
          <DetailRow label="Slug" value={<code>{viewing.slug}</code>} />
          <DetailRow label="Tipo / Alvo" value={`${SKILL_TYPES[viewing.type] || viewing.type} / ${TARGETS[viewing.target] || viewing.target}`} />
          <DetailRow label="Recarga / Mana / Dano" value={`${viewing.cooldown_ms}ms / ${viewing.mana_cost} / ${viewing.base_damage}`} />
          <DetailRow label="Animação" value={<code>{viewing.animation_key || '—'}</code>} />
          <DetailRow label="Efeitos" value={<code className="text-xs">{JSON.stringify(viewing.effects || {})}</code>} />
          <DetailRow label="Descrição" value={viewing.description || '—'} />
          <DetailRow label="Ativa" value={viewing.is_active ? 'Sim' : 'Não'} />
        </DetailModal>
      )}
    </div>
  )
}
