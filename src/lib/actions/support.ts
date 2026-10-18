'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

const SUPORTE = '/suporte'

function ok(path: string) {
  revalidatePath(path)
}

// ─────────────────────────────────────────────────── CATEGORIAS

export async function listSupportCategories() {
  const { data, error } = await supabase
    .from('support_categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createSupportCategory(formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as Record<string, string>
  const { error } = await supabase.from('support_categories').insert({
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    sla_minutes: Number(data.sla_minutes) || 60,
    color: data.color || '#f59e0b',
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  ok(SUPORTE)
}

export async function updateSupportCategory(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as Record<string, string>
  const { error } = await supabase.from('support_categories').update({
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    sla_minutes: Number(data.sla_minutes) || 60,
    color: data.color || '#f59e0b',
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }).eq('id', id)
  if (error) throw error
  ok(SUPORTE)
}

export async function deleteSupportCategory(id: string) {
  const { error } = await supabase.from('support_categories').delete().eq('id', id)
  if (error) throw error
  ok(SUPORTE)
}

// ─────────────────────────────────────────────────── GAME MASTERS

export async function listGameMasters() {
  const { data, error } = await supabase
    .from('game_masters')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function createGameMaster(formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as Record<string, string>
  const { error } = await supabase.from('game_masters').insert({
    player_id: data.player_id || null,
    name: data.name,
    email: data.email,
    discord: data.discord || null,
    specialty: data.specialty || null,
    is_active: data.is_active === 'on',
    max_tickets: Number(data.max_tickets) || 10,
  })
  if (error) throw error
  ok(SUPORTE)
}

export async function updateGameMaster(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as Record<string, string>
  const { error } = await supabase.from('game_masters').update({
    player_id: data.player_id || null,
    name: data.name,
    email: data.email,
    discord: data.discord || null,
    specialty: data.specialty || null,
    is_active: data.is_active === 'on',
    max_tickets: Number(data.max_tickets) || 10,
  }).eq('id', id)
  if (error) throw error
  ok(SUPORTE)
}

export async function deleteGameMaster(id: string) {
  const { error } = await supabase.from('game_masters').delete().eq('id', id)
  if (error) throw error
  ok(SUPORTE)
}

// ─────────────────────────────────────────────────── CHAMADOS

export async function listSupportTickets() {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*, support_categories(*), game_masters(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createSupportTicket(formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as Record<string, string>
  const { error } = await supabase.from('support_tickets').insert({
    ticket_number: data.ticket_number,
    player_id: data.player_id,
    category_id: data.category_id || null,
    gm_id: data.gm_id || null,
    subject: data.subject,
    description: data.description,
    status: data.status || 'open',
    priority: data.priority || 'normal',
    sla_minutes: data.sla_minutes ? Number(data.sla_minutes) : null,
    sla_expires_at: data.sla_expires_at || null,
  })
  if (error) throw error
  ok(SUPORTE)
}

export async function updateSupportTicket(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as Record<string, string>
  const updates: Record<string, any> = {}
  if (data.status) updates.status = data.status
  if (data.priority) updates.priority = data.priority
  if (data.gm_id) updates.gm_id = data.gm_id || null
  if (data.category_id) updates.category_id = data.category_id || null
  if (data.sla_minutes) updates.sla_minutes = Number(data.sla_minutes)
  if (data.subject) updates.subject = data.subject
  if (data.description) updates.description = data.description
  if (data.sla_expires_at) updates.sla_expires_at = data.sla_expires_at
  updates.updated_at = new Date().toISOString()

  const { error } = await supabase.from('support_tickets').update(updates).eq('id', id)
  if (error) throw error
  ok(SUPORTE)
}

export async function deleteSupportTicket(id: string) {
  const { error } = await supabase.from('support_tickets').delete().eq('id', id)
  if (error) throw error
  ok(SUPORTE)
}

// ─────────────────────────────────────────────────── MENSAGENS

export async function listSupportMessages(ticketId: string) {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createSupportMessage(formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as Record<string, string>
  const { error } = await supabase.from('support_messages').insert({
    ticket_id: data.ticket_id,
    sender_type: data.sender_type,
    sender_id: data.sender_id || null,
    message: data.message,
    is_internal: data.is_internal === 'on',
    email_sent: data.email_sent === 'on',
  })
  if (error) throw error
  ok(SUPORTE)
}

export async function deleteSupportMessage(id: string) {
  const { error } = await supabase.from('support_messages').delete().eq('id', id)
  if (error) throw error
  ok(SUPORTE)
}

// ─────────────────────────────────────────────────── JOGADORES ONLINE

export async function listOnlinePlayers() {
  const { data, error } = await supabase
    .from('player_online')
    .select('*')
    .eq('is_online', true)
    .order('last_seen_at', { ascending: false })
  if (error) throw error
  return data
}

export async function setPlayerOnline(playerId: string, sessionId: string, deviceInfo: string) {
  const { error } = await supabase.from('player_online').upsert({
    player_id: playerId,
    last_seen_at: new Date().toISOString(),
    is_online: true,
    session_id: sessionId,
    device_info: deviceInfo,
  }, { onConflict: 'player_id' })
  if (error) throw error
}

export async function setPlayerOffline(playerId: string) {
  const { error } = await supabase.from('player_online').update({
    is_online: false,
    last_seen_at: new Date().toISOString(),
  }).eq('player_id', playerId)
  if (error) throw error
}
