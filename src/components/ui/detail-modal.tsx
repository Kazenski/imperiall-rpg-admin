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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 border-2 border-amber-500/40 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
          <h3 className="text-lg font-bold text-amber-400">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
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
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-800/80 last:border-0 text-sm">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="col-span-2 break-words text-slate-100">{value ?? '—'}</span>
    </div>
  )
}

export function DetailImage({ label, url, size = 'w-24 h-24' }: { label: string; url?: string | null; size?: string }) {
  if (!url) return <DetailRow label={label} value={<span className="text-slate-500">Sem imagem</span>} />
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-800/80 last:border-0 text-sm items-center">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="col-span-2">
        <a href={url} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className={`${size} object-contain rounded-lg border border-slate-700 bg-slate-900 hover:opacity-90 p-1`} />
        </a>
      </span>
    </div>
  )
}
