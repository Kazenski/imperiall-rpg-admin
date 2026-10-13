'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Tooltip } from '@/components/ui/tooltip'
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  label: string
  fieldName: string
  tooltipText: string
  folder: string
  value: string
  onChange: (url: string) => void
  hint: string
  accept?: string
}

export function ImageUpload({ label, fieldName, tooltipText, folder, value, onChange, hint, accept = 'image/png,image/jpeg,image/webp,image/gif' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setError(null)
    // Valida tipo
    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem (PNG, JPG, WEBP ou GIF).')
      return
    }
    // Valida tamanho 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 5MB.')
      return
    }
    // Preview local imediato
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 60)
      const path = `${folder}/${Date.now()}-${safeName || `img.${ext}`}`

      const { error: upErr } = await supabase.storage.from('assets').upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (upErr) throw upErr

      const { data } = supabase.storage.from('assets').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (e: any) {
      setError(e?.message || 'Falha no upload. Verifique as policies do bucket assets.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const displayUrl = preview || value

  return (
    <div>
      <label className="text-sm font-medium">{label} <Tooltip text={tooltipText} /></label>
      <p className="text-xs text-muted-foreground mb-1">{hint}</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded p-3 cursor-pointer text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/60'}`}
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
            <img src={displayUrl} alt={label} className="w-16 h-16 object-contain rounded border bg-muted" />
            <div className="text-left flex-1">
              <p className="text-xs text-green-600 break-all">{value ? 'Enviada! URL pronta.' : 'Pré-visualização local...'}</p>
              {value && <p className="text-[11px] text-muted-foreground break-all">{value}</p>}
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                >
                  Trocar imagem
                </button>
                <button
                  type="button"
                  className="text-xs underline text-red-600 inline-flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreview(null)
                    onChange('')
                    if (inputRef.current) inputRef.current.value = ''
                  }}
                >
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
                <p className="text-sm">Arraste a imagem ou <span className="underline text-primary">clique para escolher</span></p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><ImageIcon size={12} /> {hint}</p>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {/* input hidden com a URL final para o FormData do server action */}
      <input type="hidden" name={fieldName} value={value} readOnly className="hidden" />
    </div>
  )
}
