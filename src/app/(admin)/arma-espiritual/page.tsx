'use client'

import { useEffect, useState, useTransition } from 'react'
import { Flame, Plus, Pencil, Trash2, Sparkles, ScrollText, Utensils, TrendingUp } from 'lucide-react'

import {
  listSpiritWeapons, createSpiritWeapon, updateSpiritWeapon, deleteSpiritWeapon,
  listSpiritSkills, createSpiritSkill, updateSpiritSkill, deleteSpiritSkill,
  listSpiritDiet, createSpiritDiet, updateSpiritDiet, deleteSpiritDiet,
  listSpiritBonuses, upsertSpiritBonus, deleteSpiritBonus,
  listSpiritXpTable, upsertSpiritXpRow, deleteSpiritXpRow,
} from '@/lib/actions/commerce'
import { listItems } from '@/lib/actions/items'
import { ImageUpload } from '@/components/ui/image-upload'
import { Counters } from '@/components/ui/data-table'

const EFFECT_TYPES = [
  ['fire', 'Fogo'], ['slash', 'Corte'], ['ice', 'Gelo'], ['heal', 'Cura'],
  ['poison', 'Veneno'], ['lightning', 'Raio'], ['buff', 'Bônus'],
  ['debuff', 'Maldição'], ['arcane', 'Arcano'], ['dark', 'Sombrio'],
]

type Tab = 'armas' | 'habilidades' | 'dieta' | 'progressao' | 'xp'

