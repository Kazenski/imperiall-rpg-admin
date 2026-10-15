-- Migration 011: menus flutuantes (Missões, Dailies, Eventos)
-- Idempotente. Rodar 1x por banco: staging primeiro (validar), oficial só ao promover.
--
-- Botões flutuantes sobre a tela de Fases. Entram e saem da visão via
-- `is_active` + janela opcional (`visible_from`/`visible_until`) — eventos
-- temporários somem da visão sem serem excluídos. O app filtra no código.
-- Sem esta tabela, o app mostra só o padrão (Missões).
--
-- `key` é estável e decide o que abre no app: 'missions' = modal de missões;
-- outras chaves abrem o modal genérico até ganharem tela própria.
-- `icon`: missions, calendar, gift, star, bolt (qualquer outro = brilho).

CREATE TABLE IF NOT EXISTS floating_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  icon text NOT NULL DEFAULT 'missions',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  visible_from timestamptz,
  visible_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Leitura pública (catálogo, como zones/stages).
ALTER TABLE floating_menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "floating_menus_public_read" ON floating_menus;
CREATE POLICY "floating_menus_public_read"
  ON floating_menus FOR SELECT TO anon, authenticated
  USING (true);

-- Semente: o botão que sempre existe.
INSERT INTO floating_menus (key, title, icon, sort_order, is_active)
VALUES ('missions', 'Missões', 'missions', 0, true)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE floating_menus IS
  'Botões flutuantes da tela de Fases. is_active + janela controlam a visão; nada é excluído.';
