'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const PATH = '/manutencao'

export async function listMaintenanceWindows() {
  const { data, error } = await supabase
    .from('app_maintenance_windows')
    .select('*')
    .order('starts_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createMaintenanceWindow(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
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
  const data = Object.fromEntries(formData.entries())
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

export async function getSplashConfig() {
  const { data, error } = await supabase
    .from('app_ui_config')
    .select('*')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data
}

export async function updateSplashConfig(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload = {
    splash_media_url: data.splash_media_url || null,
    splash_media_type: data.media_type || 'image',
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('app_ui_config').update(payload).eq('id', 1)
  if (error) throw error
  revalidatePath(PATH)
}