'use client'

import { useState, useEffect, useTransition } from 'react'
import { listSkills, createSkill, updateSkill, deleteSkill } from '@/lib/actions/skills'
import { Tooltip } from '@/components/ui/tooltip'
import { Zap, Plus, Pencil, Trash2, Eye, Sparkles, Copy } from 'lucide-react'
import { useTable, SearchBox, Th, Counters } from '@/components/ui/data-table'
import { ImageUpload } from '@/components/ui/image-upload'
import { DetailModal, DetailRow, DetailImage } from '@/components/ui/detail-modal'
import { suggestSkillStats } from '@/lib/balance'
import { listEffects, listSkillEffects, addSkillEffect, deleteSkillEffect } from '@/lib/actions/effects'

const SKILL_TYPES: Record<string, string> = { active: 'Ativa', passive: 'Passiva' }
const TARGETS: Record<string, string> = {
  self: 'Próprio jogador', enemy: 'Um inimigo', enemies: 'Todos os inimigos',
  ally: 'Um aliado', allies: 'Todos os aliados', aoe: 'Área (ao redor)',
}

const emptyForm = {
  slug: '', name: '', description: '', type: 'active', target: 'enemy',
  cooldown_ms: 0, mana_cost: 0, base_damage: 0, icon_url: '', animation_key: '',
  is_active: true, sort_order: 0,
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isPending, startTransition] = useTransition()
  const [viewing, setViewing] = useState<any>(null)
  const [refLevel, setRefLevel] = useState(5)
  const [allEffects, setAllEffects] = useState<any[]>([])
  const [usedEffects, setUsedEffects] = useState<any[]>([])
  const [effPick, setEffPick] = useState({ effect_id: '', value: 0 })

  const openDetail = (s: any) => {
    setViewing(s)
    listEffects().then(setAllEffects).catch(() => {})
    listSkillEffects(s.id).then(setUsedEffects).catch(() => setUsedEffects([]))
  }

  function applySuggestion() {
    const s = suggestSkillStats(refLevel)
    setForm({ ...form, cooldown_ms: s.cooldown_ms, mana_cost: s.mana_cost, base_damage: s.base_damage })
  }

  const load = () => listSkills().then(setSkills).catch(() => setSkills([]))
  const table = useTable(skills, {
    search: (s) => `${s.name} ${s.slug}`,
    sort: {
      name: (s) => s.name,
      type: (s) => SKILL_TYPES[s.type] || s.type,
      cooldown: (s) => s.cooldown_ms,
      damage: (s) => s.base_damage,
    },
  })
  const activeCount = skills.filter((s) => s.is_active).length
  useEffect(() => { load() }, [])

  const handleEdit = (skill: any) => {
    setEditing(skill)
    setForm({
      slug: skill.slug, name: skill.name, description: skill.description || '', type: skill.type,
      target: skill.target, cooldown_ms: skill.cooldown_ms, mana_cost: skill.mana_cost,
      base_damage: skill.base_damage, icon_url: skill.icon_url || '', animation_key: skill.animation_key || '',
      is_active: skill.is_active, sort_order: skill.sort_order,
    })
    setShowForm(true)
  }

  const handleClone = (skill: any) => {
    handleEdit(skill)
    setEditing(null)
    setForm((f) => ({ ...f, slug: `${skill.slug}-copia`, name: `${skill.name} (cópia)` }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateSkill(editing.id, fd)
      else await createSkill(fd)
      setShowForm(false); setEditing(null); setForm(emptyForm); load()
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
          <div className="flex items-end gap-2 rounded bg-muted/60 p-3">
            <div>
              <label className="text-sm font-medium">Nível de referência <Tooltip text="Nível do jogador para o qual esta skill é adequada. Usado só para calcular a sugestão — não é salvo." /></label>
              <input type="number" min={1} max={100} value={refLevel} onChange={e => setRefLevel(Number(e.target.value) || 1)} className="w-24 border rounded px-2 py-1" />
            </div>
            <button type="button" onClick={applySuggestion} className="px-3 py-1.5 rounded border bg-background hover:bg-muted inline-flex items-center gap-1 text-sm">
              <Sparkles size={14} /> Sugerir valores
            </button>
            <p className="text-xs text-muted-foreground">Preenche recarga/mana/dano pelo nível.</p>
          </div>
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
              tooltipText="Ícone 128x128. O admin recorta em círculo e salva PNG transparente automaticamente."
              folder="skills"
              value={form.icon_url}
              onChange={(url) => setForm({ ...form, icon_url: url })}
              hint="PNG/JPG/AVIF quadrado — vira círculo 512×512 PNG"
              circular
              forceSize={512}
            />
          </div>
          <div>
            <label className="text-sm">Descrição <Tooltip text="Texto exibido ao jogador. Ex.: 'Causa 150 de dano e atordoa o inimigo por 1s'" /></label>
            <textarea name="description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="rounded bg-muted/60 p-2 text-xs text-muted-foreground">
            Efeitos vinculados no botão <strong>Ver</strong> da lista (catálogo de efeitos, sem JSON).
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} /> Ativa</label>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <SearchBox value={table.q} onChange={table.setQ} placeholder="Pesquisar skill..." />
        <Counters total={skills.length} active={activeCount} shown={table.visible.length} totalLabel="skills" />
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Ícone</th>
              <Th label="Nome" k="name" active={table.sortKey === 'name'} dir={table.sortDir} onClick={table.toggle} />
              <Th label="Tipo" k="type" active={table.sortKey === 'type'} dir={table.sortDir} onClick={table.toggle} />
              <th className="p-2 text-left">Alvo</th>
              <Th label="Recarga" k="cooldown" active={table.sortKey === 'cooldown'} dir={table.sortDir} onClick={table.toggle} />
              <th className="p-2 text-left">Mana</th>
              <Th label="Dano" k="damage" active={table.sortKey === 'damage'} dir={table.sortDir} onClick={table.toggle} />
              <th className="p-2 text-left">Ativa</th><th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {table.visible.map((skill, i) => (
              <tr key={skill.id} className="border-t">
                <td className="p-2 text-muted-foreground">{i + 1}</td>
                <td className="p-2">
                  {skill.icon_url
                    ? <img src={skill.icon_url} alt={skill.name} className="w-10 h-10 object-contain rounded border bg-muted" />
                    : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                <td className="p-2 font-medium">
                  <button onClick={() => openDetail(skill)} className="underline underline-offset-2 hover:text-primary text-left">{skill.name}</button>
                </td>
                <td className="p-2">{SKILL_TYPES[skill.type] || skill.type}</td>
                <td className="p-2">{TARGETS[skill.target] || skill.target}</td>
                <td className="p-2">{skill.cooldown_ms}ms</td><td className="p-2">{skill.mana_cost}</td><td className="p-2">{skill.base_damage}</td>
                <td className="p-2">{skill.is_active ? 'Sim' : 'Não'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => openDetail(skill)} className="text-green-700 underline inline-flex items-center gap-1"><Eye size={12} /> Ver</button>
                  <button onClick={() => handleEdit(skill)} className="text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                  <button onClick={() => handleClone(skill)} className="underline inline-flex items-center gap-1" title="Abre edição com cópia para salvar com outro slug"><Copy size={12} /> Clonar</button>
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
          <DetailRow label="Descrição" value={viewing.description || '—'} />
          <DetailRow label="Ativa" value={viewing.is_active ? 'Sim' : 'Não'} />

          <h4 className="font-semibold mt-4 mb-1">Efeitos desta skill <Tooltip text="Selecione um efeito do catálogo e informe o valor personalizado. Ex.: Atordoar por 1000ms, Cura de 80." /></h4>
          {usedEffects.map((ue: any) => (
            <div key={ue.id} className="flex justify-between text-sm py-1 border-b last:border-0">
              <span>{ue.effects?.name}: <strong>{String(ue.value)}</strong></span>
              <button onClick={() => startTransition(() => deleteSkillEffect(ue.id).then(() => listSkillEffects(viewing.id).then(setUsedEffects)))} className="text-red-600 underline text-xs">Remover</button>
            </div>
          ))}
          {usedEffects.length === 0 && <p className="text-xs text-muted-foreground">Nenhum efeito vinculado. O campo effects antigo (JSON) foi descontinuado.</p>}
          <form onSubmit={(e) => { e.preventDefault(); startTransition(async () => { const fd = new FormData(); fd.set('skill_id', viewing.id); fd.set('effect_id', effPick.effect_id); fd.set('value', String(effPick.value)); await addSkillEffect(fd); setEffPick({ effect_id: '', value: 0 }); listSkillEffects(viewing.id).then(setUsedEffects) }) }} className="flex gap-2 mt-2">
            <select value={effPick.effect_id} onChange={e => setEffPick({ ...effPick, effect_id: e.target.value })} className="flex-1 border rounded px-2 py-1 text-sm" required>
              <option value="">Efeito…</option>
              {allEffects.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <input type="number" step="0.01" value={effPick.value} onChange={e => setEffPick({ ...effPick, value: Number(e.target.value) })} className="w-24 border rounded px-2 py-1 text-sm" title="Valor personalizado" />
            <button type="submit" className="px-3 py-1 border rounded text-sm">Adicionar</button>
          </form>
        </DetailModal>
      )}
    </div>
  )
}

