-- Migration 016: falas "somente via opção" (ocultas do fluxo automático)
-- Idempotente. Rodar 1x por banco: staging primeiro (validar), oficial só ao promover.
--
-- Linhas marcadas como only_via_choice = true NÃO entram na leitura sequencial
-- da cena no app; só serão exibidas se o jogador escolher uma opção que aponte
-- para essa fala (next_line_id). Útil para ramos/revelações que não devem
-- passar no fluxo normal.

ALTER TABLE story_lines
  ADD COLUMN IF NOT EXISTS only_via_choice boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN story_lines.only_via_choice IS
  'Se true, a fala nao aparece no fluxo automatico da cena; so via opcao (next_line_id).';