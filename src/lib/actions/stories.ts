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
  const { error } = await supabase.from('stories').insert({
    slug: data.slug, name: data.name, description: data.description || null,
    cover_url: data.cover_url || null,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function updateStory(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('stories').update({
    slug: data.slug, name: data.name, description: data.description || null,
    cover_url: data.cover_url || null,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  }).eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
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
  const { error } = await supabase.from('story_lines').insert({
    scene_id: data.scene_id, order_index: Number(data.order_index) || 0,
    speaker_type: data.speaker_type, speaker_name: data.speaker_name || null,
    npc_id: data.npc_id || null, text: data.text, portrait_url: data.portrait_url || null,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function updateLine(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('story_lines').update({
    order_index: Number(data.order_index) || 0,
    speaker_type: data.speaker_type, speaker_name: data.speaker_name || null,
    npc_id: data.npc_id || null, text: data.text, portrait_url: data.portrait_url || null,
  }).eq('id', id)
  if (error) throw error
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
  const { error } = await supabase.from('story_choices').insert({
    line_id: data.line_id, label: data.label,
    next_scene_id: data.next_scene_id || null,
    reward_xp: Number(data.reward_xp) || 0,
    reward_item_id: data.reward_item_id || null,
    reward_qty: Number(data.reward_qty) || 1,
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteChoice(id: string) {
  const { error } = await supabase.from('story_choices').delete().eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}
