'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function createItem(data: any) {
  const { error } = await supabase.from('items').insert(data)
  if (error) throw error
  revalidatePath('/(admin)/items')
}

export async function updateItem(id: string, data: any) {
  const { error } = await supabase.from('items').update(data).eq('id', id)
  if (error) throw error
  revalidatePath('/(admin)/items')
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/(admin)/items')
}
