'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function listNpcs() {
  const { data, error } = await supabase.from('npcs').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function createNpc(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('npcs').insert({
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    portrait_url: data.portrait_url || null,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  revalidatePath('/npcs')
}

export async function updateNpc(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('npcs').update({
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    portrait_url: data.portrait_url || null,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/npcs')
}

export async function deleteNpc(id: string) {
  const { error } = await supabase.from('npcs').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/npcs')
}
