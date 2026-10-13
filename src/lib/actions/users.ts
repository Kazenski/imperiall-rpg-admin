'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function listUsers(search = '') {
  let q = supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, role, xp, level, muted_until, banned_until, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (search.trim()) {
    const s = `%${search.trim()}%`
    q = q.or(`username.ilike.${s},display_name.ilike.${s}`)
  }
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function setUserRole(id: string, role: 'user' | 'admin') {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) throw error
  revalidatePath('/usuarios')
}

export async function listPunishments(playerId: string) {
  const { data, error } = await supabase
    .from('player_punishments')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** Aplica mute ou ban: grava no histórico + marca o perfil. */
export async function punishUser(playerId: string, formData: FormData) {
  const type = formData.get('type') as string // 'mute' | 'ban' | 'warning'
  const reason = (formData.get('reason') as string) || null
  const minutes = Number(formData.get('minutes') || 0)
  const expires_at = minutes > 0 ? new Date(Date.now() + minutes * 60_000).toISOString() : null

  const { error: insErr } = await supabase.from('player_punishments').insert({
    player_id: playerId,
    type,
    reason,
    expires_at,
  })
  if (insErr) throw insErr

  if (type === 'mute') {
    const { error } = await supabase.from('profiles').update({ muted_until: expires_at }).eq('id', playerId)
    if (error) throw error
  }
  if (type === 'ban') {
    const { error } = await supabase.from('profiles').update({ banned_until: expires_at }).eq('id', playerId)
    if (error) throw error
  }
  revalidatePath('/usuarios')
}

/** Remove punição ativa (limpa o marcador no perfil + marca revogada). */
export async function revokePunishment(punishmentId: string, playerId: string, type: string) {
  const { error: upErr } = await supabase
    .from('player_punishments')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', punishmentId)
  if (upErr) throw upErr

  if (type === 'mute') {
    await supabase.from('profiles').update({ muted_until: null }).eq('id', playerId)
  }
  if (type === 'ban') {
    await supabase.from('profiles').update({ banned_until: null }).eq('id', playerId)
  }
  revalidatePath('/usuarios')
}
