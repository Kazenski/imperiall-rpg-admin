'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Upload, Loader2, X, Film, Image as ImageIcon } from 'lucide-react'

interface MediaUploadProps {
  label: string
  fieldName: string
  tooltipText: string
  folder: string
  value: string
  onChange: (url: string) => void
  hint: string
  accept?: string
}

const ACCEPT_ALL = 'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime'

/** Descrição amigável dos erros comuns de Storage. */
function friendlyError(message: string) {
  const m = message.toLowerCase()
  if (m.includes('bucket not found')) {
    return 'Bucket "media" não existe neste projeto. Rode a migration 021 no Supabase (SQL Editor) do projeto correspondente (teste e/ou produção).'
  }
  if (m.includes('row-level security') || m.includes('new row violates')) {
    return 'Sem permissão para enviar. Verifique se você está logado como admin e se as policies do bucket "media" existem.'
  }
  if (m.includes('exceeded the maximum allowed size')) {
    return 'Arquivo acima do limite do bucket (50MB).'
  }
  return message
}

export function MediaUpload({ label, fieldName, tooltipText, folder, value, onChange, hint, accept = ACCEPT_ALL }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)$/i.test(url)

  async function uploadFile(file: File) {
    setError(null)
    const isImg = file.type.startsWith('image/')
    const isVid = file.type.startsWith('video/')
    if (!isImg && !isVid) {
      setError('Selecione uma imagem ou vídeo.')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 50MB.')
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || (isVid ? 'mp4' : 'png')
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50) || 'media'
      const path = `${folder}/${Date.now()}-${baseName}.${ext}`

      setPreview(URL.createObjectURL(file))

      const { error: upErr } = await supabase.storage.from('media').upload(path, file, {
        contentType: file.type || (isVid ? 'video/mp4' : 'image/png'),
        upsert: true,
      })
      if (upErr) throw upErr

      const { data } = supabase.storage.from('media').getPublicUrl(path)
      if (!data?.publicUrl) throw new Error('URL pública não gerada.')
      onChange(data.publicUrl)
    } catch (e: any) {
      setPreview(null)
      setError(friendlyError(e?.message || 'Falha no upload.'))
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = preview || value

  return (
    <div>
      <label className="text-sm font-medium">{label} <span className="text-xs text-muted-foreground">({tooltipText})</span></label>
      <p className="text-xs text-muted-foreground mb-1">{hint}</p>

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded p-3 cursor-pointer text-center transition-colors border-muted-foreground/30 hover:border-primary/60"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) uploadFile(f)
          }}
        />
        {displayUrl ? (
          <div className="flex items-center gap-3">
            {isVideo(displayUrl) ? (
              <video src={displayUrl} className="w-24 h-16 object-cover rounded border bg-black" muted />
            ) : (
              <img src={displayUrl} alt={label} className="w-16 h-16 object-contain rounded border bg-muted" />
            )}
            <div className="text-left flex-1">
              <p className="text-xs text-green-600">{value ? 'Enviada! URL pronta.' : 'Pré-visualização local...'}</p>
              {value && <p className="text-[11px] text-muted-foreground break-all">{value}</p>}
              <div className="flex gap-2 mt-1">
                <button type="button" className="text-xs underline" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>Trocar mídia</button>
                <button type="button" className="text-xs underline text-red-600 inline-flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setPreview(null); onChange(''); if (inputRef.current) inputRef.current.value = '' }}>
                  <X size={12} /> Remover
                </button>
              </div>
            </div>
            {uploading && <Loader2 size={18} className="animate-spin" />}
          </div>
        ) : (
          <div className="py-2">
            {uploading ? (
              <span className="inline-flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin" /> Enviando...</span>
            ) : (
              <>
                <Upload size={20} className="mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm">Arraste/clique para escolher imagem ou vídeo</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <ImageIcon size={12} /> <Film size={12} /> {hint}
                </p>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1 whitespace-pre-wrap">{error}</p>}
      <input type="hidden" name={fieldName} value={value} readOnly className="hidden" />
    </div>
  )
}