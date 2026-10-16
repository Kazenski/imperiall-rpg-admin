/**
 * Qual banco o painel esta conectado.
 *
 * Regra do projeto (staging-first): nada vai para producao antes de ser
 * validado no staging. Por isso o painel mostra sempre um selo do ambiente,
 * evitando salvar mudanca no banco errado sem querer.
 */

/** Ref do projeto Supabase de staging. */
export const STAGING_REF = 'jamhpibptsasvftqetdm'
/** Ref do projeto Supabase de producao. */
export const PROD_REF = 'agdukzabyyxzrjadjybf'

export type AppEnv = 'staging' | 'producao' | 'desconhecido'

function detect(): AppEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (url.includes(STAGING_REF)) return 'staging'
  if (url.includes(PROD_REF)) return 'producao'
  return 'desconhecido'
}

/** Ambiente do painel no deploy atual. */
export const appEnv: AppEnv = detect()

export const isStaging = appEnv === 'staging'
export const isProducao = appEnv === 'producao'
export const isDesconhecido = appEnv === 'desconhecido'

export const envLabel: Record<AppEnv, string> = {
  staging: 'STAGING',
  producao: 'PRODUÇÃO',
  desconhecido: 'AMBIENTE ?',
}