'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  syncDiffAction,
  syncRefreshAction,
  syncPromoteAction,
  syncDiagnoseAction,
  syncApplyMigrationsAction,
} from '@/lib/actions/sync'
import { TABLE_LABELS, CONSOLIDATED_MIGRATIONS_SQL } from '@/lib/sync'
import {
  RefreshCw,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Sparkles,
  Database,
  Check,
} from 'lucide-react'

export default function SincronizarPage() {
  const [diff, setDiff] = useState<
    { table: string; prod: number; staging: number; missingInProd?: boolean }[] | null
  >(null)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)
  const [showSql, setShowSql] = useState(false)
  const [diag, setDiag] = useState<
    { side: string; host: string; ok: boolean; detail: string }[] | null
  >(null)
  const [isPending, startTransition] = useTransition()

  const load = () => {
    setSetupError(null)
    syncDiffAction().then((r) => {
      if (r.ok) {
        setDiff(r.data)
        // Já pré-seleciona automaticamente as tabelas que diferem entre teste e oficial!
        const changed = new Set(
          r.data.filter((d) => d.staging !== d.prod || d.staging > 0).map((d) => d.table),
        )
        setSelected(changed)
      } else {
        setSetupError(r.error)
        setDiff(null)
      }
    })
  }
  useEffect(() => {
    load()
  }, [])

  const handleDiagnose = () => {
    setDiag(null)
    startTransition(async () => {
      const r = await syncDiagnoseAction()
      if (r.ok) setDiag(r.data)
      else setResult('Falha no diagnóstico: ' + r.error)
    })
  }

  const handleCopySql = async () => {
    await navigator.clipboard.writeText(CONSOLIDATED_MIGRATIONS_SQL)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 3000)
  }

  const handleApplyMigrations = () => {
    setResult(null)
    startTransition(async () => {
      const r = await syncApplyMigrationsAction('both')
      if (r.ok) {
        setResult(r.data.detail)
        load()
      } else {
        setResult('Falha: ' + r.error)
      }
    })
  }

  const toggle = (t: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const handleRefresh = () => {
    if (
      !confirm(
        'Apagar TODO o catálogo do teste e copiar do oficial? O teste fica igual ao oficial.',
      )
    )
      return
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
    if (tables.length === 0) {
      setResult('Selecione ao menos uma tabela.')
      return
    }
    if (
      !confirm(
        `Enviar ${tables.length} tabela(s) do TESTE para o OFICIAL? Isso atualiza a estrutura e copia todos os cadastros do teste para o oficial.`,
      )
    )
      return
    setResult(null)
    startTransition(async () => {
      const r = await syncPromoteAction(tables)
      if (r.ok) {
        const total = r.data.reduce((s, d) => s + d.rows, 0)
        setResult(
          `Publicado com sucesso: ${total} linha(s) em ${r.data.length} tabela(s) levadas do TESTE para o OFICIAL!`,
        )
        setConfirmed(false)
        load()
      } else setResult('Falha: ' + r.error)
    })
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2 text-sky-400">
          <RefreshCw size={22} /> Sincronizar Teste (Staging) ↔ Oficial (Prod)
        </h2>
        <p className="text-sm text-muted-foreground">
          Leve tudo o que você cadastrou e testou no Staging direto para o banco Oficial com 1 clique.
        </p>
      </div>

      {/* PACOTÃO ÚNICO DE MIGRATIONS (SEM PRECISAR RODAR UMA POR UMA!) */}
      <div className="border-2 border-emerald-500/40 bg-emerald-950/15 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="font-bold text-base text-emerald-300 flex items-center gap-2">
              <Sparkles size={18} /> Estrutura do Banco (Pacotão Único 007 → 015 + Auto-Migration)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Você <strong>NÃO precisa rodar as migrations antigas uma por uma</strong>! Reunimos todas as migrations (007 até 015) em um único script seguro (<code>IF NOT EXISTS</code>).
              Cole-o <strong>1 única vez</strong> no SQL Editor do banco Oficial e, a partir daí, o botão abaixo aplica qualquer estrutura nova sozinho!
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow"
            >
              {copiedSql ? <Check size={14} /> : <Copy size={14} />}
              {copiedSql ? 'SQL Único Copiado!' : 'Copiar SQL Único (007 → 015)'}
            </button>
            <button
              type="button"
              onClick={handleApplyMigrations}
              disabled={isPending}
              className="px-3.5 py-2 rounded-lg border border-sky-500/50 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Database size={14} /> Aplicar Estrutura via Painel
            </button>
            <button
              type="button"
              onClick={() => setShowSql(!showSql)}
              className="px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
            >
              {showSql ? 'Ocultar SQL' : 'Ver SQL'}
            </button>
          </div>
        </div>

        {showSql && (
          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-emerald-200 overflow-x-auto max-h-72">
            {CONSOLIDATED_MIGRATIONS_SQL}
          </pre>
        )}
      </div>

      {setupError && (
        <div className="border border-amber-500 rounded-xl p-4 text-sm space-y-2 bg-amber-950/20">
          <p className="font-semibold flex items-center gap-2 text-amber-300">
            <AlertTriangle size={16} /> Sincronia automática de linhas requer as chaves de serviço na Vercel
          </p>
          <p className="text-muted-foreground">{setupError}</p>
          <button
            onClick={handleDiagnose}
            disabled={isPending}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-50"
          >
            {isPending ? 'Testando...' : 'Diagnosticar conexão'}
          </button>
          {diag && (
            <div className="space-y-1 font-mono text-xs">
              {diag.map((d) => (
                <p key={d.side} className={d.ok ? 'text-emerald-400' : 'text-rose-400'}>
                  [{d.side}] {d.host} → {d.detail}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {diff && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PASSO 1 — Levar do TESTE (Staging) para o OFICIAL (Prod) */}
            <div className="border-2 border-amber-500/50 bg-amber-950/15 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-amber-300 flex items-center gap-2">
                <UploadCloud size={18} /> Levar tudo do TESTE (Staging) → OFICIAL (Prod)
              </h3>
              <p className="text-xs text-slate-300">
                Você já fez tudo certinho no <strong>Staging</strong>? Basta confirmar abaixo e clicar em <strong>Publicar no Oficial</strong>: ele copia todos os seus Heróis, Zonas, Fases, Histórias, Receitas, Profissões e Constelações do Teste direto para o Oficial!
              </p>
              <label className="flex items-start gap-2 text-xs border border-amber-500/30 bg-slate-950/60 rounded-lg p-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Confirmo publicar as <strong>{selected.size} tabela(s)</strong> selecionadas do banco de TESTE para o banco OFICIAL.
                </span>
              </label>
              <button
                onClick={handlePromote}
                disabled={isPending || selected.size === 0 || !confirmed}
                className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              >
                <UploadCloud size={16} /> Publicar TESTE → OFICIAL ({selected.size} tabelas)
              </button>
            </div>

            {/* Oposto: Copiar Oficial -> Teste */}
            <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                  <RefreshCw size={16} /> Caminho Inverso: Copiar OFICIAL → TESTE
                </h3>
                <p className="text-xs text-muted-foreground">
                  Atenção: este botão apaga o catálogo do banco de teste e puxa o que está no oficial. <strong>Não use</strong> se o seu trabalho mais recente estiver no Teste e ainda não tiver sido publicado no Oficial!
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isPending}
                className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg inline-flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <RefreshCw size={14} /> {isPending ? 'Copiando...' : 'Sobrescrever Teste com dados do Oficial'}
              </button>
            </div>
          </div>

          {result && (
            <div className="text-sm border-2 border-emerald-500/50 bg-emerald-950/30 text-emerald-200 rounded-xl p-3.5 flex items-center gap-2 font-medium">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
              <span>{result}</span>
            </div>
          )}

          <div className="border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={diff.length > 0 && selected.size === diff.length}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? new Set(diff.map((d) => d.table)) : new Set(),
                        )
                      }
                    />
                  </th>
                  <th className="p-2.5 text-left">Tabela do Catálogo</th>
                  <th className="p-2.5 text-left">No Teste (Staging)</th>
                  <th className="p-2.5 text-left">No Oficial (Prod)</th>
                  <th className="p-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {diff.map((d) => (
                  <tr key={d.table} className="border-t">
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(d.table)}
                        onChange={() => toggle(d.table)}
                      />
                    </td>
                    <td className="p-2.5 font-medium">
                      {TABLE_LABELS[d.table] || d.table}{' '}
                      <span className="text-muted-foreground font-normal text-xs">
                        (<code>{d.table}</code>)
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-amber-300">{d.staging}</td>
                    <td className="p-2.5 text-slate-300">{d.prod}</td>
                    <td className="p-2.5">
                      {d.missingInProd ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold">
                          Tabela nova (rode o SQL Único acima 1x no Oficial)
                        </span>
                      ) : d.prod === d.staging ? (
                        <span className="text-emerald-400 text-xs font-semibold">
                          Sincronizados ({d.prod})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold">
                          Diferem (Teste: {d.staging} → Oficial: {d.prod})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
