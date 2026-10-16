'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { slugExists } from '@/lib/utils/slug'
import { formStrings } from '@/lib/utils/form'

const PATH = '/historias'

export async function listStories() {
  const { data, error } = await supabase.from('stories').select('*').order('sort_order')
  if (error) throw error
  return data
}

export async function createStory(formData: FormData) {
  const data = formStrings(formData)
  const payload: Record<string, unknown> = {
    slug: data.slug, name: data.name, description: data.description || null,
    cover_url: data.cover_url || null,
    lore_reward: Number(data.lore_reward) || 0,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  }
  if (await slugExists('stories', data.slug)) throw new Error('Slug já existe')
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
  const data = formStrings(formData)
  const payload: Record<string, unknown> = {
    slug: data.slug, name: data.name, description: data.description || null,
    cover_url: data.cover_url || null,
    lore_reward: Number(data.lore_reward) || 0,
    is_active: data.is_active === 'on', sort_order: Number(data.sort_order) || 0,
  }
  if (await slugExists('stories', data.slug, id)) throw new Error('Slug já existe')
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
  const { data: row, error } = await supabase
    .from('story_scenes')
    .insert({
      story_id: data.story_id, order_index: Number(data.order_index) || 0,
      title: data.title || null, background_url: data.background_url || null,
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return row
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
    only_via_choice: data.only_via_choice === 'on',
  }
  const { error } = await supabase.from('story_lines').insert(payload)
  if (error) {
    if (isMissingColumn(error)) {
      delete payload.unlock_zone_id
      delete payload.only_via_choice
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
    only_via_choice: data.only_via_choice === 'on',
  }
  const { error } = await supabase.from('story_lines').update(payload).eq('id', id)
  if (error) {
    if (isMissingColumn(error)) {
      delete payload.unlock_zone_id
      delete payload.only_via_choice
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

export async function moveLine(lineId: string, sceneId: string, orderIndex?: number) {
  // Define uma ordem segura no destino (evita violação de unicidade
  // quando o índice informado já existe na cena de destino).
  let nextOrder = typeof orderIndex === 'number' ? orderIndex : undefined
  if (nextOrder === undefined) {
    const { data: targetLines } = await supabase
      .from('story_lines')
      .select('order_index')
      .eq('scene_id', sceneId)
    const max = (targetLines || []).reduce(
      (m: number, r: any) => Math.max(m, Number(r?.order_index) || 0),
      -1,
    )
    nextOrder = max + 1
  }
  // Se o índice sugerido colidir com uma linha existente, empurra para o fim.
  const { data: collision } = await supabase
    .from('story_lines')
    .select('id')
    .eq('scene_id', sceneId)
    .eq('order_index', nextOrder)
    .neq('id', lineId)
  if (collision && collision.length > 0) {
    const { data: targetLines } = await supabase
      .from('story_lines')
      .select('order_index')
      .eq('scene_id', sceneId)
    const max = (targetLines || []).reduce(
      (m: number, r: any) => Math.max(m, Number(r?.order_index) || 0),
      -1,
    )
    nextOrder = max + 1
  }
  const payload: Record<string, unknown> = { scene_id: sceneId, order_index: nextOrder }
  const { error } = await supabase.from('story_lines').update(payload).eq('id', lineId)
  if (error) throw error
  revalidatePath(PATH)
}

export async function duplicateLine(lineId: string) {
  const { data: original, error: readError } = await supabase
    .from('story_lines')
    .select('*')
    .eq('id', lineId)
    .single()
  if (readError) throw readError
  if (!original) throw new Error('Fala não encontrada')
  // Remove campos que não devem ser copiados literalmente.
  const {
    id: _id,
    created_at: _created,
    updated_at: _updated,
    ...base
  } = original as Record<string, unknown>
  // Coloca a cópia no final da mesma cena (ordem alta para não colidir).
  base.order_index = Number(base.order_index || 0) + 1000
  base.text = `${base.text ?? ''}`.trim() ? `[Cópia] ${base.text}` : '[Cópia]'
  const { data: row, error } = await supabase
    .from('story_lines')
    .insert(base)
    .select()
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return row
}

export async function toggleLineViaChoice(lineId: string, value: boolean) {
  const payload: Record<string, unknown> = { only_via_choice: value }
  const { error } = await supabase.from('story_lines').update(payload).eq('id', lineId)
  if (error) {
    if (isMissingColumn(error)) {
      // Sem a coluna: nada a fazer.
      return
    }
    throw error
  }
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
    next_line_id: data.next_line_id || null,
    unlock_zone_id: data.unlock_zone_id || null,
    reward_xp: Number(data.reward_xp) || 0,
    reward_item_id: data.reward_item_id || null,
    reward_qty: Number(data.reward_qty) || 1,
    sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('story_choices').insert(payload)
  if (error) {
    if (isMissingColumn(error)) {
      // Só o unlock_zone_id é "opcional recente": tenta sem ele.
      if (payload.unlock_zone_id !== undefined) {
        delete payload.unlock_zone_id
        const { error: retryError } = await supabase.from('story_choices').insert(payload)
        if (!retryError) {
          revalidatePath(PATH)
          return
        }
      }
      // next_line_id / next_scene_id são essenciais para o fluxo de opções.
      throw new Error(
        'Banco sem as colunas de destino (next_line_id/next_scene_id). Rode a migration 013 (e 016) no Supabase antes de cadastrar opções.',
      )
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
    next_line_id: data.next_line_id || null,
    unlock_zone_id: data.unlock_zone_id || null,
    reward_xp: Number(data.reward_xp) || 0,
    reward_item_id: data.reward_item_id || null,
    reward_qty: Number(data.reward_qty) || 1,
    sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('story_choices').update(payload).eq('id', id)
  if (error) {
    if (isMissingColumn(error)) {
      if (payload.unlock_zone_id !== undefined) {
        delete payload.unlock_zone_id
        const { error: retryError } = await supabase.from('story_choices').update(payload).eq('id', id)
        if (!retryError) {
          revalidatePath(PATH)
          return
        }
      }
      throw new Error(
        'Banco sem as colunas de destino (next_line_id/next_scene_id). Rode a migration 013 (e 016) no Supabase antes de cadastrar opções.',
      )
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
