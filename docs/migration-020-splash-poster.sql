-- Migration 020: imagem estatica apos video da capa de inicializacao (opcional)
ALTER TABLE app_ui_config
  ADD COLUMN IF NOT EXISTS capa_inicializacao_poster_url text;