'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function listMarketingEvents() {
  const { data, error } = await supabase.from('marketing_events').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createMarketingEvent(formData: FormData) {
  const payload = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    icon_url: String(formData.get('icon_url') || ''),
    is_active: formData.get('is_active') === 'on',
    auto_start_at: formData.get('auto_start_at') ? new Date(String(formData.get('auto_start_at'))).toISOString() : null,
    auto_end_at: formData.get('auto_end_at') ? new Date(String(formData.get('auto_end_at'))).toISOString() : null,
    xp_multiplier: Number(formData.get('xp_multiplier') || 1),
    manual_action_speed_multiplier: Number(formData.get('manual_action_speed_multiplier') || 1),
    mob_drop_item_id: formData.get('mob_drop_item_id') || null,
    mob_drop_chance: Number(formData.get('mob_drop_chance') || 0),
    mob_drop_min_level: Number(formData.get('mob_drop_min_level') || 1),
    merchant_buy_multiplier: Number(formData.get('merchant_buy_multiplier') || 1),
    merchant_sell_multiplier: Number(formData.get('merchant_sell_multiplier') || 1),
  }
  const { error } = await supabase.from('marketing_events').insert(payload)
  if (error) throw error
  revalidatePath('/eventos-marketing')
}

export async function updateMarketingEvent(id: string, formData: FormData) {
  const payload = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    icon_url: String(formData.get('icon_url') || ''),
    is_active: formData.get('is_active') === 'on',
    auto_start_at: formData.get('auto_start_at') ? new Date(String(formData.get('auto_start_at'))).toISOString() : null,
    auto_end_at: formData.get('auto_end_at') ? new Date(String(formData.get('auto_end_at'))).toISOString() : null,
    xp_multiplier: Number(formData.get('xp_multiplier') || 1),
    manual_action_speed_multiplier: Number(formData.get('manual_action_speed_multiplier') || 1),
    mob_drop_item_id: formData.get('mob_drop_item_id') || null,
    mob_drop_chance: Number(formData.get('mob_drop_chance') || 0),
    mob_drop_min_level: Number(formData.get('mob_drop_min_level') || 1),
    merchant_buy_multiplier: Number(formData.get('merchant_buy_multiplier') || 1),
    merchant_sell_multiplier: Number(formData.get('merchant_sell_multiplier') || 1),
  }
  const { error } = await supabase.from('marketing_events').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/eventos-marketing')
}

export async function deleteMarketingEvent(id: string) {
  const { error } = await supabase.from('marketing_events').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/eventos-marketing')
}

export async function toggleMarketingEvent(id: string, active: boolean) {
  const { error } = await supabase.from('marketing_events').update({ is_active: active }).eq('id', id)
  if (error) throw error
  revalidatePath('/eventos-marketing')
}