'use client'

import { useState, useEffect, useTransition } from 'react'
import { listSkillNodes, createSkillNode, updateSkillNode, deleteSkillNode } from '@/lib/actions/crafting'
import { listCharacters } from '@/lib/actions/characters'
import { listSkills } from '@/lib/actions/skills'
import { Tooltip } from '@/components/ui/tooltip'
import { Plus, Pencil, Trash2, Network } from 'lucide-react'

const emptyNode = { skill_id: '', position_x: 0, position_y: 0, cost_points: 1, cost_gold: 0, required_level: 1, requires_node_id: '', description: '' }

export default function ArvorePage() {
  const [chars, setChars] = useState<any[]>([])
  const [charId, setCharId] = useState('')
  const [skills, setSkills] = useState<any[]>([])
  const [nodes, setNodes] = useState<any[]>([])
  const [form, setForm] = useState(emptyNode)
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    listCharacters().then(setChars).catch(() => {})
    listSkills().then(setSkills).catch(() => {})
  }, [])

  const load = (id = charId) => {
    if (!id) return
    listSkillNodes(id).then(setNodes).catch(() => setNodes([]))
  }

  const selectChar = (id: string) => { setCharId(id); setEditing(null); setShowForm(false); listSkillNodes(id).then(setNodes).catch(() => setNodes([])) }

  const handleEdit = (n: any) => {
    setEditing(n)
    setForm({ skill_id: n.skill_id, position_x: n.position_x, position_y: n.position_y, cost_points: n.cost_points, cost_gold: n.cost_gold, required_level: n.required_level, requires_node_id: n.requires_node_id || '', description: n.description || '' })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('character_id', charId)
      fd.set('skill_id', form.skill_id)
      fd.set('position_x', String(form.position_x))
      fd.set('position_y', String(form.position_y))
      fd.set('cost_points', String(form.cost_points))
      fd.set('cost_gold', String(form.cost_gold))
      fd.set('required_level', String(form.required_level))
      fd.set('requires_node_id', form.requires_node_id)
      fd.set('description', form.description)
      if (editing) await updateSkillNode(editing.id, fd)
      else await createSkillNode(fd)
      setShowForm(false); setEditing(null); setForm(emptyNode); load()
    })
  }

  const maxY = Math.max(0, ...nodes.map(n => n.position_y))

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2"><Network size={20} /> Árvore de Habilidades</h2>
        <p className="text-sm text-muted-foreground">Um nó por skill de cada personagem: posição na grade, custos, nível e pré-requisito</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {chars.map(c => (
          <button key={c.id} onClick={() => selectChar(c.id)} className={`px-4 py-2 rounded border ${charId === c.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{c.name}</button>
        ))}
      </div>
      {chars.length === 0 && <p className="text-sm text-muted-foreground">Cadastre personagens primeiro.</p>}

      {charId && (
        <>
          <button onClick={() => { setEditing(null); setForm({ ...emptyNode, position_y: maxY + 1 }); setShowForm(true) }} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2 mb-4"><Plus size={16} /> Novo Nó</button>

          {showForm && (
            <form onSubmit={handleSubmit} className="border rounded p-4 mb-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm">Skill <Tooltip text="Cada skill aparece uma vez por personagem na árvore" /></label>
                  <select value={form.skill_id} onChange={e => setForm({ ...form, skill_id: e.target.value })} className="w-full border rounded px-2 py-1" required disabled={!!editing}>
                    <option value="">—</option>
                    {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div><label className="text-sm">Coluna (X) <Tooltip text="Posição horizontal na grade da árvore" /></label><input type="number" value={form.position_x} onChange={e => setForm({ ...form, position_x: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                <div><label className="text-sm">Linha (Y) <Tooltip text="Posição vertical: linhas de baixo = skills avançadas" /></label><input type="number" value={form.position_y} onChange={e => setForm({ ...form, position_y: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                <div><label className="text-sm">Custo em pontos <Tooltip text="Pontos de habilidade gastos ao desbloquear" /></label><input type="number" value={form.cost_points} onChange={e => setForm({ ...form, cost_points: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                <div><label className="text-sm">Custo em ouro</label><input type="number" value={form.cost_gold} onChange={e => setForm({ ...form, cost_gold: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                <div><label className="text-sm">Nível requerido <Tooltip text="Nível mínimo do personagem para desbloquear" /></label><input type="number" value={form.required_level} onChange={e => setForm({ ...form, required_level: Number(e.target.value) })} className="w-full border rounded px-2 py-1" /></div>
                <div className="col-span-2"><label className="text-sm">Pré-requisito (nó anterior) <Tooltip text="O jogador precisa desbloquear este nó antes. Vazio = sem pré-requisito." /></label>
                  <select value={form.requires_node_id} onChange={e => setForm({ ...form, requires_node_id: e.target.value })} className="w-full border rounded px-2 py-1">
                    <option value="">Nenhum</option>
                    {nodes.filter(n => !editing || n.id !== editing.id).map(n => <option key={n.id} value={n.id}>{n.skills?.name} (x{n.position_x}, y{n.position_y})</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-sm">Descrição do nó</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-2 py-1" /></div>
              <div className="flex gap-2">
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">{isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancelar</button>
              </div>
            </form>
          )}

          <div className="border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="p-2 text-left">Skill</th><th className="p-2 text-left">Posição</th><th className="p-2 text-left">Custo</th><th className="p-2 text-left">Nv req.</th><th className="p-2 text-left">Pré-req.</th><th className="p-2 text-left">Ações</th></tr></thead>
              <tbody>
                {nodes.map(n => (
                  <tr key={n.id} className="border-t">
                    <td className="p-2 font-medium">{n.skills?.name}</td>
                    <td className="p-2">({n.position_x}, {n.position_y})</td>
                    <td className="p-2">{n.cost_points} pts{n.cost_gold > 0 ? ` + ${n.cost_gold} ouro` : ''}</td>
                    <td className="p-2">{n.required_level}</td>
                    <td className="p-2 text-xs text-muted-foreground">{n.requires_node_id ? n.requires_node_id.slice(0, 8) + '…' : '—'}</td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => handleEdit(n)} className="text-blue-600 underline inline-flex items-center gap-1"><Pencil size={12} /> Editar</button>
                      <button onClick={() => { if (confirm('Excluir nó?')) startTransition(() => deleteSkillNode(n.id).then(() => load())) }} className="text-red-600 underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {nodes.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum nó ainda. Comece pela skill básica em (0, 0).</p>}
          </div>
        </>
      )}
    </div>
  )
}
