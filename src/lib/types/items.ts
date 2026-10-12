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
