'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

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
  revalidatePath('/items')
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
  revalidatePath('/items')
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/items')
}

/** Duplica um item com novo slug (útil para criar variações). */
export async function duplicateItem(id: string) {
  const { data, error } = await supabase.from('items').select('*').eq('id', id).single()
  if (error || !data) throw error || new Error('Item não encontrado')
  const { id: _drop, created_at: _c, updated_at: _u, ...rest } = data
  const stamp = Date.now().toString(36)
  const { error: insErr } = await supabase.from('items').insert({
    ...rest,
    slug: `${data.slug}-copia-${stamp}`,
    name: `${data.name} (cópia)`,
  })
  if (insErr) throw insErr
  revalidatePath('/items')
}

