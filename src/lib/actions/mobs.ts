'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { slugExists } from '@/lib/utils/slug'

export async function listMobs() {
  const { data, error } = await supabase.from('mobs').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createMob(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload = {
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    tier: data.tier,
    hp: Number(data.hp) || 50,
    atk: Number(data.atk) || 5,
    def: Number(data.def) || 2,
    exp_reward: Number(data.exp_reward) || 10,
    gold_reward: Number(data.gold_reward) || 5,
    speed: Number(data.speed) || 100,
    attack_cooldown_ms: Number(data.attack_cooldown_ms) || 800,
    scale: Number(data.scale) || 1,
    sprite_idle_url: data.sprite_idle_url || null,
    sprite_run_url: data.sprite_run_url || null,
    sprite_attack_url: data.sprite_attack_url || null,
    sprite_hit_url: data.sprite_hit_url || null,
    sprite_death_url: data.sprite_death_url || null,
    hitbox_w: Number(data.hitbox_w) || 32,
    hitbox_h: Number(data.hitbox_h) || 32,
    is_active: data.is_active === 'on',
  }
  if (await slugExists('mobs', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('mobs').insert(payload)
  if (error) throw error
  revalidatePath('/mobs')
}

export async function updateMob(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload = {
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    tier: data.tier,
    hp: Number(data.hp) || 50,
    atk: Number(data.atk) || 5,
    def: Number(data.def) || 2,
    exp_reward: Number(data.exp_reward) || 10,
    gold_reward: Number(data.gold_reward) || 5,
    speed: Number(data.speed) || 100,
    attack_cooldown_ms: Number(data.attack_cooldown_ms) || 800,
    scale: Number(data.scale) || 1,
    sprite_idle_url: data.sprite_idle_url || null,
    sprite_run_url: data.sprite_run_url || null,
    sprite_attack_url: data.sprite_attack_url || null,
    sprite_hit_url: data.sprite_hit_url || null,
    sprite_death_url: data.sprite_death_url || null,
    hitbox_w: Number(data.hitbox_w) || 32,
    hitbox_h: Number(data.hitbox_h) || 32,
    is_active: data.is_active === 'on',
  }
  if (await slugExists('mobs', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('mobs').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/mobs')
}

export async function deleteMob(id: string) {
  const { error } = await supabase.from('mobs').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/mobs')
}

/** Duplica um inimigo com novo slug (útil para criar variações). */
export async function duplicateMob(id: string) {
  const { data, error } = await supabase.from('mobs').select('*').eq('id', id).single()
  if (error || !data) throw error || new Error('Inimigo não encontrado')
  const { id: _drop, created_at: _c, updated_at: _u, ...rest } = data
  const stamp = Date.now().toString(36)
  const { error: insErr } = await supabase.from('mobs').insert({
    ...rest,
    slug: `${data.slug}-copia-${stamp}`,
    name: `${data.name} (cópia)`,
  })
  if (insErr) throw insErr
  revalidatePath('/mobs')
}

