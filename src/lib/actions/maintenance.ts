'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { formStrings } from '@/lib/utils/form'

/** Detecta imagem vs video pela extensao da URL. */
function detectMediaType(url: string | null): 'image' | 'video' {
  if (!url) return 'image'
  const clean = url.split('?')[0]
  return /\.(mp4|webm|mov|m4v|ogv|mkv|avi)$/i.test(clean) ? 'video' : 'image'
}

const PATH = '/manutencao'

/**
 * Migrations ainda não aplicadas geram erro 500 na página (React #441).
 * Aqui a página degradada: se a tabela/coluna não existir, devolvemos vazio
 * e o admin mostra um aviso em vez de quebrar o site inteiro.
 */
function isMissing(error: any) {
  const code = error?.code || ''
  const msg = (error?.message || '').toLowerCase()
  return (
    code === '42703' || // undefined_column
    code === '42P01' || // undefined_table
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    msg.includes('column') ||
    msg.includes('relation') ||
    msg.includes('bucket') ||
    msg.includes('does not exist')
  )
}

export async function listMaintenanceWindows() {
  const { data, error } = await supabase
    .from('app_maintenance_windows')
    .select('*')
    .order('starts_at', { ascending: false })
  if (error) {
    if (isMissing(error)) return []
    throw error
  }
  return data || []
}

export async function createMaintenanceWindow(formData: FormData) {
  const data = formStrings(formData)
  const minutes = Number(data.duration_minutes) || 30
  const starts = new Date()
  const ends = new Date(starts.getTime() + minutes * 60000)
  const payload = {
    title: data.title || null,
    message: data.message,
    media_url: data.media_url || null,
    media_type: data.media_type || 'image',
    starts_at: data.starts_at || starts.toISOString(),
    ends_at: data.ends_at || ends.toISOString(),
    is_active: data.is_active === 'on',
  }
  const { error } = await supabase.from('app_maintenance_windows').insert(payload)
  if (error) throw error
  revalidatePath(PATH)
}

export async function updateMaintenanceWindow(id: string, formData: FormData) {
  const data = formStrings(formData)
  const payload: Record<string, unknown> = {
    title: data.title || null,
    message: data.message,
    media_url: data.media_url || null,
    media_type: data.media_type || 'image',
    is_active: data.is_active === 'on',
  }
  if (data.starts_at) payload.starts_at = data.starts_at
  if (data.ends_at) payload.ends_at = data.ends_at
  const { error } = await supabase.from('app_maintenance_windows').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function toggleMaintenanceActive(id: string, active: boolean) {
  const { error } = await supabase
    .from('app_maintenance_windows')
    .update({ is_active: active })
    .eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteMaintenanceWindow(id: string) {
  const { error } = await supabase.from('app_maintenance_windows').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

const EMPTY_SPLASH = {
  id: 1,
  capa_inicializacao_url: null,
  capa_inicializacao_tipo: 'image',
  capa_inicializacao_poster_url: null,
}

export async function getSplashConfig() {
  // 1) com poster (migration 020)
  const full = await supabase
    .from('app_ui_config')
    .select('capa_inicializacao_url, capa_inicializacao_tipo, capa_inicializacao_poster_url')
    .eq('id', 1)
    .single()
  if (!full.error && full.data) return { id: 1, ...full.data }

  // 2) sem poster (migration 018)
  const old = await supabase
    .from('app_ui_config')
    .select('capa_inicializacao_url, capa_inicializacao_tipo')
    .eq('id', 1)
    .single()
  if (!old.error && old.data) return { ...EMPTY_SPLASH, ...old.data }

  // 3) tabela nem existe -> vazio (sem 500)
  return EMPTY_SPLASH
}

export async function updateSplashConfig(formData: FormData) {
  const data = formStrings(formData)
  const url = data.capa_inicializacao_url || null
  // Tipo detectado pelo proprio arquivo (imagem vs video), independe do select antigo.
  const tipo = data.capa_inicializacao_tipo || data.media_type || detectMediaType(url)
  const base = {
    capa_inicializacao_url: url,
    capa_inicializacao_tipo: tipo,
    updated_at: new Date().toISOString(),
  }
  const withPoster = { ...base, capa_inicializacao_poster_url: data.capa_inicializacao_poster_url || null }

  let { error } = await supabase.from('app_ui_config').update(withPoster).eq('id', 1)
  if (error) ({ error } = await supabase.from('app_ui_config').update(base).eq('id', 1))
  if (error && isMissing(error)) {
    throw new Error(
      'Tabela app_ui_config não existe. Rode a migration 018 no Supabase (SQL Editor).',
    )
  }
  if (error) throw error
  revalidatePath(PATH)
}