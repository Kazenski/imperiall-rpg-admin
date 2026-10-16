# Fluxo de deploy — STAGING FIRST

Regra do projeto: **nada vai para produção antes de ser validado no staging.**
O mesmo vale para o jogo (Flutter) e para o painel (Next.js).

## Ambientes

| Ambiente | Banco Supabase (ref) | Site | Jogo (APK) |
|---|---|---|---|
| **Staging** | `jamhpibptsasvftqetdm` | Preview do Vercel na branch `staging` | Release `dev-latest` (flavor `dev`) |
| **Produção** | `agdukzabyyxzrjadjybf` | `imperiall-rpg-admin.vercel.app` (branch `main`) | Release oficial `v*` (flavor `prod`) |

O painel mostra um selo no topo — **STAGING** (ciano) ou **PRODUÇÃO** (vermelho) —
com o banco ao qual ele está conectado. Se o selo não aparecer, a env var
`NEXT_PUBLIC_SUPABASE_URL` não bate com nenhum dos dois projetos.

## Fluxo do painel

```text
feat/nova-tarefa  ->  PR para branch `staging`  ->  Preview Vercel (banco staging)
                  ->  valida no preview + no APK dev-latest
                  ->  PR de `staging` para `main` ->  Production Vercel (banco producao)
```

Commits na `main` sem passar pelo staging quebram a regra. Evite.

## Fluxo do jogo

```text
push na main          ->  so roda CI (analyze + testes). Nenhum APK.
tag v0.x.y            ->  release oficial (flavor prod, banco producao)
workflow_dispatch     ->  variant=dev (APK de teste, banco staging)
                         variant=demo (offline, sem backend)
                         variant=prod (APK oficial, banco producao)
```

O APK de teste tem link estável: release `dev-latest`
(https://github.com/Kazenski/imperiall-rpg-game/releases/tag/dev-latest).
Ele pode conviver com o oficial no mesmo aparelho (flavor `dev` = id de app
diferente).

## Migrations

Sempre **staging primeiro**. O script `scripts/apply-migrations.ps1` recebe
`-Project staging|production` e usa a Management API com o token lido de
`.secrets.local` (gitignored). Rode no staging, teste no APK dev / preview do
painel, e só então rode na produção.

## Vercel — variáveis de ambiente

Configure no projeto Vercel do painel:

| Variável | Preview | Production |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | staging | produção |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging | produção |

Assim, todo preview (branches de feature e `staging`) fala com o staging, e só
a `main` publicada fala com produção.

Para forçar um novo preview do staging:

```bash
git checkout staging && git pull
# commite qualquer coisa ou force um push para disparar o build
git commit --allow-empty -m "chore: sync staging"
git push origin staging
```

A URL do preview muda a cada push; pegue a mais recente na aba **Deployments**
do Vercel ou na saída do build do GitHub.