import { supabase } from '@/lib/supabase/client'

export async function slugExists(table: string, slug: string, excludeId?: string) {
  if (!slug) return false
  let query = supabase
    .from(table)
    .select('id')
    .eq('slug', slug)
    .limit(1)
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query
  if (error) throw error
  return (data?.length || 0) > 0
}