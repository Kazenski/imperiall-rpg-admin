'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function listWaves() {
  const { data, error } = await supabase.from('waves').select('*, stages(name)').order('stage_id')
  if (error) throw error
  return data
}

export async function listWaveMobs(waveId: string) {
  const { data, error } = await supabase.from('wave_mobs').select('*, mobs(name)').eq('wave_id', waveId).order('sort_order')
  if (error) throw error
  return data
}

export async function createWave(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload = {
    stage_id: data.stage_id,
    wave_number: Number(data.wave_number) || 1,
    spawn_delay_ms: Number(data.spawn_delay_ms) || 500,
  }
  const { error } = await supabase.from('waves').insert(payload)
  if (error) throw error
  revalidatePath('/(admin)/waves')
  redirect('/(admin)/waves')
}

export async function updateWave(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload = {
    stage_id: data.stage_id,
    wave_number: Number(data.wave_number) || 1,
    spawn_delay_ms: Number(data.spawn_delay_ms) || 500,
  }
  const { error } = await supabase.from('waves').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/(admin)/waves')
  redirect('/(admin)/waves')
}

export async function deleteWave(id: string) {
  const { error } = await supabase.from('waves').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/(admin)/waves')
}

export async function addWaveMob(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const payload = {
    wave_id: data.wave_id,
    mob_id: data.mob_id,
    quantity: Number(data.quantity) || 1,
    delay_between_ms: Number(data.delay_between_ms) || 250,
    sort_order: Number(data.sort_order) || 0,
  }
  const { error } = await supabase.from('wave_mobs').insert(payload)
  if (error) throw error
  revalidatePath('/(admin)/waves')
}

export async function deleteWaveMob(id: string) {
  const { error } = await supabase.from('wave_mobs').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/(admin)/waves')
}
