'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const PATH = '/historias'

export async function listStories() {
  const { data, error } = await supabase.from('stories').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function createStory(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload: Record<string, unknown> = {
    slug: data.slug, name: data.name, description: data.description || null,
    cover_url: data.cover_url || null,
    lore_reward: Number(data.lore_reward) || 0,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('stories').insert(payload)
  if (error) {
    // Banco sem a migration 012: salva sem o prêmio em vez de quebrar.
    if (isMissingColumn(error)) {
      delete payload.lore_reward
      const { error: retryError } = await supabase.from('stories').insert(payload)
      if (retryError) throw retryError
      revalidatePath(PATH)
      return
    }
    throw error
  }
  revalidatePath(PATH)
}

export async function updateStory(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload: Record<string, unknown> = {
    slug: data.slug, name: data.name, description: data.description || null,
    cover_url: data.cover_url || null,
    lore_reward: Number(data.lore_reward) || 0,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('stories').update(payload).eq('id', id)
  if (error) {
    if (isMissingColumn(error)) {
      delete payload.lore_reward
      const { error: retryError } = await supabase.from('stories').update(payload).eq('id', id)
      if (retryError) throw retryError
      revalidatePath(PATH)
      return
    }
    throw error
  }
  revalidatePath(PATH)
}

function isMissingColumn(error: { message?: string; code?: string }) {
  const code = error?.code || ''
  const msg = (error?.message || '').toLowerCase()
  return code === '42703' || code === 'PGRST204' || msg.includes('column')
}

export async function deleteStory(id: string) {
  const { error } = await supabase.from('stories').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function listScenes(storyId: string) {
  const { data, error } = await supabase.from('story_scenes').select('*').eq('story_id', storyId).order('order_index')
  if (error) throw error
  return data
}

export async function createScene(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('story_scenes').insert({
    story_id: data.story_id, order_index: Number(data.order_index) || 0,
    title: data.title || null, background_url: data.background_url || null,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function updateScene(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('story_scenes').update({
    order_index: Number(data.order_index) || 0,
    title: data.title || null, background_url: data.background_url || null,
  }).eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteScene(id: string) {
  const { error } = await supabase.from('story_scenes').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function listLines(sceneId: string) {
  const { data, error } = await supabase.from('story_lines').select('*, npcs(name)').eq('scene_id', sceneId).order('order_index')
  if (error) throw error
  return data
}

export async function createLine(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload: Record<string, unknown> = {
    scene_id: data.scene_id, order_index: Number(data.order_index) || 0,
    speaker_type: data.speaker_type, speaker_name: data.speaker_name || null,
    npc_id: data.npc_id || null, text: data.text, portrait_url: data.portrait_url || null,
    unlock_zone_id: data.unlock_zone_id || null,
  }
  const { error } = await supabase.from('story_lines').insert(payload)
  if (error) {
    if (isMissingColumn(error)) {
      delete payload.unlock_zone_id
      const { error: retryError } = await supabase.from('story_lines').insert(payload)
      if (retryError) throw retryError
      revalidatePath(PATH)
      return
    }
    throw error
  }
  revalidatePath(PATH)
}

export async function updateLine(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload: Record<string, unknown> = {
    order_index: Number(data.order_index) || 0,
    speaker_type: data.speaker_type, speaker_name: data.speaker_name || null,
    npc_id: data.npc_id || null, text: data.text, portrait_url: data.portrait_url || null,
    unlock_zone_id: data.unlock_zone_id || null,
  }
  const { error } = await supabase.from('story_lines').update(payload).eq('id', id)
  if (error) {
    if (isMissingColumn(error)) {
      delete payload.unlock_zone_id
      const { error: retryError } = await supabase.from('story_lines').update(payload).eq('id', id)
      if (retryError) throw retryError
      revalidatePath(PATH)
      return
    }
    throw error
  }
  revalidatePath(PATH)
}

export async function deleteLine(id: string) {
  const { error } = await supabase.from('story_lines').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function listChoices(lineId: string) {
  const { data, error } = await supabase.from('story_choices').select('*, items(name)').eq('line_id', lineId).order('sort_order')
  if (error) throw error
  return data
}

export async function createChoice(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload: Record<string, unknown> = {
    line_id: data.line_id, label: data.label,
    next_scene_id: data.next_scene_id || null,
    unlock_zone_id: data.unlock_zone_id || null,
    reward_xp: Number(data.reward_xp) || 0,
    reward_item_id: data.reward_item_id || null,
    reward_qty: Number(data.reward_qty) || 1,
    sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('story_choices').insert(payload)
  if (error) {
    if (isMissingColumn(error)) {
      delete payload.unlock_zone_id
      const { error: retryError } = await supabase.from('story_choices').insert(payload)
      if (retryError) throw retryError
      revalidatePath(PATH)
      return
    }
    throw error
  }
  revalidatePath(PATH)
}

export async function updateChoice(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload: Record<string, unknown> = {
    label: data.label,
    next_scene_id: data.next_scene_id || null,
    unlock_zone_id: data.unlock_zone_id || null,
    reward_xp: Number(data.reward_xp) || 0,
    reward_item_id: data.reward_item_id || null,
    reward_qty: Number(data.reward_qty) || 1,
    sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('story_choices').update(payload).eq('id', id)
  if (error) {
    if (isMissingColumn(error)) {
      delete payload.unlock_zone_id
      const { error: retryError } = await supabase.from('story_choices').update(payload).eq('id', id)
      if (retryError) throw retryError
      revalidatePath(PATH)
      return
    }
    throw error
  }
  revalidatePath(PATH)
}

export async function deleteChoice(id: string) {
  const { error } = await supabase.from('story_choices').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}
