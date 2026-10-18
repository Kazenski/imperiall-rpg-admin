'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Tooltip } from '@/components/ui/tooltip'
import { Upload, Loader2, X, Image as ImageIcon, Scissors } from 'lucide-react'

interface ImageUploadProps {
  label: string
  fieldName: string
  tooltipText: string
  folder: string
  value: string
  onChange: (url: string) => void
  hint: string
  accept?: string
  /** Quando true, recorta a imagem em círculo e salva PNG transparente. */
  circular?: boolean
  /** Maior lado permitido (redimensiona mantendo proporção). Padrão 1024. */
  maxSize?: number
  /** Quando definido, força saída quadrada deste tamanho (corte central). */
  forceSize?: number
}

const ACCEPT_ALL = 'image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp';

/** Formatos que o bucket aceita direto (sem conversão). */
const KEEPABLE = ['image/png', 'image/jpeg', 'image/webp'];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem. Tente converter para PNG antes.')) };
    img.src = url;
  });
}

interface Processed {
  blob: Blob;
  ext: string;
  type: string;
  width: number;
  height: number;
}

/**
 * Normaliza a imagem: limita resolução, força quadrado opcional,
 * recorta círculo opcional e converte formatos exóticos (AVIF/BMP) para PNG.
 * GIF animado é preservado intacto (sem corte nem redimensão).
 */
async function processImage(
  file: File,
  opts: { circular: boolean; maxSize: number; forceSize?: number },
): Promise<Processed | null> {
  const { circular, maxSize, forceSize } = opts;

  // GIF animado: não toca (conversão mataria a animação).
  if (file.type === 'image/gif' && !circular && !forceSize) return null;

  const img = await loadImage(file);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  let dw = srcW;
  let dh = srcH;
  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;

  if (forceSize) {
    // Corte central quadrado + tamanho exato (ícones uniformes).
    const side = Math.min(srcW, srcH);
    sx = (srcW - side) / 2;
    sy = (srcH - side) / 2;
    sw = side;
    sh = side;
    dw = forceSize;
    dh = forceSize;
  } else {
    const scale = Math.min(1, maxSize / Math.max(srcW, srcH));
    dw = Math.max(1, Math.round(srcW * scale));
    dh = Math.max(1, Math.round(srcH * scale));
  }

  const usePng = circular || !!forceSize || !KEEPABLE.includes(file.type);
  // Sem alteração necessária: envia o original.
  if (!usePng && dw === srcW && dh === srcH && file.type !== 'image/gif') return null;

  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível neste navegador.');

  if (circular) {
    ctx.beginPath();
    ctx.arc(dw / 2, dh / 2, dw / 2, 0, Math.PI * 2);
    ctx.clip();
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

  const type = usePng ? 'image/png' : file.type;
  const blob = await new Promise<Blob | null>((res) =>
    ctx.canvas.toBlob(res, type, 0.88),
  );
  if (!blob) throw new Error('Falha ao gerar a imagem.');
  return { blob, ext: usePng ? 'png' : type === 'image/jpeg' ? 'jpg' : 'webp', type, width: dw, height: dh };
}

export function ImageUpload({ label, fieldName, tooltipText, folder, value, onChange, hint, accept = ACCEPT_ALL, circular = false, maxSize = 1024, forceSize }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<string | null>(null)
  const [showGallery, setShowGallery] = useState(false)
  const [gallery, setGallery] = useState<string[]>([])
  const [loadingGallery, setLoadingGallery] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function loadGallery() {
    setLoadingGallery(true)
    try {
      const { data, error } = await supabase.storage.from('assets').list('pixel', { limit: 200 })
      if (error) throw error
      const urls = (data || [])
        .filter((f) => f.name && !f.name.endsWith('/'))
        .map((f) => supabase.storage.from('assets').getPublicUrl(`pixel/${f.name}`).data.publicUrl)
      setGallery(urls)
    } catch {
      setGallery([])
    } finally {
      setLoadingGallery(false)
    }
  }

  async function uploadFile(file: File) {
    setError(null)
    setFileInfo(null)
    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem (PNG, JPG, WEBP, GIF ou AVIF).')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo 8MB.')
      return
    }

    setUploading(true)
    try {
      let payload: Blob = file
      let contentType = file.type
      let ext = file.name.split('.').pop()?.toLowerCase() || 'png'

      const done = await processImage(file, { circular, maxSize, forceSize });
      if (done) {
        payload = done.blob
        contentType = done.type
        ext = done.ext
        const kb = Math.max(1, Math.round(done.blob.size / 1024))
        setFileInfo(`${done.width}×${done.height} • ${kb} KB${circular ? ' • círculo transparente' : ''}`)
      } else {
        setFileInfo('original preservado')
      }

      // Preview local do arquivo final.
      const localUrl = URL.createObjectURL(payload)
      setPreview(localUrl)

      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50) || 'img'
      const path = `${folder}/${Date.now()}-${baseName}.${ext}`

      const { error: upErr } = await supabase.storage.from('assets').upload(path, payload, {
        contentType,
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
            <img
              src={displayUrl}
              alt={label}
              className={circular
                ? 'w-16 h-16 object-cover rounded-full border bg-muted'
                : 'w-16 h-16 object-contain rounded border bg-muted'}
            />
            <div className="text-left flex-1">
              <p className="text-xs text-green-600 break-all">
                {value ? 'Enviada! URL pronta.' : 'Pré-visualização local...'}
              </p>
              {fileInfo && <p className="text-xs text-muted-foreground">{fileInfo}</p>}
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
                    setFileInfo(null)
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
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  {circular ? <Scissors size={12} /> : <ImageIcon size={12} />} {hint}
                </p>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      <div className="mt-2">
        <button
          type="button"
          className="text-xs underline text-indigo-300"
          onClick={() => { setShowGallery((v) => !v); if (!showGallery) loadGallery() }}
        >
          {showGallery ? 'Ocultar galeria Pixel Art' : 'Usar imagem da galeria Pixel Art'}
        </button>
        {showGallery && (
          <div className="mt-2 grid grid-cols-6 gap-2 max-h-48 overflow-y-auto border border-zinc-700 rounded p-2">
            {loadingGallery && <p className="text-xs text-zinc-500 col-span-6">Carregando...</p>}
            {!loadingGallery && gallery.length === 0 && <p className="text-xs text-zinc-500 col-span-6">Nenhuma arte pixel encontrada.</p>}
            {gallery.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => { onChange(url); setPreview(null) }}
                className="border border-zinc-700 rounded overflow-hidden hover:ring-2 hover:ring-amber-400"
                title={url}
              >
                <img src={url} alt="pixel" className="w-full h-12 object-contain bg-zinc-800" />
              </button>
            ))}
          </div>
        )}
      </div>
      {/* input hidden com a URL final para o FormData do server action */}
      <input type="hidden" name={fieldName} value={value} readOnly className="hidden" />
    </div>
  )
}
