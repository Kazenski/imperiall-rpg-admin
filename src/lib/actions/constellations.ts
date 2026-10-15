'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const PATH = '/constelacoes'

function isMissingTable(error: { message?: string; code?: string }) {
  const code = error?.code || ''
  const msg = (error?.message || '').toLowerCase()
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache')
  )
}

export async function listConstellationNodes(characterId: string) {
  if (!characterId) return []
  const { data, error } = await supabase
    .from('constellation_nodes')
    .select('*')
    .eq('character_id', characterId)
    .order('sort_order')
    .order('created_at')
  if (error) {
    if (isMissingTable(error)) return []
    throw error
  }
  return data || []
}

export async function createConstellationNode(input: {
  character_id: string
  title: string
  x: number
  y: number
  cost_orbs?: number
  orb_item_id?: string | null
  reset_item_id?: string | null
  is_start?: boolean
  color?: string
  required_level?: number
  required_story_id?: string | null
  required_zone_id?: string | null
  bonuses?: Record<string, number>
  connections?: string[]
  sort_order?: number
}) {
  const payload = {
    character_id: input.character_id,
    title: input.title || 'Estrela',
    x: Math.round(Math.min(96, Math.max(4, Number(input.x) || 50)) * 10) / 10,
    y: Math.round(Math.min(96, Math.max(4, Number(input.y) || 50)) * 10) / 10,
    cost_orbs: Math.max(1, Number(input.cost_orbs ?? 1)),
    orb_item_id: input.orb_item_id || null,
    reset_item_id: input.reset_item_id || null,
    is_start: Boolean(input.is_start),
    color: input.color || '#0ea5e9',
    required_level: Math.max(1, Number(input.required_level ?? 1)),
    required_story_id: input.required_story_id || null,
    required_zone_id: input.required_zone_id || null,
    bonuses: input.bonuses || {},
    connections: input.connections || [],
    sort_order: Number(input.sort_order ?? 0),
  }
  const { data, error } = await supabase
    .from('constellation_nodes')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  revalidatePath(PATH)
  return data
}

export async function updateConstellationNode(
  id: string,
  input: {
    title?: string
    x?: number
    y?: number
    cost_orbs?: number
    orb_item_id?: string | null
    reset_item_id?: string | null
    is_start?: boolean
    color?: string
    required_level?: number
    required_story_id?: string | null
    required_zone_id?: string | null
    bonuses?: Record<string, number>
    connections?: string[]
    sort_order?: number
  },
) {
  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.x !== undefined)
    patch.x = Math.round(Math.min(96, Math.max(4, Number(input.x))) * 10) / 10
  if (input.y !== undefined)
    patch.y = Math.round(Math.min(96, Math.max(4, Number(input.y))) * 10) / 10
  if (input.cost_orbs !== undefined) patch.cost_orbs = Math.max(1, Number(input.cost_orbs))
  if (input.orb_item_id !== undefined) patch.orb_item_id = input.orb_item_id || null
  if (input.reset_item_id !== undefined) patch.reset_item_id = input.reset_item_id || null
  if (input.is_start !== undefined) patch.is_start = Boolean(input.is_start)
  if (input.color !== undefined) patch.color = input.color
  if (input.required_level !== undefined)
    patch.required_level = Math.max(1, Number(input.required_level))
  if (input.required_story_id !== undefined)
    patch.required_story_id = input.required_story_id || null
  if (input.required_zone_id !== undefined)
    patch.required_zone_id = input.required_zone_id || null
  if (input.bonuses !== undefined) patch.bonuses = input.bonuses
  if (input.connections !== undefined) patch.connections = input.connections
  if (input.sort_order !== undefined) patch.sort_order = Number(input.sort_order)

  const { error } = await supabase.from('constellation_nodes').update(patch).eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

export async function toggleConstellationConnection(nodeAId: string, nodeBId: string) {
  if (!nodeAId || !nodeBId || nodeAId === nodeBId) return
  const { data: rows, error } = await supabase
    .from('constellation_nodes')
    .select('id, connections')
    .in('id', [nodeAId, nodeBId])
  if (error) throw error
  const nodeA = rows?.find((r) => r.id === nodeAId)
  const nodeB = rows?.find((r) => r.id === nodeBId)
  if (!nodeA || !nodeB) return

  const connA: string[] = Array.isArray(nodeA.connections) ? [...nodeA.connections] : []
  const connB: string[] = Array.isArray(nodeB.connections) ? [...nodeB.connections] : []

  const exists = connA.includes(nodeBId) || connB.includes(nodeAId)
  const nextA = exists ? connA.filter((id) => id !== nodeBId) : [...new Set([...connA, nodeBId])]
  const nextB = exists ? connB.filter((id) => id !== nodeAId) : [...new Set([...connB, nodeAId])]

  await Promise.all([
    supabase.from('constellation_nodes').update({ connections: nextA }).eq('id', nodeAId),
    supabase.from('constellation_nodes').update({ connections: nextB }).eq('id', nodeBId),
  ])
  revalidatePath(PATH)
}

export async function setConstellationConfigForCharacter(
  characterId: string,
  orbItemId: string | null,
  resetItemId: string | null,
) {
  const { error } = await supabase
    .from('constellation_nodes')
    .update({
      orb_item_id: orbItemId || null,
      reset_item_id: resetItemId || null,
    })
    .eq('character_id', characterId)
  if (error) throw error
  revalidatePath(PATH)
}

export async function deleteConstellationNode(id: string, characterId: string) {
  const { error } = await supabase.from('constellation_nodes').delete().eq('id', id)
  if (error) throw error

  // Limpa referências ao nó excluído nas conexões dos demais nós do herói
  const { data: remaining } = await supabase
    .from('constellation_nodes')
    .select('id, connections')
    .eq('character_id', characterId)
  if (remaining) {
    await Promise.all(
      remaining
        .filter((r) => Array.isArray(r.connections) && r.connections.includes(id))
        .map((r) =>
          supabase
            .from('constellation_nodes')
            .update({
              connections: (r.connections as string[]).filter((cid) => cid !== id),
            })
            .eq('id', r.id),
        ),
    )
  }
  revalidatePath(PATH)
}
