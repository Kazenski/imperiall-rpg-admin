'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const PATH = '/menus-flutuantes'

export async function listFloatingMenus() {
  const { data, error } = await supabase
    .from('floating_menus')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createFloatingMenu(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase.from('floating_menus').insert({
    key: data.key,
    title: data.title,
    icon: data.icon || 'missions',
    sort_order: Number(data.sort_order) || 0,
    is_active: data.is_active === 'on',
    visible_from: data.visible_from || null,
    visible_until: data.visible_until || null,
  })
  if (error) throw error
  revalidatePath(PATH)
}

export async function updateFloatingMenu(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const { error } = await supabase
    .from('floating_menus')
    .update({
      title: data.title,
      icon: data.icon || 'missions',
      sort_order: Number(data.sort_order) || 0,
      is_active: data.is_active === 'on',
      visible_from: data.visible_from || null,
      visible_until: data.visible_until || null,
    })
    .eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}

/** Liga/desliga sem abrir o formulário (o controle mais usado). */
export async function toggleFloatingMenu(id: string, active: boolean) {
  const { error } = await supabase
    .from('floating_menus')
    .update({ is_active: active })
    .eq('id', id)
  if (error) throw error
  revalidatePath(PATH)
}
