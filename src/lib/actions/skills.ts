'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function listSkills() {
  const { data, error } = await supabase.from('skills').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function createSkill(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const effects: Record<string, any> = {}
  if (data.effects) { try { effects.config = JSON.parse(data.effects as string) } catch {} }
  delete (data as any).effects

  const payload = {
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    type: data.type,
    target: data.target,
    cooldown_ms: Number(data.cooldown_ms) || 0,
    mana_cost: Number(data.mana_cost) || 0,
    base_damage: Number(data.base_damage) || 0,
    icon_url: data.icon_url || null,
    animation_key: data.animation_key || null,
    effects: effects.config || {},
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('skills').insert(payload)
  if (error) throw error
  revalidatePath('//skills')
  redirect('//skills')
}

export async function updateSkill(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const effects: Record<string, any> = {}
  if (data.effects) { try { effects.config = JSON.parse(data.effects as string) } catch {} }
  delete (data as any).effects

  const payload = {
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    type: data.type,
    target: data.target,
    cooldown_ms: Number(data.cooldown_ms) || 0,
    mana_cost: Number(data.mana_cost) || 0,
    base_damage: Number(data.base_damage) || 0,
    icon_url: data.icon_url || null,
    animation_key: data.animation_key || null,
    effects: effects.config || {},
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('skills').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('//skills')
  redirect('//skills')
}

export async function deleteSkill(id: string) {
  const { error } = await supabase.from('skills').delete().eq('id', id)
  if (error) throw error
  revalidatePath('//skills')
}

