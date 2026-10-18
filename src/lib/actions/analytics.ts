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

export type TableStatus = { total: number; active: number; inactive: number; hasActiveFlag: boolean }

export async function countTableStatus(table: string): Promise<TableStatus> {
  const totalRes = await supabase.from(table).select('*', { count: 'exact', head: true })
  const total = totalRes.error ? 0 : (totalRes.count || 0)
  const activeRes = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('is_active', true)
  if (activeRes.error) {
    return { total, active: total, inactive: 0, hasActiveFlag: false }
  }
  const active = activeRes.count || 0
  return { total, active, inactive: Math.max(0, total - active), hasActiveFlag: true }
}

export async function listProfilesForBi() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,display_name,level,xp,gold,gems,created_at,banned_until,active_player_character_id')
    .order('level', { ascending: false })
  if (error) throw error
  return data || []
}

export async function listPlayerCharactersForBi() {
  const { data, error } = await supabase
    .from('player_characters')
    .select('id,player_id,character_id,level,xp,created_at, characters(name)')
  if (error) throw error
  return data || []
}

export async function listEquippedInventory() {
  const { data, error } = await supabase
    .from('player_inventory')
    .select('id,player_id,item_id,quantity,is_equipped,upgrade_level, items(name,type,slot,is_active)')
    .eq('is_equipped', true)
  if (error) throw error
  return data || []
}

export async function listOnlinePlayers() {
  const { data, error } = await supabase
    .from('player_online')
    .select('player_id,last_seen_at,is_online,session_id,device_info')
    .order('last_seen_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data || []
}

export async function listTopPlayersByLevel(limit = 10) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,display_name,level,xp,gold')
    .order('level', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}