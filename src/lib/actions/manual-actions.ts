'use server'

import { supabase } from '@/lib/supabase/client'

export async function listManualActions() {
  const { data, error } = await supabase.from('manual_actions').select('id, name, icon_url, is_active').eq('is_active', true).order('name')
  if (error) throw error
  return data || []
}