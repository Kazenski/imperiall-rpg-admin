import Link from 'next/link'

export default function AdminNav() {
  const links = [
    { href: '/(admin)/items', label: 'Items' },
    { href: '/(admin)/mobs', label: 'Mobs' },
    { href: '/(admin)/skills', label: 'Skills' },
    { href: '/(admin)/stages', label: 'Stages' },
    { href: '/(admin)/waves', label: 'Waves' },
    { href: '/(admin)/loot-tables', label: 'Loot Tables' },
  ]
  return (
    <nav className="flex gap-3 text-sm">
      {links.map(l => <Link key={l.href} href={l.href} className="underline-offset-4 hover:underline">{l.label}</Link>)}
    </nav>
  )
}
