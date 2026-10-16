import Link from 'next/link'
import { Crown } from 'lucide-react'

import { appEnv, envLabel, isDesconhecido, isProducao, isStaging } from '@/lib/app-env'
import AdminNav from '@/components/layout/admin-nav'

/** Selo de ambiente: vermelho na producao, ciano no staging. */
function EnvBadge() {
  if (isDesconhecido) {
    return (
      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-300">
        {envLabel.desconhecido}
      </span>
    )
  }

  return (
    <span
      className={[
        'text-[11px] font-bold px-2.5 py-0.5 rounded-full border tracking-wider',
        isStaging
          ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
          : 'bg-red-500/15 border-red-400/40 text-red-300',
      ].join(' ')}
      title={
        isStaging
          ? 'Painel conectado no banco de staging. Mudancas aqui NAO afetam os jogadores.'
          : 'Painel conectado no banco de producao. Tudo que salvar aqui vai ao vivo.'
      }
    >
      {envLabel[appEnv]}
    </span>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-amber-500/25 bg-slate-950/90 backdrop-blur px-5 py-3 space-y-2.5 sticky top-0 z-30 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-bold text-base text-amber-400 flex items-center gap-2 hover:text-amber-300">
              <Crown size={18} className="text-amber-400" />
              <span>Imperiall RPG • Painel Admin</span>
            </Link>
            <EnvBadge />
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
            Catálogo & Balanceamento em Tempo Real
          </span>
        </div>
        {isProducao ? (
          <p className="text-[11px] text-red-300/80">
            Ambiente de PRODUÇÃO: alterações aqui vão ao ar imediatamente.
          </p>
        ) : null}
        <AdminNav />
      </header>
      <main className="flex-1 p-5 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  )
}