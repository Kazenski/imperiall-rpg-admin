'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  listFloatingMenus,
  createFloatingMenu,
  updateFloatingMenu,
  toggleFloatingMenu,
} from '@/lib/actions/floating_menus'
import { Tooltip } from '@/components/ui/tooltip'
import { Plus, Pencil, Power, PowerOff } from 'lucide-react'

const ICONS: Record<string, string> = {
  missions: 'Missões (pergaminho)',
  calendar: 'Calendário (dailies)',
  gift: 'Presente (eventos)',
  star: 'Estrela',
  bolt: 'Raio',
}

// Sem delete: eventos saem da visão (is_active/janela), nunca são excluídos.
const emptyForm = {
  key: '',
  title: '',
  icon: 'missions',
  sort_order: 0,
  is_active: true,
  visible_from: '',
  visible_until: '',
}

function toInput(v: string | null) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function FloatingMenusPage() {
  const [menus, setMenus] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isPending, startTransition] = useTransition()
  const [missing, setMissing] = useState(false)

  const load = () =>
    listFloatingMenus()
      .then((rows) => {
        setMenus(rows)
        setMissing(false)
      })
      .catch(() => {
        setMenus([])
        setMissing(true)
      })
  useEffect(() => {
    load()
  }, [])

  const handleEdit = (menu: any) => {
    setEditing(menu)
    setForm({
      key: menu.key,
      title: menu.title,
      icon: menu.icon || 'missions',
      sort_order: menu.sort_order || 0,
      is_active: menu.is_active,
      visible_from: toInput(menu.visible_from),
      visible_until: toInput(menu.visible_until),
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData(e.target as HTMLFormElement)
      if (editing) await updateFloatingMenu(editing.id, fd)
      else await createFloatingMenu(fd)
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm)
      load()
    })
  }

  const handleToggle = (menu: any) => {
    startTransition(() =>
      toggleFloatingMenu(menu.id, !menu.is_active).then(load),
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Menus Flutuantes</h2>
          <p className="text-sm text-muted-foreground">
            Botões sobre a tela de Fases (Missões, dailies, eventos). Saem da
            visão pelo ativo/janela — nunca são excluídos.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setForm(emptyForm)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2"
        >
          <Plus size={16} /> Novo Botão
        </button>
      </div>

      {missing && (
        <div className="border rounded p-3 mb-4 text-sm text-amber-600 border-amber-300 bg-amber-50">
          Tabela <code>floating_menus</code> não encontrada neste banco. Rode{' '}
          <code>docs/migration-011-floating-menus.sql</code> e recarregue.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border rounded p-4 mb-4 space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            {!editing && (
              <div>
                <label className="text-sm">
                  Chave{' '}
                  <Tooltip text="Identificador estável. 'missions' abre o modal de missões; outras chaves abrem o modal genérico até ganharem tela própria. Não muda depois de criado." />
                </label>
                <input
                  name="key"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                  placeholder="ex.: evento_natal"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm">Título</label>
              <input
                name="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded px-2 py-1"
                placeholder="ex.: Evento de Natal"
                required
              />
            </div>
            <div>
              <label className="text-sm">Ícone</label>
              <select
                name="icon"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full border rounded px-2 py-1"
              >
                {Object.entries(ICONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm">
                Ordem{' '}
                <Tooltip text="Menor primeiro, de cima para baixo na lateral." />
              </label>
              <input
                name="sort_order"
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="text-sm">
                Visível de{' '}
                <Tooltip text="Vazio = desde sempre. Eventos temporários ganham início e fim." />
              </label>
              <input
                name="visible_from"
                type="datetime-local"
                value={form.visible_from}
                onChange={(e) =>
                  setForm({ ...form, visible_from: e.target.value })
                }
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="text-sm">Visível até</label>
              <input
                name="visible_until"
                type="datetime-local"
                value={form.visible_until}
                onChange={(e) =>
                  setForm({ ...form, visible_until: e.target.value })
                }
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />{' '}
            Ativo (visível no jogo)
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditing(null)
              }}
              className="px-4 py-2 border rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Título</th>
              <th className="p-2 text-left">Chave</th>
              <th className="p-2 text-left">Janela</th>
              <th className="p-2 text-left">Visível</th>
              <th className="p-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((menu) => (
              <tr key={menu.id} className="border-t">
                <td className="p-2 font-medium">{menu.title}</td>
                <td className="p-2">
                  <code>{menu.key}</code>
                </td>
                <td className="p-2 text-muted-foreground text-xs">
                  {menu.visible_from || menu.visible_until
                    ? `${menu.visible_from ? new Date(menu.visible_from).toLocaleString() : '…'} → ${menu.visible_until ? new Date(menu.visible_until).toLocaleString() : '…'}`
                    : 'sempre'}
                </td>
                <td className="p-2">
                  <span
                    className={
                      menu.is_active ? 'text-green-700' : 'text-muted-foreground'
                    }
                  >
                    {menu.is_active ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleToggle(menu)}
                    className="underline inline-flex items-center gap-1"
                    title={menu.is_active ? 'Ocultar no jogo' : 'Mostrar no jogo'}
                  >
                    {menu.is_active ? (
                      <PowerOff size={12} />
                    ) : (
                      <Power size={12} />
                    )}
                    {menu.is_active ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    onClick={() => handleEdit(menu)}
                    className="text-blue-600 underline inline-flex items-center gap-1"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
