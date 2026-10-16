# Imperiall RPG — Admin

Painel administrativo para gerenciar o catálogo do jogo Imperiall RPG (ARPG mobile).

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (auth + database + storage)
- **React Hook Form + Zod** (validação)
- **Lucide React** (ícones)
- **Sonner** (toasts)

## Configuração local

O painel segue a regra **staging-first**: o ambiente local aponta para o banco de
staging, e o topo da tela mostra um selo com o ambiente (STAGING / PRODUÇÃO).

```bash
npm install
cp .env.example.local .env.local
# já vem preenchido com o projeto de staging
npm run dev
```

Acesse `http://localhost:3000`.

## Deploy

Fluxo obrigatório: branch `staging` (preview Vercel + banco staging) → validar
→ `main` (produção). Veja [`docs/FLUXO-DEPLOY.md`](docs/FLUXO-DEPLOY.md).

## Deploy (Vercel)

1. Importe o repositório na [Vercel](https://vercel.com/new)
2. Adicione as environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático a cada push

## Estrutura

```
src/
  app/(admin)/     # Páginas protegidas (admin guard)
    items/         # CRUD de itens
    mobs/          # CRUD de inimigos
    skills/        # CRUD de habilidades
    stages/        # CRUD de zonas + stages
    waves/         # CRUD de waves + wave_mobs
    loot-tables/   # CRUD de loot tables + entries
  components/
    layout/        # Nav e layout do admin
  lib/
    actions/       # Server actions (CRUD)
    supabase/      # Client Supabase
    types/         # Tipos TypeScript
```

## Papel admin

Para acessar o painel, o usuário precisa ter `role = 'admin'` na tabela `profiles`.

```sql
update public.profiles set role = 'admin' where id = '<uuid>';
```
