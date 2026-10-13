'use client'

import { X } from 'lucide-react'

interface DetailModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function DetailModal({ title, onClose, children }: DetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">{value ?? '—'}</span>
    </div>
  )
}

export function DetailImage({ label, url, size = 'w-24 h-24' }: { label: string; url?: string | null; size?: string }) {
  if (!url) return <DetailRow label={label} value={<span className="text-muted-foreground">Sem imagem</span>} />
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b last:border-0 text-sm items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2">
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={label} className={`${size} object-contain rounded border bg-muted hover:opacity-90`} />
        </a>
      </span>
    </div>
  )
}
