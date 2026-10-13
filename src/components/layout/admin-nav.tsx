import Link from 'next/link'

export default function AdminNav() {
  const links = [
    { href: '/items', label: 'Items' },
    { href: '/mobs', label: 'Mobs' },
    { href: '/skills', label: 'Skills' },
    { href: '/stages', label: 'Stages' },
    { href: '/waves', label: 'Waves' },
    { href: '/loot-tables', label: 'Loot Tables' },
  ]
  return (
    <nav className="flex gap-3 text-sm">
      {links.map(l => <Link key={l.href} href={l.href} className="underline-offset-4 hover:underline">{l.label}</Link>)}
    </nav>
  )
}
