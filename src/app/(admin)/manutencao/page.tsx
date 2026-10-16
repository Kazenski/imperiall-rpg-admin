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
import { MediaUpload } from '@/components/ui/media-upload'

export default function ManutencaoPage() {
  const [windows, setWindows] = useState<any[]>([])
  const [splash, setSplash] = useState<any>(null)
  const [splashUrl, setSplashUrl] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [maintenanceMediaUrl, setMaintenanceMediaUrl] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [w, s] = await Promise.all([listMaintenanceWindows(), getSplashConfig()])
      setWindows(w || [])
      setSplash(s)
      setSplashUrl(s?.capa_inicializacao_url || '')
      setPosterUrl(s?.capa_inicializacao_poster_url || '')
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
        <h3 className="font-semibold text-amber-300">Mídia da tela de login (capa de inicialização)</h3>
        <p className="text-xs text-zinc-400">
          O tipo (imagem ou vídeo) é detectado automaticamente pelo arquivo enviado.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <MediaUpload
            label="Capa de inicialização"
            fieldName="capa_inicializacao_url"
            typeFieldName="capa_inicializacao_tipo"
            tooltipText="Imagem ou vídeo que aparece na tela de login do app."
            folder="splash"
            value={splashUrl}
            onChange={setSplashUrl}
            hint="Imagem ou vídeo (MP4/WebM). Máximo 50MB."
          />
          <MediaUpload
            label="Capa após vídeo (imagem estática)"
            fieldName="capa_inicializacao_poster_url"
            tooltipText="Opcional: exibida após o vídeo da capa terminar."
            folder="splash"
            value={posterUrl}
            onChange={setPosterUrl}
            hint="Imagem (PNG/JPG/WEBP). Máximo 50MB."
            accept="image/png,image/jpeg,image/webp,image/gif"
          />
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
          <MediaUpload
            label="Mídia de manutenção"
            fieldName="media_url"
            typeFieldName="media_type"
            tooltipText="Imagem ou vídeo exibido na tela de manutenção."
            folder="maintenance"
            value={maintenanceMediaUrl}
            onChange={setMaintenanceMediaUrl}
            hint="Imagem ou vídeo (MP4/WebM). Máximo 50MB."
          />
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