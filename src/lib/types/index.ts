export type ItemType = 'weapon'|'helmet'|'chest'|'gloves'|'boots'|'ring'|'necklace'|'consumable'|'material'|'misc'
export type Rarity = 'common'|'uncommon'|'rare'|'epic'|'legendary'|'mythic'
export type Slot = 'weapon'|'helmet'|'chest'|'gloves'|'boots'|'ring'|'necklace'|'none'
export type SkillType = 'active'|'passive'
export type SkillTarget = 'self'|'enemy'|'enemies'|'ally'|'allies'|'aoe'
export type MobTier = 'normal'|'elite'|'boss'|'mini_boss'

export interface Item {
  id: string
  slug: string
  name: string
  description: string | null
  type: ItemType
  rarity: Rarity
  slot: Slot | null
  icon_url: string | null
  sprite_url: string | null
  stackable: boolean
  max_stack: number
  price_gold: number
  price_gems: number
  stats: Record<string, any>
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  slug: string
  name: string
  description: string | null
  type: SkillType
  target: SkillTarget
  cooldown_ms: number
  mana_cost: number
  base_damage: number
  icon_url: string | null
  animation_key: string | null
  effects: Record<string, any>
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Mob {
  id: string
  slug: string
  name: string
  description: string | null
  tier: MobTier
  hp: number
  atk: number
  def: number
  exp_reward: number
  gold_reward: number
  speed: number
  attack_cooldown_ms: number
  scale: number
  sprite_idle_url: string | null
  sprite_run_url: string | null
  sprite_attack_url: string | null
  sprite_hit_url: string | null
  sprite_death_url: string | null
  hitbox_w: number
  hitbox_h: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Zone {
  id: string
  slug: string
  name: string
  description: string | null
  bg_url: string | null
  bg_parallax: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Stage {
  id: string
  zone_id: string | null
  slug: string
  name: string
  description: string | null
  stage_number: number
  recommended_level: number
  energy_cost: number
  is_boss_stage: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Wave {
  id: string
  stage_id: string
  wave_number: number
  spawn_delay_ms: number
  created_at: string
  updated_at: string
}

export interface WaveMob {
  id: string
  wave_id: string
  mob_id: string
  quantity: number
  delay_between_ms: number
  sort_order: number
}

export interface LootTable {
  id: string
  slug: string
  name: string
  description: string | null
  mob_id: string | null
  stage_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LootTableEntry {
  id: string
  loot_table_id: string
  item_id: string
  quantity_min: number
  quantity_max: number
  weight: number
  drop_chance_percent: number | null
  guaranteed: boolean
  sort_order: number
  created_at: string
}
