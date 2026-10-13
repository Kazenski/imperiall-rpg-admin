/**
 * Sugestões de equilíbrio para o preenchimento automático dos formulários.
 *
 * As fórmulas são as mesmas documentadas na página Guia, para que o valor
 * sugerido seja sempre coerente com a progressão do jogo:
 *   jogador: HP = 100 + 20×nível | ATK = 10 + 3×nível | DEF = 5 + 1.5×nível
 *   XP p/ nível: 100 × nível^1.5
 */

export const RARITY_MULT: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 4,
  epic: 8,
  legendary: 16,
  mythic: 32,
};

export const TIER_MULT: Record<string, number> = {
  normal: 1,
  elite: 3,
  mini_boss: 6,
  boss: 12,
};

export interface MobSuggestion {
  hp: number;
  atk: number;
  def: number;
  exp_reward: number;
  gold_reward: number;
  attack_cooldown_ms: number;
  scale: number;
}

/** Sugere stats de inimigo para um nível de jogador alvo. */
export function suggestMobStats(tier: string, level: number): MobSuggestion {
  const m = TIER_MULT[tier] ?? 1;
  const l = Math.max(1, Math.round(level));
  return {
    hp: Math.round((50 + 30 * l) * m),
    atk: Math.round((4 + 2 * l) * Math.pow(m, 0.7)),
    def: Math.round((1 + 1 * l) * Math.pow(m, 0.5)),
    exp_reward: Math.round((10 + 8 * l) * m),
    gold_reward: Math.round((5 + 3 * l) * m),
    attack_cooldown_ms: tier === 'boss' ? 1500 : tier === 'normal' ? 1200 : 1000,
    scale: tier === 'boss' ? 2 : tier === 'elite' ? 1.5 : tier === 'mini_boss' ? 1.75 : 1,
  };
}

export interface ItemSuggestion {
  atk: number;
  def: number;
  hp: number;
  crit: number;
  price_gold: number;
}

/**
 * Sugere stats de item para um nível de jogador alvo.
 * Armas ganham ATK, armaduras ganham DEF/HP, consumíveis viram cura (HP).
 */
export function suggestItemStats(
  rarity: string,
  type: string,
  level: number,
): ItemSuggestion {
  const m = RARITY_MULT[rarity] ?? 1;
  const l = Math.max(1, Math.round(level));
  const out: ItemSuggestion = { atk: 0, def: 0, hp: 0, crit: 0, price_gold: Math.round((20 + 15 * l) * m) };

  if (type === 'weapon') {
    out.atk = Math.round((5 + 2 * l) * m);
    out.crit = m >= 4 ? 5 : 0;
  } else if (type === 'helmet' || type === 'chest' || type === 'gloves' || type === 'boots') {
    out.def = Math.round((3 + 1.5 * l) * m);
    if (type === 'chest' || type === 'helmet') out.hp = Math.round((10 + 5 * l) * m);
  } else if (type === 'ring' || type === 'necklace') {
    out.atk = Math.round((2 + 1 * l) * m);
    out.crit = Math.round(2 * Math.log2(m + 1));
  } else if (type === 'consumable') {
    out.hp = Math.round(30 + 20 * l); // valor de cura
    out.price_gold = Math.round((10 + 5 * l) * m);
  }
  return out;
}

export interface SkillSuggestion {
  cooldown_ms: number;
  mana_cost: number;
  base_damage: number;
}

/** Sugere números de skill para um nível de jogador alvo. */
export function suggestSkillStats(level: number): SkillSuggestion {
  const l = Math.max(1, Math.round(level));
  return {
    cooldown_ms: 5000,
    mana_cost: Math.round(10 + 2 * l),
    base_damage: Math.round(30 + 12 * l),
  };
}
