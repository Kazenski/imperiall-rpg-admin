'use client'

import { useState, useEffect, useTransition } from 'react'
import { syncDiffAction, syncRefreshAction, syncPromoteAction } from '@/lib/actions/sync'
import { TABLE_LABELS } from '@/lib/sync'
import { RefreshCw, UploadCloud, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function SincronizarPage() {
  const [diff, setDiff] = useState<{ table: string; prod: number; staging: number }[] | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const load = () => {
    setSetupError(null)
    syncDiffAction().then((r) => {
      if (r.ok) setDiff(r.data)
      else { setSetupError(r.error); setDiff(null) }
    })
  }
  useEffect(() => { load() }, [])

  const toggle = (t: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const handleRefresh = () => {
    if (!confirm('Apagar TODO o catálogo do teste e copiar do oficial? O teste fica igual ao oficial.')) return
    setResult(null)
    startTransition(async () => {
      const r = await syncRefreshAction()
      if (r.ok) {
        const total = r.data.reduce((s, d) => s + d.rows, 0)
        setResult(`Teste atualizado: ${total} linha(s) copiadas do oficial.`)
        load()
      } else setResult('Falha: ' + r.error)
    })
  }

  const handlePromote = () => {
    const tables = [...selected]
    if (tables.length === 0) { setResult('Selecione ao menos uma tabela.'); return }
    if (!confirm(`Enviar ${tables.length} tabela(s) do TESTE para o OFICIAL? Isso SOBRESCREVE pelo id. Exclusões feitas no teste NÃO apagam no oficial.`)) return
    setResult(null)
    startTransition(async () => {
      const r = await syncPromoteAction(tables)
      if (r.ok) {
        const total = r.data.reduce((s, d) => s + d.rows, 0)
        setResult(`Promovido: ${total} linha(s) em ${r.data.length} tabela(s). Confira no oficial.`)
        setSelected(new Set())
        load()
      } else setResult('Falha: ' + r.error)
    })
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Sincronizar teste ↔ oficial</h2>
        <p className="text-sm text-muted-foreground">Teste tudo no banco de teste e promova só o que quiser para o oficial.</p>
      </div>

      {setupError && (
        <div className="border border-amber-500 rounded p-4 text-sm space-y-2">
          <p className="font-semibold flex items-center gap-2"><AlertTriangle size={16} /> Sincronia indisponível aqui</p>
          <p className="text-muted-foreground">{setupError}</p>
          <p className="text-muted-foreground">Esta página só funciona no deploy de <strong>produção</strong>, com as 4 variáveis de serviço cadastradas na Vercel (sem prefixo NEXT_PUBLIC_): SUPABASE_PROD_URL, SUPABASE_PROD_SERVICE_KEY, SUPABASE_STAGING_URL, SUPABASE_STAGING_SERVICE_KEY. Depois, redeploy.</p>
        </div>
      )}

      {diff && (
        <>
          <div className="border rounded p-4 flex flex-wrap gap-3 items-center">
            <button onClick={handleRefresh} disabled={isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded inline-flex items-center gap-2 disabled:opacity-50">
              <RefreshCw size={16} /> {isPending ? 'Copiando...' : 'Atualizar teste ← oficial (tudo)'}
            </button>
            <button onClick={handlePromote} disabled={isPending || selected.size === 0} className="px-4 py-2 border border-red-500 text-red-600 rounded inline-flex items-center gap-2 disabled:opacity-50">
              <UploadCloud size={16} /> Promover selecionadas → oficial ({selected.size})
            </button>
          </div>

          {result && (
            <p className="text-sm border rounded p-3 flex items-center gap-2"><CheckCircle2 size={16} /> {result}</p>
          )}

          <div className="border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2"><input type="checkbox" checked={diff.length > 0 && selected.size === diff.length} onChange={(e) => setSelected(e.target.checked ? new Set(diff.map(d => d.table)) : new Set())} /></th>
                  <th className="p-2 text-left">Tabela</th>
                  <th className="p-2 text-left">Oficial</th>
                  <th className="p-2 text-left">Teste</th>
                  <th className="p-2 text-left">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {diff.map(d => (
                  <tr key={d.table} className="border-t">
                    <td className="p-2"><input type="checkbox" checked={selected.has(d.table)} onChange={() => toggle(d.table)} /></td>
                    <td className="p-2 font-medium">{TABLE_LABELS[d.table] || d.table} <span className="text-muted-foreground font-normal">({d.table})</span></td>
                    <td className="p-2">{d.prod}</td>
                    <td className="p-2">{d.staging}</td>
                    <td className="p-2">{d.prod === d.staging ? <span className="text-green-600">iguais</span> : <span className="text-amber-600 font-semibold">diferem</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Promover faz upsert pelo id (cria ou atualiza). Exclusões feitas no teste não apagam no oficial — delete lá direto se precisar.
            Perfis, punições e progresso de jogadores nunca viajam. Imagens seguem no bucket oficial.
          </p>
        </>
      )}
    </div>
  )
}
