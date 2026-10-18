'use client'

import { useEffect, useState, useTransition } from 'react'
import { PawPrint, Plus, Pencil, Trash2, Sparkles, Utensils, Timer, Egg } from 'lucide-react'

import {
  listPetTemplatesWithSkills, createPetTemplate, updatePetTemplate, deletePetTemplate,
  addPetSkill, updatePetSkill, deletePetSkill,
  addPetDietItem, deletePetDietItem,
  upsertIncubationConfig, getIncubationConfig,
} from '@/lib/actions/pets'
import { listItems } from '@/lib/actions/items'
import { listSkills } from '@/lib/actions/skills'
import { ImageUpload } from '@/components/ui/image-upload'

const RARITY_COLORS: Record<string, string> = {
  common: 'border-slate-500 text-slate-300',
  uncommon: 'border-green-500 text-green-300',
  rare: 'border-blue-500 text-blue-300',
  epic: 'border-purple-500 text-purple-300',
  legendary: 'border-amber-500 text-amber-300',
}

type Tab = 'templates' | 'skills' | 'diet' | 'incubation'

export default function PetsPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('templates')
  const [, start] = useTransition()

  const reload = () => start(async () => {
    const list = await listPetTemplatesWithSkills()
    setTemplates(list)
    setActive((cur: any) => (cur ? list.find((t) => t.id === cur.id) ?? cur : list[0] ?? null))
  })

  useEffect(() => {
    let alive = true
    listPetTemplatesWithSkills().then((list) => {
      if (!alive) return
      setTemplates(list)
      setActive(list[0] ?? null)
    })
    return () => { alive = false }
  }, [])

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-amber-300 flex items-center gap-2">
            <PawPrint size={18} /> Pets
          </h1>
          <p className="text-[11px] text-slate-500">
            Templates de pets, habilidades, dieta, incubação e bônus em companhia.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {([
            ['templates', 'Templates', PawPrint],
            ['skills', 'Habilidades', Sparkles],
            ['diet', 'Dieta', Utensils],
            ['incubation', 'Incubação', Egg],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              disabled={key !== 'templates' && !active}
              onClick={() => setTab(key as Tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border transition disabled:opacity-40 ${
                tab === key
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <aside className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-bold uppercase">Templates</p>
            <button onClick={() => { setActive(null); setTab('templates') }}
              className="p-1 rounded border border-slate-700 text-amber-400 hover:border-amber-500/60">
              <Plus size={12} />
            </button>
          </div>
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t)}
              className={`w-full flex items-center gap-2 p-2 rounded border text-left transition ${
                active?.id === t.id
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              {t.image_url
                ? <img src={t.image_url} className="w-9 h-9 rounded object-cover border border-amber-500/30" />
                : <div className="w-9 h-9 rounded border border-slate-700 bg-slate-800 flex items-center justify-center">
                    <PawPrint size={14} className="text-amber-600" />
                  </div>}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-amber-200 truncate">{t.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{t.class_name || '—'}</p>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${RARITY_COLORS[t.rarity] || RARITY_COLORS.common}`}>
                {t.rarity.slice(0, 3).toUpperCase()}
              </span>
            </button>
          ))}
          {templates.length === 0 && (
            <p className="text-[11px] text-slate-600 px-2">Nenhum template ainda.</p>
          )}
        </aside>

        <main className="space-y-3">
          {tab === 'templates' && <TemplateForm editing={active} onDone={reload} />}
          {tab === 'skills' && active && <SkillsTab pet={active} onDone={reload} />}
          {tab === 'diet' && active && <DietTab pet={active} onDone={reload} />}
          {tab === 'incubation' && active && <IncubationTab pet={active} onDone={reload} />}
        </main>
      </div>
    </div>
  )
}

// ==================== TEMPLATE ====================

