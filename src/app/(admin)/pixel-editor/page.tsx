'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { listItems, updateItem } from '@/lib/actions/items'
import { ImageUpload } from '@/components/ui/image-upload'

export default function PixelEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pixelSize, setPixelSize] = useState(8)
  const [color, setColor] = useState('#ff0000')
  const [items, setItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState('')
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    listItems().then(setItems).catch(() => setItems([]))
  }, [])

  function loadImageToCanvas(file: File) {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = img.width
      canvas.height = img.height
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  function pixelate() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    const smallW = Math.max(1, Math.floor(w / pixelSize))
    const smallH = Math.max(1, Math.floor(h / pixelSize))
    const small = document.createElement('canvas')
    small.width = smallW
    small.height = smallH
    const sctx = small.getContext('2d')!
    sctx.imageSmoothingEnabled = false
    sctx.drawImage(canvas, 0, 0, smallW, smallH)
    ctx.clearRect(0, 0, w, h)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(small, 0, 0, smallW, smallH, 0, 0, w, h)
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)
    // snap to pixel grid
    const gx = Math.floor(x / pixelSize) * pixelSize
    const gy = Math.floor(y / pixelSize) * pixelSize
    ctx.fillStyle = color
    ctx.fillRect(gx, gy, pixelSize, pixelSize)
  }

  async function uploadCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    setStatus('Enviando...')
    canvas.toBlob(async (blob) => {
      if (!blob) { setStatus('Falha ao gerar imagem'); return }
      const path = `pixel/${Date.now()}.png`
      const { error } = await supabase.storage.from('assets').upload(path, blob, { contentType: 'image/png', upsert: false })
      if (error) { setStatus('Erro: ' + error.message); return }
      const { data } = supabase.storage.from('assets').getPublicUrl(path)
      setUploadedUrl(data.publicUrl)
      setStatus('Upload concluído!')
    }, 'image/png')
  }

  async function applyToItem() {
    if (!selectedItem || !uploadedUrl) { setStatus('Selecione um item e faça upload primeiro.'); return }
    const fd = new FormData()
    const it = items.find((i) => i.id === selectedItem)
    if (!it) return
    // reuse updateItem with minimal fields
    fd.set('name', it.name || '')
    fd.set('slug', it.slug || '')
    fd.set('icon_url', uploadedUrl)
    fd.set('is_active', it.is_active ? 'on' : '')
    try {
      await updateItem(selectedItem, fd)
      setStatus('Ícone aplicado ao item!')
    } catch (e) {
      setStatus('Erro ao aplicar: ' + String(e))
    }
  }

  function downloadPng() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'pixel-art.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-amber-400">Editor de Pixel Art</h2>
      <p className="text-sm text-zinc-400">Carregue uma imagem, pixelize, pinte pixels e exporte/envie para usar em itens.</p>

      <div className="flex flex-wrap gap-3 items-center">
        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImageToCanvas(f) }} />
        <label className="text-sm">Tamanho do pixel
          <input type="range" min={2} max={32} value={pixelSize} onChange={(e) => setPixelSize(Number(e.target.value))} className="ml-2" />
          <span className="ml-1 text-xs">{pixelSize}px</span>
        </label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button onClick={pixelate} className="px-3 py-1.5 border rounded bg-amber-500/20 text-amber-300 text-sm">Pixelar</button>
        <button onClick={downloadPng} className="px-3 py-1.5 border rounded text-sm">Baixar PNG</button>
        <button onClick={uploadCanvas} className="px-3 py-1.5 border rounded text-sm">Upload Storage</button>
      </div>

      {status && <p className="text-xs text-zinc-400">{status}</p>}
      {uploadedUrl && <p className="text-xs text-green-400 break-all">{uploadedUrl}</p>}

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="border border-zinc-700 max-w-full"
        style={{ imageRendering: 'pixelated' }}
      />

      <div className="border rounded-xl p-4 bg-zinc-900/60 space-y-3">
        <h3 className="text-sm font-semibold text-indigo-300">Aplicar a um item</h3>
        <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="w-full border rounded px-2.5 py-1.5 bg-background text-sm">
          <option value="">Selecione um item</option>
          {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
        </select>
        <button onClick={applyToItem} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">Aplicar ícone ao item</button>
      </div>
    </div>
  )
}