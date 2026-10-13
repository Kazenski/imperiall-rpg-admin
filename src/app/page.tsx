import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Imperiall RPG Admin</h1>
      <p className="text-muted-foreground">Gerencie catálogo: Itens • Mobs • Skills • Stages • Waves • Loot</p>
      <Link href="/items" className="underline">Ir para Admin</Link>
    </main>
  )
}
