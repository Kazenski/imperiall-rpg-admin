import Link from 'next/link'

export default function AdminNav() {
  const links = [
    { href: '/items', label: 'Itens' },
    { href: '/mobs', label: 'Inimigos' },
    { href: '/skills', label: 'Habilidades' },
    { href: '/stages', label: 'Fases' },
    { href: '/menus-flutuantes', label: 'Flutuantes' },
    { href: '/waves', label: 'Ondas' },
    { href: '/loot-tables', label: 'Loot' },
    { href: '/npcs', label: 'NPCs' },
    { href: '/historias', label: 'Histórias' },
    { href: '/efeitos', label: 'Efeitos' },
    { href: '/personagens', label: 'Heróis' },
    { href: '/arvore', label: 'Árvore' },
    { href: '/profissoes', label: 'Profissões' },
    { href: '/receitas', label: 'Craft' },
    { href: '/sincronizar', label: 'Sincronizar' },
    { href: '/usuarios', label: 'Usuários' },
    { href: '/guia', label: 'Guia' },
  ]
  return (
    <nav className="flex gap-3 text-sm">
      {links.map(l => <Link key={l.href} href={l.href} className="underline-offset-4 hover:underline">{l.label}</Link>)}
    </nav>
  )
}
