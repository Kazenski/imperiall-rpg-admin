'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { slugExists } from '@/lib/utils/slug'
import { formStrings } from '@/lib/utils/form'

export async function listProfessions() {
  const { data, error } = await supabase.from('professions').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function createProfession(formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('professions', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('professions').insert({
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    icon_url: data.icon_url || null,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  revalidatePath('/profissoes')
}

export async function updateProfession(id: string, formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('professions', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('professions').update({
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    icon_url: data.icon_url || null,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/profissoes')
}

export async function deleteProfession(id: string) {
  const { error } = await supabase.from('professions').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/profissoes')
}
