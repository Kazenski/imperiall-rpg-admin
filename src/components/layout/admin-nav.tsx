'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Package, Skull, Zap, Map, Waves, Gift, UserCheck, BookOpen,
  Sparkles, Swords, Network, Star, Hammer, Wrench, RefreshCw, Users, HelpCircle,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/items', label: 'Itens', icon: Package, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
  { href: '/mobs', label: 'Inimigos', icon: Skull, color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
  { href: '/skills', label: 'Habilidades', icon: Zap, color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
  { href: '/stages', label: 'Zonas & Fases', icon: Map, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
  { href: '/waves', label: 'Ondas', icon: Waves, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' },
  { href: '/loot-tables', label: 'Loot', icon: Gift, color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' },
  { href: '/npcs', label: 'NPCs', icon: UserCheck, color: 'text-teal-400 border-teal-500/40 bg-teal-500/10' },
  { href: '/historias', label: 'Histórias', icon: BookOpen, color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10' },
  { href: '/efeitos', label: 'Efeitos', icon: Sparkles, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
  { href: '/personagens', label: 'Heróis', icon: Swords, color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' },
  { href: '/arvore', label: 'Árvore', icon: Network, color: 'text-lime-400 border-lime-500/40 bg-lime-500/10' },
  { href: '/constelacoes', label: 'Constelações', icon: Star, color: 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10' },
  { href: '/profissoes', label: 'Profissões', icon: Wrench, color: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
  { href: '/receitas', label: 'Oficina / Craft', icon: Hammer, color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
  { href: '/sincronizar', label: 'Sincronizar', icon: RefreshCw, color: 'text-sky-300 border-sky-500/40 bg-sky-500/10' },
  { href: '/usuarios', label: 'Usuários', icon: Users, color: 'text-pink-400 border-pink-500/40 bg-pink-500/10' },
  { href: '/guia', label: 'Guia', icon: HelpCircle, color: 'text-zinc-300 border-zinc-500/40 bg-zinc-500/10' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1.5 text-xs">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-2.5 py-1.5 rounded-lg border transition inline-flex items-center gap-1.5 font-medium ${
              active
                ? `${item.color} ring-1 ring-current shadow-md font-bold`
                : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Icon size={13} className={active ? '' : item.color.split(' ')[0]} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
