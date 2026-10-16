'use client'

import { useEffect, useState } from 'react'
import {
  listMaintenanceWindows,
  createMaintenanceWindow,
  toggleMaintenanceActive,
  deleteMaintenanceWindow,
  getSplashConfig,
  updateSplashConfig,
} from '@/lib/actions/maintenance'
import { ImageUpload } from '@/components/ui/image-upload'

export default function ManutencaoPage() {
  const [windows, setWindows] = useState<any[]>([])
  const [splash, setSplash] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [w, s] = await Promise.all([listMaintenanceWindows(), getSplashConfig()])
      setWindows(w || [])
      setSplash(s)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-amber-400">Manutenção & Tela de Login</h2>

      {/* Splash / tela de login */}
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target as HTMLFormElement)
          await updateSplashConfig(fd)
          await load()
        }}
        className="border-2 border-amber-500/30 rounded-xl p-5 space-y-3 bg-amber-950/10"
      >
        <h3 className="font-semibold text-amber-300">Mídia da tela de login (splash)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Tipo de mídia</label>
            <select name="media_type" defaultValue={splash?.splash_media_type || 'image'} className="w-full border rounded px-2.5 py-1.5 bg-background">
              <option value="image">Imagem</option>
              <option value="video">Vídeo</option>
            </select>
          </div>
          <div>
            <label className="text-sm">URL da mídia</label>
            <input
              name="splash_media_url"
              defaultValue={splash?.splash_media_url || ''}
              className="w-full border rounded px-2.5 py-1.5 bg-background"
              placeholder="https://..."
            />
          </div>
        </div>
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Salvar mídia de login</button>
      </form>

      {/* Nova manutenção */}
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const fd = new FormData(e.target as HTMLFormElement)
          await createMaintenanceWindow(fd)
          ;(e.target as HTMLFormElement).reset()
          await load()
        }}
        className="border-2 border-red-500/30 rounded-xl p-5 space-y-3 bg-red-950/10"
      >
        <h3 className="font-semibold text-red-300">Nova janela de manutenção</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Título</label>
            <input name="title" className="w-full border rounded px-2.5 py-1.5 bg-background" placeholder="Ex.: Atualização servidor" />
          </div>
          <div>
            <label className="text-sm">Duração (minutos)</label>
            <input name="duration_minutes" type="number" defaultValue={30} className="w-full border rounded px-2.5 py-1.5 bg-background" />
          </div>
        </div>
        <div>
          <label className="text-sm">Mensagem ao jogador</label>
          <textarea name="message" required className="w-full border rounded px-2.5 py-1.5 bg-background" rows={3} placeholder="O jogo está em manutenção..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Tipo de mídia</label>
            <select name="media_type" defaultValue="image" className="w-full border rounded px-2.5 py-1.5 bg-background">
              <option value="image">Imagem</option>
              <option value="video">Vídeo</option>
            </select>
          </div>
          <div>
            <label className="text-sm">URL da mídia de manutenção</label>
            <input name="media_url" className="w-full border rounded px-2.5 py-1.5 bg-background" placeholder="https://..." />
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked /> Ativar imediatamente
        </label>
        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg">Criar manutenção</button>
      </form>

      {/* Lista */}
      <div className="space-y-2">
        <h3 className="font-semibold text-zinc-300">Janelas cadastradas</h3>
        {loading && <p className="text-sm text-zinc-400">Carregando…</p>}
        {windows.map((w) => (
          <div key={w.id} className="border rounded-lg p-3 flex flex-wrap justify-between gap-3 bg-zinc-900/60">
            <div className="min-w-0">
              <div className="font-semibold text-zinc-100">{w.title || '(sem título)'} {w.is_active ? <span className="text-xs text-red-300">• ATIVA</span> : null}</div>
              <div className="text-xs text-zinc-400">{new Date(w.starts_at).toLocaleString()} → {w.ends_at ? new Date(w.ends_at).toLocaleString() : '?'}</div>
              <p className="text-xs text-zinc-300 mt-1 truncate max-w-[70ch]">{w.message}</p>
            </div>
            <div className="flex gap-2 items-start">
              <button
                onClick={async () => {
                  await toggleMaintenanceActive(w.id, !w.is_active)
                  await load()
                }}
                className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs"
              >
                {w.is_active ? 'Desativar' : 'Ativar'}
              </button>
              <button
                onClick={async () => {
                  if (confirm('Excluir janela?')) {
                    await deleteMaintenanceWindow(w.id)
                    await load()
                  }
                }}
                className="px-2.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-xs"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        {windows.length === 0 && <p className="text-xs text-zinc-500">Nenhuma janela cadastrada.</p>}
      </div>
    </div>
  )
}