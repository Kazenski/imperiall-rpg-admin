'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { slugExists } from '@/lib/utils/slug'

export async function listZones() {
  const { data, error } = await supabase.from('zones').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function listStages() {
  const { data, error } = await supabase.from('stages').select('*, zones(name)').order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function createStage(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload = {
    zone_id: data.zone_id || null,
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    stage_number: Number(data.stage_number) || 1,
    recommended_level: Number(data.recommended_level) || 1,
    energy_cost: Number(data.energy_cost) || 1,
    is_boss_stage: data.is_boss_stage === 'on',
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
  if (await slugExists('stages', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('stages').insert(payload)
  if (error) throw error
  revalidatePath('/stages')
}

export async function updateStage(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload = {
    zone_id: data.zone_id || null,
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    stage_number: Number(data.stage_number) || 1,
    recommended_level: Number(data.recommended_level) || 1,
    energy_cost: Number(data.energy_cost) || 1,
    is_boss_stage: data.is_boss_stage === 'on',
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
  if (await slugExists('stages', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('stages').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/stages')
}

export async function deleteStage(id: string) {
  const { error } = await supabase.from('stages').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/stages')
}

