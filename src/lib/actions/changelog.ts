'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const PATH = '/atualizacoes'

export async function listChangelog() {
  const { data, error } = await supabase
    .from('app_changelog')
    .select('*')
    .order('published_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function listActiveChangelog(limit = 10) {
  const { data, error } = await supabase
    .from('app_changelog')
    .select('*')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function createChangelogEntry(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('app_changelog').insert({
    title: data.title, body: data.body || null, version: data.version || null,
    is_active: data.is_active === 'on',
    published_at: data.published_at || new Date().toISOString(),
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function updateChangelogEntry(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload: Record<string, unknown> = {
    title: data.title, body: data.body || null, version: data.version || null,
    is_active: data.is_active === 'on',
  }
  if (data.published_at) payload.published_at = data.published_at
  const { error } = await supabase.from('app_changelog').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteChangelogEntry(id: string) {
  const { error } = await supabase.from('app_changelog').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function toggleChangelogActive(id: string, active: boolean) {
  const { error } = await supabase.from('app_changelog').update({ is_active: active }).eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}