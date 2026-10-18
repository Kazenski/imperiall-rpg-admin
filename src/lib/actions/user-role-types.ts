'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function listUserRoleTypes() {
  const { data, error } = await supabase.from('user_role_types').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createUserRoleType(formData: FormData) {
  const payload = {
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    description: String(formData.get('description') || ''),
    icon_url: String(formData.get('icon_url') || ''),
    permissions: JSON.parse(String(formData.get('permissions') || '[]')),
    is_active: formData.get('is_active') === 'on',
    sort_order: Number(formData.get('sort_order') || 0),
  }
  const { error } = await supabase.from('user_role_types').insert(payload)
  if (error) throw error
  revalidatePath('/usuarios')
}

export async function deleteUserRoleType(id: string) {
  const { error } = await supabase.from('user_role_types').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/usuarios')
}