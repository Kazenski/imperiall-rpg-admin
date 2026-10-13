import AdminNav from '@/components/layout/admin-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">Imperiall RPG • Admin</div>
        <AdminNav />
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
