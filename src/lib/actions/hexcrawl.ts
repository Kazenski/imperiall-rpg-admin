'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const PATH = '/hexcrawl'

export async function listHexRegions() {
  const { data, error } = await supabase.from('hex_regions').select('*, hex_region_resources(*, items(name, icon_url)), hex_region_actions(*, manual_actions(name, icon_url))').order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createHexRegion(formData: FormData) {
  const payload = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    background_url: String(formData.get('background_url') || ''),
    is_active: formData.get('is_active') === 'on',
    sort_order: Number(formData.get('sort_order') || 0),
  }
  const { error } = await supabase.from('hex_regions').insert(payload)
  if (error) throw error
  revalidatePath(PATH)
}

export async function updateHexRegion(id: string, formData: FormData) {
  const payload = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    background_url: String(formData.get('background_url') || ''),
    is_active: formData.get('is_active') === 'on',
    sort_order: Number(formData.get('sort_order') || 0),
  }
  const { error } = await supabase.from('hex_regions').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteHexRegion(id: string) {
  const { error } = await supabase.from('hex_regions').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function addHexResource(regionId: string, itemId: string, quantity: number) {
  const { error } = await supabase.from('hex_region_resources').insert({ region_id: regionId, item_id: itemId, quantity })
  if (error) throw error
  revalidatePath(PATH)
}

export async function addHexAction(regionId: string, actionId: string, uses: number, cooldown: number) {
  const { error } = await supabase.from('hex_region_actions').insert({ region_id: regionId, manual_action_id: actionId, uses, cooldown_seconds: cooldown })
  if (error) throw error
  revalidatePath(PATH)
}