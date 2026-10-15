import AdminNav from '@/components/layout/admin-nav'
import Link from 'next/link'
import { Crown } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-amber-500/25 bg-slate-950/90 backdrop-blur px-5 py-3 space-y-2.5 sticky top-0 z-30 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="font-bold text-base text-amber-400 flex items-center gap-2 hover:text-amber-300">
            <Crown size={18} className="text-amber-400" />
            <span>Imperiall RPG • Painel Admin</span>
          </Link>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
            Catálogo & Balanceamento em Tempo Real
          </span>
        </div>
        <AdminNav />
      </header>
      <main className="flex-1 p-5 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  )
}
