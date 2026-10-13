# Ambientes: teste × produção

Como testar features e eventos sem quebrar o que os usuários usam.

## O desenho

| Ambiente | Branch | URL na Vercel | Banco Supabase |
|---|---|---|---|
| **Teste (staging)** | `staging` | Preview URL (`...-imperiall.vercel.app`) | Projeto **staging** (teste) |
| **Produção** | `main` | `imperiall-rpg-admin.vercel.app` | Projeto **oficial** |

Regra de ouro: **teste nunca toca nos dados oficiais**.

## Fluxo de trabalho

```
feature/nova-ideia  →  PR para staging  →  testa na Preview URL
        ↓ aprovado                          ↓ reprovado
   merge staging→main                   fecha o PR sem merge
   (vira produção)                      (ideia descartada, sem rastro)
```

### 1. Criar uma feature para testar

```bash
git checkout staging
git pull
git checkout -b feat/minha-ideia
# ... codifica, commita ...
git push -u origin feat/minha-ideia
```

Abra um **Pull Request para `staging`** no GitHub. A Vercel gera a Preview
URL automaticamente (contra o banco de teste).

### 2. Testar

Abra a Preview URL do PR e teste à vontade: ela lê/escreve **só no banco
de teste**. Quebrou? Ajuste na branch, push, a Preview atualiza sozinha.

### 3a. Aprovado → vira produção

Merge do PR para `staging`, depois PR/merge de `staging` para `main`.
A Vercel promove para produção sozinha.

### 3b. Reprovado → descarta sem rastro

Feche o PR **sem merge** e apague a branch:

```bash
git branch -D feat/minha-ideia
git push origin --delete feat/minha-ideia
```

Nada chega à `staging` nem à `main`. A produção nunca soube que existiu.

## Eventos temporários (ex.: Natal, Halloween)

Eventos vêm e vão — use o mesmo fluxo:

1. Crie `feat/evento-natal` a partir da `staging`.
2. Cadastre o conteúdo do evento **no banco de teste** (itens, mobs, história).
3. Teste na Preview URL.
4. Na véspera do evento: merge para `main` (conteúdo precisa existir também
   no banco oficial — cadastre lá ou exporte/importe).
5. Quando o evento acabar: `git revert` do merge **ou** desligue com o
   campo `is_active` (recomendado: sem deploy, só desmarca no admin).

Dica: prefira `is_active = false` a deletar — o próximo ano reaproveita.

## Banco de teste (projeto Supabase staging)

Criado uma vez, no dashboard do Supabase:

1. **New project** → nome `imperiall-rpg-staging` → anote URL + anon key.
2. No SQL Editor dele, rode **nesta ordem** (arquivos em
   `imperiall-rpg/supabase/`):
   1. `schema.sql`
   2. `policies.sql`
   3. `migration_002_punishments.sql`
   4. `migration_003_content.sql`
   5. `storage.sql`
   6. `dev_open_access.sql`
3. Na Vercel → projeto → **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Deixe os valores **oficiais** marcados só em **Production**.
   - Adicione os valores de **staging** marcados em **Preview**
     (e **Development**, se rodar local contra o teste).
4. **Redeploy** a `staging` para valer as novas vars.

## Sincronizar staging com a produção (refresh)

O staging nasce vazio — para testar conteúdo novo (ex.: um herói) contra os
dados reais, clone o catálogo oficial para o teste:

```powershell
$env:PROD_URL="https://agdukzabyyxzrjadjybf.supabase.co"
$env:PROD_KEY="<anon-key-oficial>"
$env:STAGING_URL="https://jamhpibptsasvftqetdm.supabase.co"
$env:STAGING_KEY="<anon-key-teste>"
node scripts/refresh-staging.cjs
```

O script (`scripts/refresh-staging.cjs`) apaga o catálogo do staging e copia
tudo do oficial **com os mesmos ids** (vínculos preservados). Não copia
perfis, punições nem progresso de jogadores. Imagens continuam apontando
para o bucket oficial (URLs públicas).

Quando fazer: antes de testar balanceamento, herói novo ou evento.

## Comandos úteis

```bash
# ver em qual branch estou
git branch --show-current

# atualizar a staging com a produção (antes de começar algo novo)
git checkout staging && git pull origin main && git push

# desfazer um merge que deu errado na staging (mantém histórico)
git revert -m 1 <hash-do-merge>
```
