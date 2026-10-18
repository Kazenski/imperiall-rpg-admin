'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const PATH = '/changelog-geral'

export async function listChangelogEntries() {
  const { data, error } = await supabase.from('changelog_entries').select('*').order('published_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createChangelogEntryGeneral(formData: FormData) {
  const payload = {
    version: String(formData.get('version') || ''),
    title: String(formData.get('title') || ''),
    body_technical: String(formData.get('body_technical') || ''),
    body_user: String(formData.get('body_user') || ''),
    category: String(formData.get('category') || 'feature'),
    affects_app: formData.get('affects_app') === 'on',
    requires_migration: formData.get('requires_migration') === 'on',
    is_published: formData.get('is_published') === 'on',
    published_at: formData.get('published_at') ? new Date(String(formData.get('published_at'))).toISOString() : new Date().toISOString(),
  }
  const { error } = await supabase.from('changelog_entries').insert(payload)
  if (error) throw error
  revalidatePath(PATH)
}

export async function updateChangelogEntryGeneral(id: string, formData: FormData) {
  const payload: Record<string, unknown> = {
    version: String(formData.get('version') || ''),
    title: String(formData.get('title') || ''),
    body_technical: String(formData.get('body_technical') || ''),
    body_user: String(formData.get('body_user') || ''),
    category: String(formData.get('category') || 'feature'),
    affects_app: formData.get('affects_app') === 'on',
    requires_migration: formData.get('requires_migration') === 'on',
    is_published: formData.get('is_published') === 'on',
  }
  if (formData.get('published_at')) payload.published_at = new Date(String(formData.get('published_at'))).toISOString()
  const { error } = await supabase.from('changelog_entries').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteChangelogEntryGeneral(id: string) {
  const { error } = await supabase.from('changelog_entries').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}