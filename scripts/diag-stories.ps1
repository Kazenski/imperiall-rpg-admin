<#
.SYNOPSIS
  Diagnostico das historias: o que existe de fato em cada tabela, se as colunas
  novas (migration 013) estao aplicadas e se as policies deixam o anon ler.

.EXAMPLE
  .\scripts\diag-stories.ps1 -Project staging
  .\scripts\diag-stories.ps1 -Project production
#>
[CmdletBinding()]
param(
  [ValidateSet('staging', 'production')]
  [string]$Project = 'staging'
)

$ErrorActionPreference = 'Stop'

$PROJECTS = @{
  staging    = 'jamhpibptsasvftqetdm'
  production = 'agdukzabyyxzrjadjybf'
}
$ref = $PROJECTS[$Project]

$secrets = Join-Path (Split-Path $PSScriptRoot -Parent) '.secrets.local'
if (-not (Test-Path $secrets)) { throw "Faltou .secrets.local com SUPABASE_ACCESS_TOKEN" }
$line = Get-Content $secrets | Where-Object { $_ -match 'SUPABASE_ACCESS_TOKEN' } | Select-Object -First 1
$token = ($line -split '=', 2)[1].Trim().Trim('"').Trim("'")
if (-not $token) { throw "Token vazio em .secrets.local" }

function Q([string]$sql) {
  $headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
  $body = @{ query = $sql } | ConvertTo-Json -Compress
  $res = Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Headers $headers -Body $body
  if ($res.code) { throw "SQL falhou: $($res.message)" }
  return $res
}

function T([string]$title) { Write-Host "`n=== $title ===" -ForegroundColor Cyan }

T "PROJETO: $Project ($ref)"

T 'HISTORIAS'
Q @'
select id, slug, name, is_active, sort_order, lore_reward,
       (select count(*) from story_scenes s where s.story_id = st.id) as cenas
from stories st order by sort_order;
'@ | Format-Table -AutoSize | Out-String | Write-Host

T 'CENAS (com contagem de falas)'
Q @'
select s.story_id, s.id as scene_id, s.order_index, s.title,
       (select count(*) from story_lines l where l.scene_id = s.id) as falas,
       (select count(*) from story_lines l
          where l.scene_id = s.id
            and l.coalesce((select c from (select jsonb_array_length(coalesce('[]'::jsonb,'[]')) c) x), 0) >= 0
       ) as falas_check
from story_scenes s order by s.story_id, s.order_index;
'@ | Format-Table -AutoSize | Out-String | Write-Host

T 'FALAS por cena (primeiras 40)'
Q @'
select s.story_id, l.scene_id, l.order_index, l.speaker_type, l.only_via_choice,
       left(coalesce(l.text,''), 40) as texto
from story_lines l join story_scenes s on s.id = l.scene_id
order by s.story_id, l.order_index
limit 40;
'@ | Format-Table -AutoSize | Out-String | Write-Host

T 'COLUNAS (existem as da migration 013?)'
Q @'
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('stories','story_scenes','story_lines','story_choices')
  and column_name in ('lore_reward','unlock_zone_id','next_line_id','only_via_choice','starter')
order by table_name, column_name;
'@ | Format-Table -AutoSize | Out-String | Write-Host

T 'POLICIES (anon consegue ler?)'
Q @'
select tablename, policyname, roles::text, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('stories','story_scenes','story_lines','story_choices')
order by tablename, policyname;
'@ | Format-Table -AutoSize | Out-String | Write-Host

T 'RLS ATIVO?'
Q @'
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('stories','story_scenes','story_lines','story_choices')
order by relname;
'@ | Format-Table -AutoSize | Out-String | Write-Host

T 'GRANTS para anon'
Q @'
select table_name, privilege_type
from information_schema.role_table_grants
where grantee in ('anon','authenticated')
  and table_schema = 'public'
  and table_name in ('stories','story_scenes','story_lines','story_choices')
order by table_name, privilege_type;
'@ | Format-Table -AutoSize | Out-String | Write-Host