function TemplateForm({ editing, onDone }: any) {
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [, start] = useTransition()
  const f = editing ?? {
    slug: '', name: '', class_name: '', description: '',
    image_url: '', image_attack_url: '',
    rarity: 'common',
    base_hp: 50, base_mp: 20, base_atk: 5, base_def: 3, base_speed: 100,
    companion_atk_bonus: 0, companion_def_bonus: 0, companion_hp_bonus: 0,
    companion_mp_bonus: 0, companion_speed_bonus: 0,
    xp_share_percent: 10, special_effect: '',
    is_active: true, sort_order: 0,
  }

  return (
    <div className="space-y-3">
      {!show && editing && (
        <div className="flex gap-2">
          <button onClick={() => setShow(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white">
            <Pencil size={12} /> Editar
          </button>
          <button onClick={() => start(async () => {
            if (!confirm(`Apagar "${editing.name}"?`)) return
            await deletePetTemplate(editing.id)
            onDone()
          })} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-red-800 text-red-400 hover:bg-red-900/20">
            <Trash2 size={12} /> Apagar
          </button>
        </div>
      )}

      {(!editing || show) && (
        <form action={(fd: FormData) => start(async () => {
          setErr('')
          try {
            if (editing) await updatePetTemplate(editing.id, fd)
            else await createPetTemplate(fd)
            setShow(false); onDone()
          } catch (e: any) { setErr(e?.message ?? String(e)) }
        })} className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome"><input name="name" defaultValue={f.name} required className={inputCls} /></Field>
            <Field label="Slug"><input name="slug" defaultValue={f.slug} required className={inputCls} /></Field>
            <Field label="Classe"><input name="class_name" defaultValue={f.class_name ?? ''} className={inputCls} /></Field>
            <Field label="Raridade">
              <select name="rarity" defaultValue={f.rarity} className={inputCls}>
                <option value="common">Comum</option>
                <option value="uncommon">Incomum</option>
                <option value="rare">Raro</option>
                <option value="epic">Épico</option>
                <option value="legendary">Lendário</option>
              </select>
            </Field>
          </div>
          <Field label="Descrição">
            <textarea name="description" rows={2} defaultValue={f.description ?? ''} className={inputCls} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Imagem parado">
              <ImageUpload label="Idle" fieldName="image_url" folder="pets" value={f.image_url ?? ''}
                tooltipText="Imagem parado" hint="PNG/JPG quadrado"
                onChange={(url) => { (document.getElementById('pet-img') as HTMLInputElement).value = url }} />
              <input type="hidden" id="pet-img" name="image_url" defaultValue={f.image_url ?? ''} />
            </Field>
            <Field label="Imagem atacando">
              <ImageUpload label="Ataque" fieldName="image_attack_url" folder="pets" value={f.image_attack_url ?? ''}
                tooltipText="Imagem de ataque" hint="PNG/JPG quadrado"
                onChange={(url) => { (document.getElementById('pet-atk-img') as HTMLInputElement).value = url }} />
              <input type="hidden" id="pet-atk-img" name="image_attack_url" defaultValue={f.image_attack_url ?? ''} />
            </Field>
          </div>

          <div className="border border-slate-700 rounded p-3 space-y-2">
            <p className="text-[11px] text-amber-300 font-bold uppercase">Stats base</p>
            <div className="grid gap-3 sm:grid-cols-5">
              <Field label="HP"><input name="base_hp" type="number" defaultValue={String(f.base_hp)} className={inputCls} /></Field>
              <Field label="MP"><input name="base_mp" type="number" defaultValue={String(f.base_mp)} className={inputCls} /></Field>
              <Field label="ATK"><input name="base_atk" type="number" defaultValue={String(f.base_atk)} className={inputCls} /></Field>
              <Field label="DEF"><input name="base_def" type="number" defaultValue={String(f.base_def)} className={inputCls} /></Field>
              <Field label="Velocidade"><input name="base_speed" type="number" defaultValue={String(f.base_speed)} className={inputCls} /></Field>
            </div>
          </div>

          <div className="border border-slate-700 rounded p-3 space-y-2">
            <p className="text-[11px] text-emerald-300 font-bold uppercase">Bônus em companhia (quando equipado)</p>
            <div className="grid gap-3 sm:grid-cols-5">
              <Field label="+ATK herói"><input name="companion_atk_bonus" type="number" defaultValue={String(f.companion_atk_bonus)} className={inputCls} /></Field>
              <Field label="+DEF herói"><input name="companion_def_bonus" type="number" defaultValue={String(f.companion_def_bonus)} className={inputCls} /></Field>
              <Field label="+HP herói"><input name="companion_hp_bonus" type="number" defaultValue={String(f.companion_hp_bonus)} className={inputCls} /></Field>
              <Field label="+MP herói"><input name="companion_mp_bonus" type="number" defaultValue={String(f.companion_mp_bonus)} className={inputCls} /></Field>
              <Field label="+Vel. herói"><input name="companion_speed_bonus" type="number" defaultValue={String(f.companion_speed_bonus)} className={inputCls} /></Field>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="% XP compartilhado">
              <input name="xp_share_percent" type="number" defaultValue={String(f.xp_share_percent)} className={inputCls} />
            </Field>
            <Field label="Efeito especial (texto)">
              <input name="special_effect" defaultValue={f.special_effect ?? ''} className={inputCls} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="is_active" defaultChecked={f.is_active} /> Ativo
          </label>
          {err && <p className="text-red-400 text-xs">{err}</p>}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold">Salvar</button>
            {editing && <button type="button" onClick={() => setShow(false)}
              className="px-4 py-2 rounded border border-slate-700 text-slate-400 text-xs">Cancelar</button>}
          </div>
        </form>
      )}
    </div>
  )
}

// ==================== HABILIDADES ====================

function SkillsTab({ pet, onDone }: any) {
  const [rows, setRows] = useState<any[]>(pet.pet_template_skills || [])
  const [skills, setSkills] = useState<any[]>([])
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  useEffect(() => {
    let alive = true
    listSkills().then((r) => { if (alive) setSkills(r) })
    return () => { alive = false }
  }, [])

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      fd.set('pet_template_id', pet.id)
      if (editing) await updatePetSkill(editing.id, fd)
      else await addPetSkill(fd)
      setShow(false); setEditing(null); onDone()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShow(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white">
          <Plus size={13} /> Nova habilidade
        </button>
      </div>

      {rows.length === 0 && <p className="text-xs text-slate-600">Nenhuma habilidade.</p>}

      <div className="grid gap-2">
        {rows.map((s: any) => (
          <div key={s.id} className="border border-slate-700 rounded bg-slate-900/60 p-3 flex gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-200">{s.skills?.name ?? '—'}</p>
              <p className="text-[10px] text-slate-500">Desbloqueia no nível {s.unlock_level}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditing(s); setShow(true) }}
                className="p-1.5 rounded border border-slate-700 text-amber-400"><Pencil size={11} /></button>
              <button onClick={() => start(async () => { await deletePetSkill(s.id); onDone() })}
                className="p-1.5 rounded border border-slate-700 text-red-400"><Trash2 size={11} /></button>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <form action={submit} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-lg space-y-3">
            <h3 className="font-bold text-amber-300">Habilidade do Pet</h3>
            <Field label="Habilidade (catálogo geral)">
              <select name="skill_id" defaultValue={editing?.skill_id ?? ''} required className={inputCls}>
                <option value="">— escolha —</option>
                {skills.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Nível para desbloquear">
              <input name="unlock_level" type="number" defaultValue={String(editing?.unlock_level ?? 1)} className={inputCls} />
            </Field>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="is_active" defaultChecked={editing?.is_active ?? true} /> Ativa
            </label>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold">Salvar</button>
          </form>
        </div>
      )}
    </div>
  )
}

// ==================== DIETA ====================

function DietTab({ pet, onDone }: any) {
  const [rows, setRows] = useState<any[]>(pet.pet_template_diet || [])
  const [items, setItems] = useState<any[]>([])
  const [, start] = useTransition()

  useEffect(() => {
    let alive = true
    listItems().then((r) => { if (alive) setItems(r) })
    return () => { alive = false }
  }, [])

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500">Itens que alimentam o pet e dão XP.</p>
      <form action={(fd: FormData) => start(async () => {
        fd.set('pet_template_id', pet.id)
        await addPetDietItem(fd)
        onDone()
      })} className="border border-slate-700 rounded bg-slate-900/60 p-3 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[180px]">
          <Field label="Item">
            <select name="item_id" required className={inputCls}>
              <option value="">— escolha —</option>
              {items.map((i: any) => <option key={i.id} value={i.id}>{i.name} ({i.rarity})</option>)}
            </select>
          </Field>
        </div>
        <div className="w-32">
          <Field label="XP/unidade">
            <input name="xp_per_unit" type="number" defaultValue="10" className={inputCls} />
          </Field>
        </div>
        <button className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold">Adicionar</button>
      </form>
      <div className="grid gap-1.5">
        {rows.map((d: any) => (
          <div key={d.id} className="flex items-center gap-2 border border-slate-800 rounded px-2.5 py-1.5 text-xs">
            <span className="flex-1">{d.items?.name}</span>
            <span className="text-amber-300 font-bold">+{d.xp_per_unit} XP</span>
            <button onClick={() => start(async () => { await deletePetDietItem(d.id); onDone() })}
              className="p-1 rounded border border-slate-700 text-red-400"><Trash2 size={10} /></button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-slate-600">Dieta vazia.</p>}
      </div>
    </div>
  )
}

// ==================== INCUBAÇÃO ====================

function IncubationTab({ pet, onDone }: any) {
  const [config, setConfig] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [err, setErr] = useState('')
  const [, start] = useTransition()

  useEffect(() => {
    let alive = true
    getIncubationConfig(pet.id).then((c) => { if (alive) setConfig(c) })
    listItems().then((r) => { if (alive) setItems(r) })
    return () => { alive = false }
  }, [pet.id])

  const submit = (fd: FormData) => start(async () => {
    setErr('')
    try {
      fd.set('pet_template_id', pet.id)
      await upsertIncubationConfig(fd)
      onDone()
    } catch (e: any) { setErr(e?.message ?? String(e)) }
  })

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500">
        Configuração de incubação e cooldown para chocar o ovo deste pet.
      </p>
      <form action={submit} className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Horas de incubação">
            <input name="incubation_hours" type="number" defaultValue={String(config?.incubation_hours ?? 24)} className={inputCls} />
          </Field>
          <Field label="Horas de cooldown">
            <input name="cooldown_hours" type="number" defaultValue={String(config?.cooldown_hours ?? 48)} className={inputCls} />
          </Field>
          <Field label="Taxa de sucesso (%)">
            <input name="success_rate_percent" type="number" defaultValue={String(config?.success_rate_percent ?? 80)} className={inputCls} />
          </Field>
          <Field label="Quantidade do item">
            <input name="required_item_qty" type="number" defaultValue={String(config?.required_item_qty ?? 1)} className={inputCls} />
          </Field>
        </div>
        <Field label="Item necessário">
          <select name="required_item_id" defaultValue={config?.required_item_id ?? ''} className={inputCls}>
            <option value="">— nenhum —</option>
            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </Field>
        {err && <p className="text-red-400 text-xs">{err}</p>}
        <button className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold">Salvar configuração</button>
      </form>
    </div>
  )
}

// ==================== HELPERS ====================

const inputCls = 'w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-xs text-slate-200 outline-none focus:border-amber-500'

function Field({ label, children }: any) {
  return <div className="space-y-1"><label className="block text-[11px] text-slate-400">{label}</label>{children}</div>
}
