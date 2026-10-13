'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function listZones() {
  const { data, error } = await supabase.from('zones').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function createZone(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload = {
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    bg_url: data.bg_url || null,
    bg_parallax: data.bg_parallax === 'on',
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('zones').insert(payload)
  if (error) throw error
  revalidatePath('/stages')
}

export async function updateZone(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload = {
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    bg_url: data.bg_url || null,
    bg_parallax: data.bg_parallax === 'on',
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('zones').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/stages')
}

export async function deleteZone(id: string) {
  const { error } = await supabase.from('zones').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/stages')
}

