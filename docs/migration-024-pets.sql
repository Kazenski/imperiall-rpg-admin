-- MIGRATION 024: Pets

CREATE TABLE IF NOT EXISTS pet_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    class_name TEXT,
    description TEXT,
    image_url TEXT,
    image_attack_url TEXT,
    rarity TEXT DEFAULT 'common',
    base_hp INT DEFAULT 50,
    base_mp INT DEFAULT 20,
    base_atk INT DEFAULT 5,
    base_def INT DEFAULT 3,
    base_speed INT DEFAULT 100,
    companion_atk_bonus INT DEFAULT 0,
    companion_def_bonus INT DEFAULT 0,
    companion_hp_bonus INT DEFAULT 0,
    companion_mp_bonus INT DEFAULT 0,
    companion_speed_bonus INT DEFAULT 0,
    xp_share_percent INT DEFAULT 10,
    special_effect TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pet_template_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_template_id UUID REFERENCES pet_templates(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    unlock_level INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pet_template_id, skill_id)
);

CREATE TABLE IF NOT EXISTS pet_template_diet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_template_id UUID REFERENCES pet_templates(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    xp_per_unit INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pet_template_id, item_id)
);

CREATE TABLE IF NOT EXISTS pet_incubation_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_template_id UUID REFERENCES pet_templates(id) ON DELETE CASCADE UNIQUE,
    incubation_hours INT DEFAULT 24,
    cooldown_hours INT DEFAULT 48,
    required_item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    required_item_qty INT DEFAULT 1,
    success_rate_percent INT DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pet_template_id UUID REFERENCES pet_templates(id) ON DELETE CASCADE,
    nickname TEXT,
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    is_hatched BOOLEAN DEFAULT true,
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    last_xp_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, pet_template_id)
);

CREATE INDEX IF NOT EXISTS idx_pet_templates_active ON pet_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_pet_templates_rarity ON pet_templates(rarity);
CREATE INDEX IF NOT EXISTS idx_pet_skills_template ON pet_template_skills(pet_template_id);
CREATE INDEX IF NOT EXISTS idx_pet_diet_template ON pet_template_diet(pet_template_id);
CREATE INDEX IF NOT EXISTS idx_player_pets_player ON player_pets(player_id);
CREATE INDEX IF NOT EXISTS idx_player_pets_active ON player_pets(is_active);

