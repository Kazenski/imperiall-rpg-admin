-- MIGRATION 025: Vassalos e Ações Manuais (Life Skills)

CREATE TABLE IF NOT EXISTS manual_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    cooldown_seconds INT DEFAULT 3600,
    energy_cost INT DEFAULT 10,
    base_result_qty INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vassals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    class_name TEXT,
    description TEXT,
    image_url TEXT,
    image_attack_url TEXT,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    price_real NUMERIC(10,2) DEFAULT 0,
    price_gold INT DEFAULT 0,
    is_for_sale BOOLEAN DEFAULT false,
    base_energy INT DEFAULT 100,
    base_speed INT DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vassal_affinities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vassal_id UUID REFERENCES vassals(id) ON DELETE CASCADE,
    action_id UUID REFERENCES manual_actions(id) ON DELETE CASCADE,
    affinity_type TEXT DEFAULT 'ok' CHECK (affinity_type IN ('ideal', 'ok', 'improper')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vassal_id, action_id)
);

CREATE TABLE IF NOT EXISTS action_vassal_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_id UUID REFERENCES manual_actions(id) ON DELETE CASCADE,
    vassal_id UUID REFERENCES vassals(id) ON DELETE CASCADE,
    completion_seconds INT DEFAULT 300,
    energy_cost INT DEFAULT 10,
    result_multiplier NUMERIC(4,2) DEFAULT 1.0,
    result_qty INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(action_id, vassal_id)
);

CREATE TABLE IF NOT EXISTS vassal_level_rules (
    level INT PRIMARY KEY,
    xp_required INT NOT NULL DEFAULT 0,
    xp_per_action INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS natural_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    rarity TEXT DEFAULT 'common',
    base_qty INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vassals_active ON vassals(is_active);
CREATE INDEX IF NOT EXISTS idx_vassals_for_sale ON vassals(is_for_sale);
CREATE INDEX IF NOT EXISTS idx_vassal_affinities_vassal ON vassal_affinities(vassal_id);
CREATE INDEX IF NOT EXISTS idx_vassal_affinities_action ON vassal_affinities(action_id);
CREATE INDEX IF NOT EXISTS idx_manual_actions_active ON manual_actions(is_active);
CREATE INDEX IF NOT EXISTS idx_action_interactions_action ON action_vassal_interactions(action_id);
CREATE INDEX IF NOT EXISTS idx_action_interactions_vassal ON action_vassal_interactions(vassal_id);
CREATE INDEX IF NOT EXISTS idx_natural_resources_active ON natural_resources(is_active);

