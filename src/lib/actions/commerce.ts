'use server'

import { supabase } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'
import { formStrings } from '@/lib/utils/form'
import { slugExists } from '@/lib/utils/slug'

const MERCHANTS = '/comercio/comerciantes'
const SHOPS = '/comercio/lojas'
const ITENS = '/comercio/itens'
const EVENTS = '/comercio/eventos'
const REP = '/comercio/reputacao'
const ARMAS = '/arma-espiritual/armas'

function ok(path: string) {
  revalidatePath(path)
}

function missingColumn(error: { message?: string; code?: string }) {
  const code = error?.code || ''
  const msg = (error?.message || '').toLowerCase()
  return code === '42703' || code === 'PGRST204' || msg.includes('column')
}

// ─────────────────────────────────────────────────── MERCHANTES

export async function listMerchants() {
  const { data, error } = await supabase.from('merchants').select('*').order('sort_order')
  if (error) throw error
  return data
}

function merchantPayload(data: Record<string, string>) {
  return {
    slug: data.slug,
    name: data.name,
    title: data.title || null,
    description: data.description || null,
    portrait_url: data.portrait_url || null,
    rep_min_level: Number(data.rep_min_level) || 1,
    rep_max_level: Number(data.rep_max_level) || 50,
    rep_buy_low: Number(data.rep_buy_low),
    rep_buy_high: Number(data.rep_buy_high),
    rep_sell_low: Number(data.rep_sell_low),
    rep_sell_high: Number(data.rep_sell_high),
    rep_xp_per_sale: Number(data.rep_xp_per_sale) || 10,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
}

export async function createMerchant(formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('merchants', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('merchants').insert(merchantPayload(data))
  if (error) throw error
  ok(MERCHANTS)
}

export async function updateMerchant(id: string, formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('merchants', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('merchants').update(merchantPayload(data)).eq('id', id)
  if (error) throw error
  ok(MERCHANTS)
}

export async function deleteMerchant(id: string) {
  const { error } = await supabase.from('merchants').delete().eq('id', id)
  if (error) throw error
  ok(MERCHANTS)
}

// ─────────────────────────────────────────────────── LOJAS

export async function listShops() {
  const { data, error } = await supabase
    .from('shops')
    .select('*, merchants(name, portrait_url)')
    .order('sort_order')
  if (error) throw error
  return data
}

function shopPayload(data: Record<string, string>) {
  // Horário real: dias como checkboxes -> jsonb
  let days: number[] = []
  for (let d = 1; d <= 7; d++) {
    if (data[`day_${d}`] === 'on') days.push(d)
  }
  const openingHours = {
    always: data.always_open === 'on',
    days,
    open: data.open_time || '00:00',
    close: data.close_time || '23:59',
  }
  return {
    merchant_id: data.merchant_id,
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    banner_url: data.banner_url || null,
    opening_hours: openingHours,
    requires_hero_level: data.requires_hero_level ? Number(data.requires_hero_level) : null,
    requires_zone_id: data.requires_zone_id || null,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
}

export async function createShop(formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as Record<string, string>
  if (await slugExists('shops', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('shops').insert(shopPayload(data))
  if (error) throw error
  ok(SHOPS)
}

export async function updateShop(id: string, formData: FormData) {
  const data = Object.fromEntries(formData.entries()) as Record<string, string>
  if (await slugExists('shops', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('shops').update(shopPayload(data)).eq('id', id)
  if (error) throw error
  ok(SHOPS)
}

export async function deleteShop(id: string) {
  const { error } = await supabase.from('shops').delete().eq('id', id)
  if (error) throw error
  ok(SHOPS)
}

// ─────────────────────────────────────────────────── ITENS DA LOJA

export async function listShopItems(shopId: string) {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*, items(name, slug, icon_url, rarity, type)')
    .eq('shop_id', shopId)
    .order('sort_order')
  if (error) throw error
  return data
}

export async function listAllShopItems() {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*, items(name, rarity, type), shops(name)')
    .order('sort_order')
  if (error) throw error
  return data
}

function shopItemPayload(data: Record<string, string>) {
  return {
    shop_id: data.shop_id,
    item_id: data.item_id,
    base_price: Number(data.base_price) || 0,
    sell_price: Number(data.sell_price) || 0,
    stock: data.stock === '' ? -1 : Number(data.stock),
    is_enabled: data.is_enabled === 'on',
    min_hero_level: data.min_hero_level ? Number(data.min_hero_level) : null,
    max_hero_level: data.max_hero_level ? Number(data.max_hero_level) : null,
    required_zone_id: data.required_zone_id || null,
    sort_order: Number(data.sort_order) || 0,
  }
}

export async function createShopItem(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('shop_items').insert(shopItemPayload(data))
  if (error) throw error
  ok(ITENS)
  ok(SHOPS)
}

export async function updateShopItem(id: string, formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('shop_items').update(shopItemPayload(data)).eq('id', id)
  if (error) throw error
  ok(ITENS)
  ok(SHOPS)
}

/** Edit rápido inline (balanceamento pela própria tabela). */
export async function patchShopItem(id: string, patch: Record<string, unknown>) {
  const allowed: Record<string, unknown> = {}
  if ('base_price' in patch) allowed.base_price = Number(patch.base_price) || 0
  if ('sell_price' in patch) allowed.sell_price = Number(patch.sell_price) || 0
  if ('stock' in patch) allowed.stock = Number(patch.stock)
  if ('is_enabled' in patch) allowed.is_enabled = !!patch.is_enabled
  if ('min_hero_level' in patch) allowed.min_hero_level = patch.min_hero_level ? Number(patch.min_hero_level) : null
  if ('max_hero_level' in patch) allowed.max_hero_level = patch.max_hero_level ? Number(patch.max_hero_level) : null
  if ('required_zone_id' in patch) allowed.required_zone_id = patch.required_zone_id || null
  if ('sort_order' in patch) allowed.sort_order = Number(patch.sort_order) || 0
  if (Object.keys(allowed).length === 0) return
  const { error } = await supabase.from('shop_items').update(allowed).eq('id', id)
  if (error) throw error
  ok(ITENS)
  ok(SHOPS)
}

export async function deleteShopItem(id: string) {
  const { error } = await supabase.from('shop_items').delete().eq('id', id)
  if (error) throw error
  ok(ITENS)
  ok(SHOPS)
}

/** Estoque: -1 = ilimitado. */
export async function restockShopItem(id: string, quantity: number) {
  const { data, error } = await supabase
    .from('shop_items')
    .select('stock, stock_sold')
    .eq('id', id)
    .single()
  if (error) throw error
  const current = data?.stock ?? -1
  const next = current === -1 ? -1 : Math.max(0, current + quantity)
  const { error: e2 } = await supabase
    .from('shop_items')
    .update({ stock: next, stock_sold: 0 })
    .eq('id', id)
  if (e2) throw e2
  ok(ITENS)
  ok(SHOPS)
}

// ─────────────────────────────────────────────────── EVENTOS

export async function listCommerceEvents() {
  const { data, error } = await supabase
    .from('commerce_events')
    .select('*, merchants(name)')
    .order('starts_at', { ascending: false })
  if (error) throw error
  return data
}

function eventPayload(data: Record<string, string>) {
  return {
    slug: data.slug,
    name: data.name,
    description: data.description || null,
    banner_url: data.banner_url || null,
    discount_percent: Number(data.discount_percent) || 0,
    starts_at: data.starts_at ? new Date(data.starts_at).toISOString() : new Date().toISOString(),
    ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : new Date(Date.now() + 86400000).toISOString(),
    merchant_id: data.merchant_id || null,
    is_active: data.is_active === 'on',
  }
}

export async function createCommerceEvent(formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('commerce_events', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('commerce_events').insert(eventPayload(data))
  if (error) throw error
  ok(EVENTS)
}

export async function updateCommerceEvent(id: string, formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('commerce_events', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('commerce_events').update(eventPayload(data)).eq('id', id)
  if (error) throw error
  ok(EVENTS)
}

export async function deleteCommerceEvent(id: string) {
  const { error } = await supabase.from('commerce_events').delete().eq('id', id)
  if (error) throw error
  ok(EVENTS)
}

export async function listEventItems(eventId: string) {
  const { data, error } = await supabase
    .from('commerce_event_items')
    .select('*, items(name, rarity, icon_url), shops(name)')
    .eq('event_id', eventId)
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createEventItem(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('commerce_event_items').insert({
    event_id: data.event_id,
    item_id: data.item_id,
    shop_id: data.shop_id || null,
    base_price: Number(data.base_price) || 100,
    sell_price: Number(data.sell_price) || 50,
    stock: data.stock === '' ? -1 : Number(data.stock),
    is_enabled: data.is_enabled === 'on',
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  ok(EVENTS)
}

export async function updateEventItem(id: string, formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase
    .from('commerce_event_items')
    .update({
      item_id: data.item_id,
      shop_id: data.shop_id || null,
      base_price: Number(data.base_price) || 0,
      sell_price: Number(data.sell_price) || 0,
      stock: data.stock === '' ? -1 : Number(data.stock),
      is_enabled: data.is_enabled === 'on',
      sort_order: Number(data.sort_order) || 0,
    })
    .eq('id', id)
  if (error) throw error
  ok(EVENTS)
}

export async function deleteEventItem(id: string) {
  const { error } = await supabase.from('commerce_event_items').delete().eq('id', id)
  if (error) throw error
  ok(EVENTS)
}

// ─────────────────────────────────────────────────── REPUTAÇÃO (leitura)

export async function listReputation() {
  const { data, error } = await supabase
    .from('player_merchant_reputation')
    .select('*, merchants(name), profiles(username)')
    .order('reputation_level', { ascending: false })
  if (error) throw error
  return data
}

export async function listCommerceTransactions() {
  const { data, error } = await supabase
    .from('commerce_transactions')
    .select('*, items(name), merchants(name), shops(name)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────────── ARMA ESPIRITUAL

export async function listSpiritWeapons() {
  const { data, error } = await supabase.from('spirit_weapons').select('*').order('sort_order')
  if (error) throw error
  return data
}

function spiritPayload(data: Record<string, string>) {
  return {
    slug: data.slug,
    name: data.name,
    class_name: data.class_name || null,
    description: data.description || null,
    image_url: data.image_url || null,
    fire_effect: data.fire_effect === 'on',
    base_damage: Number(data.base_damage) || 0,
    special_damage: Number(data.special_damage) || 0,
    xp_rate_percent: Number(data.xp_rate_percent) || 10,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  }
}

export async function createSpiritWeapon(formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('spirit_weapons', data.slug)) throw new Error('Slug já existe')
  const { error } = await supabase.from('spirit_weapons').insert(spiritPayload(data))
  if (error) throw error
  ok(ARMAS)
}

export async function updateSpiritWeapon(id: string, formData: FormData) {
  const data = formStrings(formData)
  if (await slugExists('spirit_weapons', data.slug, id)) throw new Error('Slug já existe')
  const { error } = await supabase.from('spirit_weapons').update(spiritPayload(data)).eq('id', id)
  if (error) throw error
  ok(ARMAS)
}

export async function deleteSpiritWeapon(id: string) {
  const { error } = await supabase.from('spirit_weapons').delete().eq('id', id)
  if (error) throw error
  ok(ARMAS)
}

// Habilidades da arma
export async function listSpiritSkills(weaponId: string) {
  const { data, error } = await supabase
    .from('spirit_weapon_skills')
    .select('*')
    .eq('spirit_weapon_id', weaponId)
    .order('unlock_level')
  if (error) throw error
  return data
}

export async function createSpiritSkill(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('spirit_weapon_skills').insert({
    spirit_weapon_id: data.spirit_weapon_id,
    name: data.name,
    description: data.description || null,
    icon_url: data.icon_url || null,
    effect_lottie_url: data.effect_lottie_url || null,
    effect_type: data.effect_type || 'slash',
    effect_color: data.effect_color || '#FFB300',
    unlock_level: Number(data.unlock_level) || 1,
    echo_cost: Number(data.echo_cost) || 0,
    base_damage: Number(data.base_damage) || 0,
    damage_per_level: Number(data.damage_per_level) || 0,
    effect_intensity_per_level: Number(data.effect_intensity_per_level) || 0.1,
    is_active: data.is_active === 'on',
    sort_order: Number(data.sort_order) || 0,
  })
  if (error) throw error
  ok(ARMAS)
}

export async function updateSpiritSkill(id: string, formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase
    .from('spirit_weapon_skills')
    .update({
      name: data.name,
      description: data.description || null,
      icon_url: data.icon_url || null,
      effect_lottie_url: data.effect_lottie_url || null,
      effect_type: data.effect_type || 'slash',
      effect_color: data.effect_color || '#FFB300',
      unlock_level: Number(data.unlock_level) || 1,
      echo_cost: Number(data.echo_cost) || 0,
      base_damage: Number(data.base_damage) || 0,
      damage_per_level: Number(data.damage_per_level) || 0,
      effect_intensity_per_level: Number(data.effect_intensity_per_level) || 0.1,
      is_active: data.is_active === 'on',
      sort_order: Number(data.sort_order) || 0,
    })
    .eq('id', id)
  if (error) throw error
  ok(ARMAS)
}

export async function deleteSpiritSkill(id: string) {
  const { error } = await supabase.from('spirit_weapon_skills').delete().eq('id', id)
  if (error) throw error
  ok(ARMAS)
}

// Dieta
export async function listSpiritDiet(weaponId: string) {
  const { data, error } = await supabase
    .from('spirit_weapon_diet')
    .select('*, items(name, rarity)')
    .eq('spirit_weapon_id', weaponId)
    .order('xp_per_unit', { ascending: false })
  if (error) throw error
  return data
}

export async function createSpiritDiet(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase.from('spirit_weapon_diet').insert({
    spirit_weapon_id: data.spirit_weapon_id,
    item_id: data.item_id,
    xp_per_unit: Number(data.xp_per_unit) || 10,
  })
  if (error) throw error
  ok(ARMAS)
}

export async function updateSpiritDiet(id: string, formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase
    .from('spirit_weapon_diet')
    .update({ item_id: data.item_id, xp_per_unit: Number(data.xp_per_unit) || 0 })
    .eq('id', id)
  if (error) throw error
  ok(ARMAS)
}

export async function deleteSpiritDiet(id: string) {
  const { error } = await supabase.from('spirit_weapon_diet').delete().eq('id', id)
  if (error) throw error
  ok(ARMAS)
}

// Progressão por nível
export async function listSpiritBonuses(weaponId: string) {
  const { data, error } = await supabase
    .from('spirit_level_bonuses')
    .select('*')
    .eq('spirit_weapon_id', weaponId)
    .order('level')
  if (error) throw error
  return data
}

export async function upsertSpiritBonus(formData: FormData) {
  const data = formStrings(formData)
  const payload = {
    spirit_weapon_id: data.spirit_weapon_id,
    level: Number(data.level) || 1,
    damage_base_bonus: Number(data.damage_base_bonus) || 0,
    damage_special_bonus: Number(data.damage_special_bonus) || 0,
    xp_to_next: Number(data.xp_to_next) || 100,
  }
  const { error } = await supabase
    .from('spirit_level_bonuses')
    .upsert(payload, { onConflict: 'spirit_weapon_id,level' })
  if (error) throw error
  ok(ARMAS)
}

export async function deleteSpiritBonus(id: string) {
  const { error } = await supabase.from('spirit_level_bonuses').delete().eq('id', id)
  if (error) throw error
  ok(ARMAS)
}

// Tabela de XP global do espírito
export async function listSpiritXpTable() {
  const { data, error } = await supabase.from('spirit_xp_table').select('*').order('level')
  if (error) throw error
  return data
}

export async function upsertSpiritXpRow(formData: FormData) {
  const data = formStrings(formData)
  const { error } = await supabase
    .from('spirit_xp_table')
    .upsert(
      { level: Number(data.level) || 1, xp_required: Number(data.xp_required) || 0 },
      { onConflict: 'level' },
    )
  if (error) throw error
  ok(ARMAS)
}

export async function deleteSpiritXpRow(level: number) {
  const { error } = await supabase.from('spirit_xp_table').delete().eq('level', level)
  if (error) throw error
  ok(ARMAS)
}

export { missingColumn }