export default function ArmaEspiritualPage() {
  const [weapons, setWeapons] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('armas')
  const [, start] = useTransition()

  const reload = () => start(async () => {
    setWeapons(await listSpiritWeapons())
    setActive((cur: any) => (cur ? weapons.find((w) => w.id === cur.id) ?? cur : weapons[0] ?? null))
  })
  useEffect(() => {
    let alive = true
    listSpiritWeapons().then((list) => {
      if (!alive) return
      setWeapons(list)
      setActive(list[0] ?? null)
    })
    return () => { alive = false }
  }, [])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-bold text-amber-300 flex items-center gap-2">
          <Flame size={18} /> Arma Espiritual
        </h1>
        <p className="text-[11px] text-slate-500">
          Templates prontos, habilidades exclusivas por nível, dieta de alimentação e progressão editável.
        </p>
      </header>

      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        <aside className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-bold uppercase">Templates</p>
            <button onClick={() => { setActive(null); setTab('armas') }}
              className="p-1 rounded border border-slate-700 text-amber-400 hover:border-amber-500/60">
              <Plus size={12} />
            </button>
          </div>
          {weapons.map((w) => (
            <button
              key={w.id}
              onClick={() => setActive(w)}
              className={`w-full flex items-center gap-2 p-2 rounded border text-left transition ${
                active?.id === w.id
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              {w.image_url
                ? <img src={w.image_url} className="w-9 h-9 rounded object-cover border border-amber-500/30" />
                : <div className="w-9 h-9 rounded border border-slate-700 bg-slate-800 flex items-center justify-center">
                    <Flame size={14} className="text-amber-600" />
                  </div>}
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-200 truncate">{w.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{w.class_name || '—'}</p>
              </div>
            </button>
          ))}
          {weapons.length === 0 && (
            <p className="text-[11px] text-slate-600 px-2">Nenhum template ainda.</p>
          )}
        </aside>

        <main className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {([
              ['armas', 'Template', Flame],
              ['habilidades', 'Habilidades', Sparkles],
              ['dieta', 'Dieta', Utensils],
              ['progressao', 'Progressão', TrendingUp],
              ['xp', 'Tabela XP', ScrollText],
            ] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                disabled={key !== 'armas' && key !== 'xp' && !active}
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

          {tab === 'armas' && <WeaponForm editing={active} onDone={reload} onNew={() => setActive(null)} />}
          {tab === 'habilidades' && active && <Skills weapon={active} />}
          {tab === 'dieta' && active && <Diet weapon={active} />}
          {tab === 'progressao' && active && <Bonuses weapon={active} />}
          {tab === 'xp' && <XpTable />}
        </main>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════ TEMPLATE

function WeaponForm({ editing, onDone, onNew }: any) {
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [, start] = useTransition()
  const f = editing ?? {
    slug: '', name: '', class_name: '', description: '', image_url: '',
    fire_effect: true, base_damage: 10, special_damage: 5,
    xp_rate_percent: 10, is_active: true, sort_order: 0,
  }

  return (
    <div className="space-y-3">
      {!show && editing && (
        <div className="flex gap-2">
          <button onClick={() => setShow(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white">
            <Pencil size={12} /> Editar template
          </button>
          <button onClick={() => start(async () => {
            if (!confirm(`Apagar "${editing.name}"? As habilidades e a dieta dele também serão apagadas.`)) return
            await deleteSpiritWeapon(editing.id)
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
            if (editing) await updateSpiritWeapon(editing.id, fd)
            else await createSpiritWeapon(fd)
            setShow(false); onDone()
          } catch (e: any) { setErr(e?.message ?? String(e)) }
        })} className="border border-slate-700 rounded bg-slate-900/60 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome"><input name="name" defaultValue={f.name} required
              className={inputCls} /></Field>
            <Field label="Slug"><input name="slug" defaultValue={f.slug} required className={inputCls} /></Field>
            <Field label="Classe"><input name="class_name" defaultValue={f.class_name ?? ''}
              placeholder="Vulcânica" className={inputCls} /></Field>
            <Field label="Ordem"><input name="sort_order" type="number" defaultValue={String(f.sort_order)} className={inputCls} /></Field>
          </div>
          <Field label="Descrição">
            <textarea name="description" rows={2} defaultValue={f.description ?? ''} className={inputCls} />
          </Field>
          <Field label="Imagem do espírito">
            <ImageUpload
                label="Imagem"
                fieldName="image_url"
                tooltipText="Arte do espírito"
                folder="spirit"
                hint="PNG/JPG quadrado"
                circular
                value={f.image_url ?? ''}
                onChange={(url) => { (document.getElementById('sp-img') as HTMLInputElement).value = url }}
              />
            <input type="hidden" id="sp-img" name="image_url" defaultValue={f.image_url ?? ''} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Dano base"><input name="base_damage" type="number" defaultValue={String(f.base_damage)} className={inputCls} /></Field>
            <Field label="Dano especial"><input name="special_damage" type="number" defaultValue={String(f.special_damage)} className={inputCls} /></Field>
            <Field label="% XP absorvido do herói"><input name="xp_rate_percent" type="number" defaultValue={String(f.xp_rate_percent)} className={inputCls} /></Field>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="fire_effect" defaultChecked={f.fire_effect} />
            Efeito de fogo dourado no inventário e equipado
          </label>
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

// ══════════════════════════════════════════ HABILIDADES

function Skills({ weapon }: any) {
  const [rows, setRows] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [, start] = useTransition()

  const reload = () => start(async () => setRows(await listSpiritSkills(weapon.id)))
  useEffect(() => { reload() }, [weapon.id])

  const blank = {
    name: '', description: '', icon_url: '', effect_lottie_url: '',
    effect_type: 'fire', effect_color: '#FFB300',
    unlock_level: 1, echo_cost: 0, base_damage: 0,
    damage_per_level: 0, effect_intensity_per_level: 0.1,
    is_active: true, sort_order: 0,
  }
  const f = editing ?? blank

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShow(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white">
          <Plus size={13} /> Nova habilidade
        </button>
      </div>

      {rows.length === 0 && <p className="text-xs text-slate-600">Nenhuma habilidade neste template.</p>}

      <div className="grid gap-2">
        {rows.map((s) => (
          <div key={s.id} className="border border-slate-700 rounded bg-slate-900/60 p-3 flex gap-3">
            <div className="w-9 shrink-0">
              {s.icon_url ? <img src={s.icon_url} className="w-9 h-9 rounded border border-slate-600 object-cover" />
                : <div className="w-9 h-9 rounded border border-slate-700 bg-slate-800 flex items-center justify-center">
                    <Sparkles size={13} className="text-amber-500" />
                  </div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-200">
                {s.name}
                <span className="ml-2 text-[10px] text-slate-500">libera no nível {s.unlock_level}</span>
              </p>
              <p className="text-[10px] text-slate-400 line-clamp-2">{s.description}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                dano {s.base_damage} +{s.damage_per_level}/nível • custo {s.echo_cost} eco •
                efeito +{Number(s.effect_intensity_per_level).toFixed(2)}/nível • {s.effect_type}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => { setEditing(s); setShow(true) }}
                className="p-1.5 rounded border border-slate-700 text-amber-400"><Pencil size={11} /></button>
              <button onClick={() => start(async () => {
                if (!confirm(`Apagar "${s.name}"?`)) return
                await deleteSpiritSkill(s.id); await reload()
              })} className="p-1.5 rounded border border-slate-700 text-red-400"><Trash2 size={11} /></button>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <form action={(fd: FormData) => start(async () => {
            fd.set('spirit_weapon_id', weapon.id)
            if (editing) await updateSpiritSkill(editing.id, fd)
            else await createSpiritSkill(fd)
            setShow(false); await reload()
          })} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex justify-between">
              <h3 className="font-bold text-amber-300">Habilidade do espírito</h3>
              <button type="button" onClick={() => setShow(false)} className="text-slate-500">✕</button>
            </div>
            <Field label="Nome"><input name="name" defaultValue={f.name} required className={inputCls} /></Field>
            <Field label="Descrição">
              <textarea name="description" rows={2} defaultValue={f.description ?? ''} className={inputCls} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ícone"><input name="icon_url" defaultValue={f.icon_url ?? ''} className={inputCls} /></Field>
              <Field label="Lottie (.json)"><input name="effect_lottie_url" defaultValue={f.effect_lottie_url ?? ''} className={inputCls} /></Field>
              <Field label="Tipo de efeito">
                <select name="effect_type" defaultValue={f.effect_type} className={inputCls}>
                  {EFFECT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <Field label="Cor do efeito"><input name="effect_color" defaultValue={f.effect_color} className={inputCls} /></Field>
              <Field label="Nível para liberar"><input name="unlock_level" type="number" defaultValue={String(f.unlock_level)} className={inputCls} /></Field>
              <Field label="Custo (eco)"><input name="echo_cost" type="number" defaultValue={String(f.echo_cost)} className={inputCls} /></Field>
              <Field label="Dano base"><input name="base_damage" type="number" defaultValue={String(f.base_damage)} className={inputCls} /></Field>
              <Field label="Dano por nível"><input name="damage_per_level" type="number" defaultValue={String(f.damage_per_level)} className={inputCls} /></Field>
              <Field label="Intensidade do efeito por nível">
                <input name="effect_intensity_per_level" type="number" step="0.05"
                  defaultValue={String(f.effect_intensity_per_level)} className={inputCls} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="is_active" defaultChecked={f.is_active} /> Ativa
            </label>
            <button className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold">Salvar</button>
          </form>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════ DIETA

function Diet({ weapon }: any) {
  const [rows, setRows] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [, start] = useTransition()

  const reload = () => start(async () => setRows(await listSpiritDiet(weapon.id)))

  useEffect(() => {
    let alive = true
    listItems().then((r) => { if (alive) setItems(r) })
    return () => { alive = false }
  }, [weapon.id])

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500">
        Itens nesta lista alimentam o espírito com o XP definido aqui. Qualquer outro item da mochila
        dá XP automático pelo rank (o app calcula).
      </p>
      <form action={(fd: FormData) => start(async () => {
        fd.set('spirit_weapon_id', weapon.id)
        if (editing) await updateSpiritDiet(editing.id, fd)
        else await createSpiritDiet(fd)
        setEditing(null); await reload()
      })} className="border border-slate-700 rounded bg-slate-900/60 p-3 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[180px]">
          <Field label="Item">
            <select name="item_id" defaultValue={editing?.item_id ?? ''} required className={inputCls}>
              <option value="">— escolha —</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.rarity})</option>)}
            </select>
          </Field>
        </div>
        <div className="w-32">
          <Field label="XP por unidade">
            <input name="xp_per_unit" type="number" defaultValue={String(editing?.xp_per_unit ?? 10)} className={inputCls} />
          </Field>
        </div>
        <button className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold">
          {editing ? 'Salvar' : 'Adicionar'}
        </button>
        {editing && (
          <button type="button" onClick={() => setEditing(null)}
            className="px-3 py-2 rounded border border-slate-700 text-slate-400 text-xs">Cancelar</button>
        )}
      </form>

      <div className="grid gap-1.5">
        {rows.map((d) => (
          <div key={d.id} className="flex items-center gap-2 border border-slate-800 rounded px-2.5 py-1.5 text-xs">
            <span className="flex-1">{d.items?.name}</span>
            <span className="text-amber-300 font-bold">+{d.xp_per_unit} XP</span>
            <button onClick={() => setEditing(d)} className="p-1 rounded border border-slate-700 text-amber-400"><Pencil size={10} /></button>
            <button onClick={() => start(async () => { await deleteSpiritDiet(d.id); await reload() })}
              className="p-1 rounded border border-slate-700 text-red-400"><Trash2 size={10} /></button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-slate-600">Dieta vazia (todos os itens usam o XP por rank).</p>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════ PROGRESSÃO

function Bonuses({ weapon }: any) {
  const [rows, setRows] = useState<any[]>([])
  const [, start] = useTransition()
  const reload = () => start(async () => setRows(await listSpiritBonuses(weapon.id)))
  useEffect(() => { reload() }, [weapon.id])

  const totalBase = rows.reduce((s, r) => s + r.damage_base_bonus, 0)
  const totalSpec = rows.reduce((s, r) => s + r.damage_special_bonus, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          Bônus por nível do espírito. Você controla o balanceamento aqui — sem mexer em código.
        </p>
        <button onClick={() => {
          const lv = prompt('Nível a adicionar?', String((rows[rows.length - 1]?.level ?? 0) + 1))
          if (lv) start(async () => {
            const fd = new FormData()
            fd.set('spirit_weapon_id', weapon.id)
            fd.set('level', lv); fd.set('damage_base_bonus', '1')
            fd.set('damage_special_bonus', '0'); fd.set('xp_to_next', '100')
            await upsertSpiritBonus(fd); await reload()
          })
        }} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-600 hover:bg-amber-500 text-white">
          <Plus size={13} /> Nível
        </button>
      </div>

      <Counters items={[
        { label: 'Níveis', value: rows.length },
        { label: 'Dano base acumulado', value: totalBase },
        { label: 'Dano especial acumulado', value: totalSpec },
      ]} />

      <div className="border border-slate-800 rounded overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-400">
            <tr className="text-left"><Th>Nível</Th><Th>+Dano base</Th><Th>+Dano especial</Th><Th>XP p/ o próximo</Th><Th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-800">
                <Td className="font-bold text-amber-300">{r.level}</Td>
                <Td><NumCell value={r.damage_base_bonus} onSave={(v) => save(r.id, 'damage_base_bonus', v)} /></Td>
                <Td><NumCell value={r.damage_special_bonus} onSave={(v) => save(r.id, 'damage_special_bonus', v)} /></Td>
                <Td><NumCell value={r.xp_to_next} onSave={(v) => save(r.id, 'xp_to_next', v)} /></Td>
                <Td><button onClick={() => start(async () => { await deleteSpiritBonus(r.id); await reload() })}
                  className="p-1 rounded border border-slate-700 text-red-400"><Trash2 size={10} /></button></Td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-500">
              Sem progressão cadastrada — o app usará +1/+1 a cada 2 níveis.
            </td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )

  function save(id: string, field: string, value: string) {
    start(async () => {
      const row = rows.find((r) => r.id === id)
      const fd = new FormData()
      fd.set('spirit_weapon_id', weapon.id)
      fd.set('level', String(row.level))
      fd.set('damage_base_bonus', String(field === 'damage_base_bonus' ? value : row.damage_base_bonus))
      fd.set('damage_special_bonus', String(field === 'damage_special_bonus' ? value : row.damage_special_bonus))
      fd.set('xp_to_next', String(field === 'xp_to_next' ? value : row.xp_to_next))
      await upsertSpiritBonus(fd)
      await reload()
    })
  }
}

function NumCell({ value, onSave }: { value: number; onSave: (v: string) => void }) {
  const [v, setV] = useState(String(value))
  useEffect(() => setV(String(value)), [value])
  return (
    <input value={v} onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== String(value) && onSave(v)}
      className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300" />
  )
}

// ══════════════════════════════════════════ TABELA XP GLOBAL

function XpTable() {
  const [rows, setRows] = useState<any[]>([])
  const [, start] = useTransition()
  const reload = () => start(async () => setRows(await listSpiritXpTable()))
  useEffect(() => { reload() }, [])

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500">
        XP total acumulado para alcançar cada nível (global, serve de referência).
        A progressão por arma fica na aba <b>Progressão</b>.
      </p>
      <form action={(fd: FormData) => start(async () => { await upsertSpiritXpRow(fd); await reload() })}
        className="border border-slate-700 rounded bg-slate-900/60 p-3 flex gap-2 items-end">
        <div className="w-24"><Field label="Nível"><input name="level" type="number" defaultValue={(rows[rows.length - 1]?.level ?? 0) + 1} required className={inputCls} /></Field></div>
        <div className="flex-1"><Field label="XP necessário"><input name="xp_required" type="number" defaultValue={String((rows[rows.length - 1]?.xp_required ?? 0) + 100)} required className={inputCls} /></Field></div>
        <button className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold">Adicionar</button>
      </form>

      <div className="border border-slate-800 rounded overflow-x-auto max-h-80">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-400 sticky top-0">
            <tr className="text-left"><Th>Nível</Th><Th>XP acumulado</Th><Th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.level} className="border-t border-slate-800">
                <Td className="font-bold text-amber-300">{r.level}</Td>
                <Td>{Number(r.xp_required).toLocaleString('pt-BR')}</Td>
                <Td><button onClick={() => start(async () => { await deleteSpiritXpRow(r.level); await reload() })}
                  className="p-1 rounded border border-slate-700 text-red-400"><Trash2 size={10} /></button></Td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-slate-500">Tabela vazia.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── helpers

const inputCls =
  'w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-600 text-xs text-slate-200 outline-none focus:border-amber-500'

function Field({ label, children }: any) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] text-slate-400">{label}</label>
      {children}
    </div>
  )
}
function Th({ children }: any) {
  return <th className="px-2 py-1.5 font-bold uppercase text-[10px] tracking-wide">{children}</th>
}
function Td({ children, className = '' }: any) {
  return <td className={`px-2 py-1.5 ${className}`}>{children}</td>
}
