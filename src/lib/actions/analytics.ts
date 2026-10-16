'use server'

import { supabase } from '@/lib/supabase/client'

export type AnalyticsEvent = {
  id: string
  event_type: string
  entity_type: string | null
  entity_id: string | null
  value: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  player_id?: string | null
}

export async function listAnalyticsEvents(sinceIso: string, limit = 5000): Promise<AnalyticsEvent[]> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []) as AnalyticsEvent[]
}

export async function countTable(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) return 0
  return count || 0
}