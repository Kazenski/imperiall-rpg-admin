'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
  const { error } = await supabase.from('mobs').insert(payload)
  if (error) throw error
  revalidatePath('/(admin)/mobs')
  redirect('/(admin)/mobs')
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
  const { error } = await supabase.from('mobs').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/(admin)/mobs')
  redirect('/(admin)/mobs')
}

export async function deleteMob(id: string) {
  const { error } = await supabase.from('mobs').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/(admin)/mobs')
}
