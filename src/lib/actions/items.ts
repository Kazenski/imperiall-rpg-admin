'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function listItems() {
  const { data, error } = await supabase.from('items').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function createItem(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const stats: Record<string, any> = {}
  if (data.atk) stats.atk = Number(data.atk)
  if (data.def) stats.def = Number(data.def)
  if (data.hp) stats.hp = Number(data.hp)
  if (data.crit) stats.crit = Number(data.crit)
  delete (data as any).atk; delete (data as any).def; delete (data as any).hp; delete (data as any).crit

  const payload = {
    ...data,
    stats,
    stackable: data.stackable === 'on',
    is_active: data.is_active === 'on',
    max_stack: Number(data.max_stack) || 1,
    price_gold: Number(data.price_gold) || 0,
    price_gems: Number(data.price_gems) || 0,
    sort_order: Number(data.sort_order) || 0,
  }

  const { error } = await supabase.from('items').insert(payload)
  if (error) throw error
  revalidatePath('/(admin)/items')
  redirect('/(admin)/items')
}

export async function updateItem(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const stats: Record<string, any> = {}
  if (data.atk) stats.atk = Number(data.atk)
  if (data.def) stats.def = Number(data.def)
  if (data.hp) stats.hp = Number(data.hp)
  if (data.crit) stats.crit = Number(data.crit)
  delete (data as any).atk; delete (data as any).def; delete (data as any).hp; delete (data as any).crit

  const payload = {
    ...data,
    stats,
    stackable: data.stackable === 'on',
    is_active: data.is_active === 'on',
    max_stack: Number(data.max_stack) || 1,
    price_gold: Number(data.price_gold) || 0,
    price_gems: Number(data.price_gems) || 0,
    sort_order: Number(data.sort_order) || 0,
  }

  const { error } = await supabase.from('items').update(payload).eq('id', id)
  if (error) throw error
  revalidatePath('/(admin)/items')
  redirect('/(admin)/items')
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/(admin)/items')
}
