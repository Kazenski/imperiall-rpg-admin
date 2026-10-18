'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function listQuestTypes() {
  const { data, error } = await supabase.from('quest_types').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createQuestType(formData: FormData) {
  const payload = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    icon_url: String(formData.get('icon_url') || ''),
    sort_order: Number(formData.get('sort_order') || 0),
    is_active: formData.get('is_active') === 'on',
  }
  const { error } = await supabase.from('quest_types').insert(payload)
  if (error) throw error
  revalidatePath('/quests')
}

export async function updateQuestType(id: string, formData: FormData) {
  const payload = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    icon_url: String(formData.get('icon_url') || ''),
    sort_order: Number(formData.get('sort_order') || 0),
    is_active: formData.get('is_active') === 'on',
  }
  const { error } = await supabase.from('quest_types').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/quests')
}

export async function deleteQuestType(id: string) {
  const { error } = await supabase.from('quest_types').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/quests')
}

export async function updateRewardChest(id: string, formData: FormData) {
  const payload = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    icon_url: String(formData.get('icon_url') || ''),
    rewards: JSON.parse(String(formData.get('rewards') || '[]')),
    is_active: formData.get('is_active') === 'on',
    sort_order: Number(formData.get('sort_order') || 0),
  }
  const { error } = await supabase.from('reward_chests').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/quests')
}

export async function deleteRewardChest(id: string) {
  const { error } = await supabase.from('reward_chests').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/quests')
}

export async function listQuests() {
  const { data, error } = await supabase.from('quests').select('*, quest_types(name), reward_chests(name)').order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function listRewardChests() {
  const { data, error } = await supabase.from('reward_chests').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createQuest(formData: FormData) {
  const payload = {
    quest_type_id: formData.get('quest_type_id') || null,
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    icon_url: String(formData.get('icon_url') || ''),
    objective_type: String(formData.get('objective_type') || 'collect'),
    objective_target: String(formData.get('objective_target') || ''),
    objective_count: Number(formData.get('objective_count') || 1),
    recurrence: String(formData.get('recurrence') || 'none'),
    reward_chest_id: formData.get('reward_chest_id') || null,
    reward_gold: Number(formData.get('reward_gold') || 0),
    reward_gems: Number(formData.get('reward_gems') || 0),
    reward_xp: Number(formData.get('reward_xp') || 0),
    is_active: formData.get('is_active') === 'on',
    sort_order: Number(formData.get('sort_order') || 0),
  }
  const { error } = await supabase.from('quests').insert(payload)
  if (error) throw error
  revalidatePath('/quests')
}

export async function updateQuest(id: string, formData: FormData) {
  const payload = {
    quest_type_id: formData.get('quest_type_id') || null,
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    icon_url: String(formData.get('icon_url') || ''),
    objective_type: String(formData.get('objective_type') || 'collect'),
    objective_target: String(formData.get('objective_target') || ''),
    objective_count: Number(formData.get('objective_count') || 1),
    recurrence: String(formData.get('recurrence') || 'none'),
    reward_chest_id: formData.get('reward_chest_id') || null,
    reward_gold: Number(formData.get('reward_gold') || 0),
    reward_gems: Number(formData.get('reward_gems') || 0),
    reward_xp: Number(formData.get('reward_xp') || 0),
    is_active: formData.get('is_active') === 'on',
    sort_order: Number(formData.get('sort_order') || 0),
  }
  const { error } = await supabase.from('quests').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/quests')
}

export async function deleteQuest(id: string) {
  const { error } = await supabase.from('quests').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/quests')
}

export async function createRewardChest(formData: FormData) {
  const payload = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    icon_url: String(formData.get('icon_url') || ''),
    rewards: JSON.parse(String(formData.get('rewards') || '[]')),
    is_active: formData.get('is_active') === 'on',
    sort_order: Number(formData.get('sort_order') || 0),
  }
  const { error } = await supabase.from('reward_chests').insert(payload)
  if (error) throw error
  revalidatePath('/quests')
}

export async function toggleQuest(id: string, active: boolean) {
  const { error } = await supabase.from('quests').update({ is_active: active }).eq('id', id)
  if (error) throw error
  revalidatePath('/quests')
}