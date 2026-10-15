'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  listCharacters, createCharacter, updateCharacter, deleteCharacter,
  listCharacterSkills, addCharacterSkill, deleteCharacterSkill,
  listCharacterTraits, addCharacterTrait, deleteCharacterTrait,
} from '@/lib/actions/characters'
import { listSkills } from '@/lib/actions/skills'
import { listEffects } from '@/lib/actions/effects'
import { Tooltip } from '@/components/ui/tooltip'
import { ImageUpload } from '@/components/ui/image-upload'
import { Plus, Pencil, Trash2, Eye, Swords, Copy, Heart, Droplet, Shield, Gauge, Star } from 'lucide-react'
import { DetailModal, DetailRow, DetailImage } from '@/components/ui/detail-modal'
import { useTable, SearchBox, Th, Counters } from '@/components/ui/data-table'
import Link from 'next/link'

const emptyForm = {
  slug: '',
  name: '',
  description: '',
  portrait_url: '',
  sprite_idle_url: '',
  sprite_attack_url: '',
  hp: 100,
  mp: 50,
  atk: 10,
  def: 5,
  speed: 100,
  is_active: true,
  sort_order: 0,
}

export default function PersonagensPage() {
  const [chars, setChars] = useState<any[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [effects, setEffects] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [viewing, setViewing] = useState<any>(null)
  const [charSkills, setCharSkills] = useState<any[]>([])
  const [traits, setTraits] = useState<any[]>([])
  const [skillPick, setSkillPick] = useState({ skill_id: '', unlock_level: 1 })
  const [traitPick, setTraitPick] = useState({ effect_id: '', value: 0, environment: '' })
  const [isPending, startTransition] = useTransition()

  const load = () => {
    listCharacters().then(setChars).catch(() => setChars([]))
    listSkills().then(setSkills).catch(() => {})
    listEffects().then(setEffects).catch(() => {})
  }
  const table = useTable(chars, {
    search: (c) => `${c.name} ${c.slug}`,
    sort: {
      name: (c) => c.name,
      hp: (c) => c.hp,
      mp: (c) => c.mp ?? 50,
      atk: (c) => c.atk,
    },
  })
  const activeCount = chars.filter((c) => c.is_active).length
  useEffect(() => {
    load()
  }, [])

  const openDetail = (c: any) => {
    setViewing(c)
    listCharacterSkills(c.id).then(setCharSkills).catch(() => setCharSkills([]))
    listCharacterTraits(c.id).then(setTraits).catch(() => setTraits([]))
  }

  const handleEdit = (c: any) => {
    setEditing(c)
    setForm({
      slug: c.slug,
      name: c.name,
      description: c.description || '',
      portrait_url: c.portrait_url || '',
      sprite_idle_url: c.sprite_idle_url || '',
      sprite_attack_url: c.sprite_attack_url || '',
      hp: c.hp ?? 100,
      mp: c.mp ?? 50,
      atk: c.atk ?? 10,
      def: c.def ?? 5,
      speed: c.speed ?? 100,
      is_active: c.is_active,
      sort_order: c.sort_order ?? 0,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateCharacter(editing.id, fd)
      else await createCharacter(fd)
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
      load()
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir este personagem? Vínculos de skills/traits/árvore/constelação serão removidos.'))
      startTransition(() => deleteCharacter(id).then(load))
  }

  const handleClone = (c: any) => {
    handleEdit(c)
    setEditing(null)
    setForm((f) => ({ ...f, slug: `${c.slug}-copia`, name: `${c.name} (cópia)` }))
  }

  const run = (fn: () => Promise<any>) =>
    startTransition(() =>
      fn()
        .then(() => {
          load()
          if (viewing) openDetail({ ...viewing })
        })
        .catch((e) => alert('Falha: ' + (e?.message || e))),
    )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-amber-400">
            <Swords size={22} /> Heróis Jogáveis (Personagens)
          </h2>
          <p className="text-sm text-muted-foreground">
            Retrato, sprites, atributos base (HP, MP, ATK, DEF, Velocidade), skills e vantagens por ambiente
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/constelacoes"
            className="px-3.5 py-2 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-fuchsia-500/25"
          >
            <Star size={15} /> Configurar Constelações
          </Link>
          <button
            onClick={() => {
              setEditing(null)
              setForm(emptyForm)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg inline-flex items-center gap-2 font-medium"
          >
            <Plus size={16} /> Novo Herói
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border-2 border-amber-500/40 bg-amber-950/10 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-base font-semibold text-amber-300">
            {editing ? `Editando Herói: ${editing.name}` : 'Novo Herói'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm">
                Slug <Tooltip text="Identificador único. Ex.: guerreiro_kael" />
              </label>
              <input
                name="slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full border rounded px-2.5 py-1.5"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm">Nome do Herói</label>
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded px-2.5 py-1.5"
                required
              />
            </div>
            <div>
              <label className="text-sm">Ordem</label>
              <input
                name="sort_order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full border rounded px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="text-sm text-emerald-300 font-semibold flex items-center gap-1">
                <Heart size={13} /> HP Base (Vida){' '}
                <Tooltip text="Vida inicial no nível 1 (+20 por nível do herói)" />
              </label>
              <input
                name="hp"
                type="number"
                value={form.hp}
                onChange={(e) => setForm({ ...form, hp: Number(e.target.value) })}
                className="w-full border border-emerald-500/40 rounded px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-sm text-sky-300 font-semibold flex items-center gap-1">
                <Droplet size={13} /> MP Base (Pontos de Magia){' '}
                <Tooltip text="Pontos de Magia iniciais no nível 1 (+10 por nível do herói)" />
              </label>
              <input
                name="mp"
                type="number"
                value={form.mp}
                onChange={(e) => setForm({ ...form, mp: Number(e.target.value) })}
                className="w-full border border-sky-500/40 rounded px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-sm text-rose-300 font-semibold flex items-center gap-1">
                <Swords size={13} /> ATK Base
              </label>
              <input
                name="atk"
                type="number"
                value={form.atk}
                onChange={(e) => setForm({ ...form, atk: Number(e.target.value) })}
                className="w-full border border-rose-500/40 rounded px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-sm text-amber-300 font-semibold flex items-center gap-1">
                <Shield size={13} /> DEF Base
              </label>
              <input
                name="def"
                type="number"
                value={form.def}
                onChange={(e) => setForm({ ...form, def: Number(e.target.value) })}
                className="w-full border border-amber-500/40 rounded px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="text-sm text-cyan-300 font-semibold flex items-center gap-1">
                <Gauge size={13} /> Velocidade{' '}
                <Tooltip text="100 = normal. Maior = age mais rápido" />
              </label>
              <input
                name="speed"
                type="number"
                value={form.speed}
                onChange={(e) => setForm({ ...form, speed: Number(e.target.value) })}
                className="w-full border border-cyan-500/40 rounded px-2.5 py-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ImageUpload
              label="Retrato"
              fieldName="portrait_url"
              tooltipText="Rosto 512x512 para seleção, perfil e histórias."
              folder="characters"
              value={form.portrait_url}
              onChange={(url) => setForm({ ...form, portrait_url: url })}
              hint="PNG retrato (saída 512×512)"
              forceSize={512}
            />
            <ImageUpload
              label="Sprite parado"
              fieldName="sprite_idle_url"
              tooltipText="Sprite idle PNG transparente."
              folder="characters"
              value={form.sprite_idle_url}
              onChange={(url) => setForm({ ...form, sprite_idle_url: url })}
              hint="PNG transparente (limite 512px)"
              maxSize={512}
            />
            <ImageUpload
              label="Sprite ataque"
              fieldName="sprite_attack_url"
              tooltipText="Sprite de ataque PNG transparente."
              folder="characters"
              value={form.sprite_attack_url}
              onChange={(url) => setForm({ ...form, sprite_attack_url: url })}
              hint="PNG transparente (limite 512px)"
              maxSize={512}
            />
          </div>

          <div>
            <label className="text-sm">Descrição / história do personagem</label>
            <textarea
              name="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded px-2.5 py-1.5"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />{' '}
            Ativo (aparece na seleção)
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditing(null)
              }}
              className="px-4 py-2 border rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={table.q} onChange={table.setQ} placeholder="Pesquisar herói..." />
        <Counters total={chars.length} active={activeCount} shown={table.visible.length} totalLabel="heróis" />
      </div>

      <div className="border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2.5 text-left">#</th>
              <th className="p-2.5 text-left">Retrato</th>
              <Th label="Nome" k="name" active={table.sortKey === 'name'} dir={table.sortDir} onClick={table.toggle} />
              <th className="p-2.5 text-left">Atributos Base (HP / MP / ATK / DEF / VEL)</th>
              <th className="p-2.5 text-left">Ativo</th>
              <th className="p-2.5 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {table.visible.map((c, i) => (
              <tr key={c.id} className="border-t">
                <td className="p-2.5 text-muted-foreground">{i + 1}</td>
                <td className="p-2.5">
                  {c.portrait_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.portrait_url}
                      alt={c.name}
                      className="w-11 h-11 object-cover rounded-full border-2 border-amber-500/50"
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="p-2.5 font-medium">
                  <button
                    onClick={() => openDetail(c)}
                    className="underline underline-offset-2 hover:text-amber-300 font-semibold"
                  >
                    {c.name}
                  </button>
                  <div className="text-xs text-muted-foreground">
                    <code>{c.slug}</code>
                  </div>
                </td>
                <td className="p-2.5">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                      HP {c.hp}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold">
                      MP {c.mp ?? 50}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold">
                      ATK {c.atk}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                      DEF {c.def}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
                      VEL {c.speed}
                    </span>
                  </div>
                </td>
                <td className="p-2.5">{c.is_active ? 'Sim' : 'Não'}</td>
                <td className="p-2.5 flex gap-2">
                  <button
                    onClick={() => openDetail(c)}
                    className="text-emerald-400 underline inline-flex items-center gap-1"
                  >
                    <Eye size={12} /> Ver
                  </button>
                  <button
                    onClick={() => handleEdit(c)}
                    className="text-blue-400 underline inline-flex items-center gap-1"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleClone(c)}
                    className="text-amber-300 underline inline-flex items-center gap-1"
                    title="Abre edição com cópia para salvar com outro slug"
                  >
                    <Copy size={12} /> Clonar
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-400 underline inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {chars.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Nenhum personagem ainda.</p>
        )}
      </div>

      {viewing && (
        <DetailModal title={viewing.name} onClose={() => setViewing(null)}>
          <DetailImage label="Retrato" url={viewing.portrait_url} />
          <DetailRow
            label="Stats base"
            value={`HP ${viewing.hp} • MP ${viewing.mp ?? 50} • ATK ${viewing.atk} • DEF ${viewing.def} • Vel ${viewing.speed}`}
          />
          <DetailRow label="Descrição" value={viewing.description || '—'} />

          <h4 className="font-semibold mt-4 mb-1 text-amber-300">Skills do personagem</h4>
          {charSkills.map((s: any) => (
            <div key={s.id} className="flex justify-between text-sm py-1 border-b border-slate-800 last:border-0">
              <span>
                {s.skills?.name} <span className="text-muted-foreground">(nv {s.unlock_level})</span>
              </span>
              <button onClick={() => run(() => deleteCharacterSkill(s.id))} className="text-red-400 underline text-xs">
                Remover
              </button>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              run(async () => {
                const fd = new FormData()
                fd.set('character_id', viewing.id)
                fd.set('skill_id', skillPick.skill_id)
                fd.set('unlock_level', String(skillPick.unlock_level))
                await addCharacterSkill(fd)
              })
            }}
            className="flex gap-2 mt-2"
          >
            <select
              value={skillPick.skill_id}
              onChange={(e) => setSkillPick({ ...skillPick, skill_id: e.target.value })}
              className="flex-1 border rounded px-2 py-1 text-sm"
              required
            >
              <option value="">Skill…</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={skillPick.unlock_level}
              onChange={(e) => setSkillPick({ ...skillPick, unlock_level: Number(e.target.value) })}
              className="w-20 border rounded px-2 py-1 text-sm"
              title="Nível de desbloqueio"
            />
            <button type="submit" className="px-3 py-1 border rounded text-sm">
              Adicionar
            </button>
          </form>

          <h4 className="font-semibold mt-4 mb-1 text-amber-300">
            Vantagens por ambiente{' '}
            <Tooltip text="Bônus que só vale no ambiente indicado. Ex.: efeito Ataque +10 no ambiente 'floresta'. Vazio = sempre ativo." />
          </h4>
          {traits.map((t: any) => (
            <div key={t.id} className="flex justify-between text-sm py-1 border-b border-slate-800 last:border-0">
              <span>
                {t.effects?.name}: {String(t.value)}
                {t.environment ? ` em “${t.environment}”` : ' (sempre)'}
              </span>
              <button onClick={() => run(() => deleteCharacterTrait(t.id))} className="text-red-400 underline text-xs">
                Remover
              </button>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              run(async () => {
                const fd = new FormData()
                fd.set('character_id', viewing.id)
                fd.set('effect_id', traitPick.effect_id)
                fd.set('value', String(traitPick.value))
                fd.set('environment', traitPick.environment)
                await addCharacterTrait(fd)
              })
            }}
            className="flex gap-2 mt-2"
          >
            <select
              value={traitPick.effect_id}
              onChange={(e) => setTraitPick({ ...traitPick, effect_id: e.target.value })}
              className="flex-1 border rounded px-2 py-1 text-sm"
              required
            >
              <option value="">Efeito…</option>
              {effects.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              value={traitPick.value}
              onChange={(e) => setTraitPick({ ...traitPick, value: Number(e.target.value) })}
              className="w-20 border rounded px-2 py-1 text-sm"
              title="Valor personalizado"
            />
            <input
              value={traitPick.environment}
              onChange={(e) => setTraitPick({ ...traitPick, environment: e.target.value })}
              placeholder="ambiente (ex.: floresta)"
              className="w-32 border rounded px-2 py-1 text-sm"
            />
            <button type="submit" className="px-3 py-1 border rounded text-sm">
              Adicionar
            </button>
          </form>
        </DetailModal>
      )}
    </div>
  )
}
