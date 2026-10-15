-- Migration 008: efeitos visuais de skills (Lottie) + sprite de ataque dos mobs
--
-- ONDE RODAR (nesta ordem, uma vez por banco):
--   1. Banco STAGING (teste) antes de validar a feature na Preview URL.
--   2. Banco OFICIAL (producao) somente ao promover staging -> main.
-- Como rodar: Supabase Dashboard -> SQL Editor -> New query -> colar -> Run.
-- Todas as colunas usam IF NOT EXISTS: seguro rodar mais de uma vez.
-- (mobs.sprite_attack_url ja existe na producao; aqui so garante.)

-- 1. Sprite de ataque para mobs (inimigos) — o jogo troca idle->attack ao apanhar.
ALTER TABLE mobs ADD COLUMN IF NOT EXISTS sprite_attack_url text;

-- 2. Efeitos visuais para skills (usados pelo app via Lottie + fallback nativo).
-- Tipos: slash, fire, ice, heal, poison, lightning, buff, debuff, arcane, dark.
ALTER TABLE skills ADD COLUMN IF NOT EXISTS effect_type text DEFAULT 'slash';

-- Cor hexadecimal do efeito (fallback nativo quando sem Lottie).
ALTER TABLE skills ADD COLUMN IF NOT EXISTS effect_color text DEFAULT '#FF4444';

-- 1 = leve, 2 = medio, 3 = forte (tamanho/duracao do efeito).
ALTER TABLE skills ADD COLUMN IF NOT EXISTS effect_intensity int DEFAULT 1;

-- URL do .json Lottie proprio (Storage). Vazio = usa o pronto por tipo.
ALTER TABLE skills ADD COLUMN IF NOT EXISTS effect_lottie_url text;

-- 3. Indice para lookup rapido de skills com Lottie proprio.
CREATE INDEX IF NOT EXISTS idx_skills_effect_type
  ON skills(effect_type) WHERE effect_lottie_url IS NOT NULL;

-- 4. Documentacao das colunas.
COMMENT ON COLUMN mobs.sprite_attack_url IS 'Spritesheet de ataque do inimigo (URL Supabase Storage)';
COMMENT ON COLUMN skills.effect_type IS 'Tipo de efeito visual: slash, fire, ice, heal, poison, lightning, buff, debuff, arcane, dark';
COMMENT ON COLUMN skills.effect_color IS 'Cor hexadecimal do efeito (fallback sem .json)';
COMMENT ON COLUMN skills.effect_intensity IS 'Intensidade do efeito: 1=leve, 2=medio, 3=forte';
COMMENT ON COLUMN skills.effect_lottie_url IS 'URL do arquivo .json Lottie para animacao do efeito (vazio = pronto por tipo)';
