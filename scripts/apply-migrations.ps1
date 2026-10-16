<#
.SYNOPSIS
  Aplica as migrations do Imperiall RPG nos projetos Supabase (staging e/ou producao).

.DESCRIPTION
  Usa a Management API do Supabase. Precisa de um Personal Access Token
  (https://supabase.com/dashboard/account/tokens) e do project ref.

  O token e lido de:
    1) variavel de entorno SUPABASE_ACCESS_TOKEN
    2) arquivo .secrets.local (gitignored) na raiz do repo
    3) prompt interativo (Get-Credential-like) — entered hidden

.EXAMPLE
  .\apply-migrations.ps1
  (aplica em staging + producao)

.EXAMPLE
  .\apply-migrations.ps1 -Environment staging
  (aplica so no teste)

.EXAMPLE
  .\apply-migrations.ps1 -Environment production -DryRun
  (mostra o SQL, nao executa)
#>
[CmdletBinding()]
param(
  [ValidateSet('staging','production','both')]
  [string]$Environment = 'both',

  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$PROJECTS = @{
  staging    = 'jamhpibptsasvftqetdm'
  production = 'agdukzabyyxzrjadjybf'
}

# ---------------------------------------------------------------- token
function Get-SupabaseToken {
  if ($env:SUPABASE_ACCESS_TOKEN) { return $env:SUPABASE_ACCESS_TOKEN }

  $secrets = Join-Path (Split-Path $PSScriptRoot -Parent) '.secrets.local'
  if (Test-Path $secrets) {
    $line = Get-Content $secrets | Where-Object { $_ -match 'SUPABASE_ACCESS_TOKEN' } | Select-Object -First 1
    if ($line) {
      $token = ($line -split '=', 2)[1].Trim().Trim('"').Trim("'")
      if ($token) { return $token }
    }
  }

  $token = Read-Host -Prompt 'Cole seu Supabase Access Token (sbp_...)' -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
  return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
}

# ---------------------------------------------------------------- helpers
function Invoke-Sql {
  param(
    [Parameter(Mandatory)][string]$Token,
    [Parameter(Mandatory)][string]$ProjectRef,
    [Parameter(Mandatory)][string]$Sql
  )

  $headers = @{
    'Authorization' = "Bearer $Token"
    'Content-Type'  = 'application/json'
  }

  $body = @{ query = $Sql } | ConvertTo-Json -Compress
  $url   = "https://api.supabase.com/v1/projects/$ProjectRef/database/query"

  try {
    $resp = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    return @{ ok = $true; result = $resp }
  } catch {
    return @{ ok = $false; error = $_.Exception.Message }
  }
}

function Test-ProjectConnection {
  param([string]$Token, [string]$ProjectRef)
  $r = Invoke-Sql -Token $Token -ProjectRef $ProjectRef -Sql 'SELECT 1 as ping;'
  if (-not $r.ok) {
    Write-Host "  ! Sem acesso ao projeto ${ProjectRef}: $($r.error)" -ForegroundColor Red
    return $false
  }
  return $true
}

# ---------------------------------------------------------------- main
$sqlPath = Join-Path (Split-Path $PSScriptRoot -Parent) 'docs\ALL-MIGRATIONS.sql'
if (-not (Test-Path $sqlPath)) {
  throw "Arquivo nao encontrado: $sqlPath"
}
$sql = Get-Content $sqlPath -Raw

Write-Host ''
Write-Host '=== Imperiall RPG — aplicar migrations ===' -ForegroundColor Cyan
Write-Host "SQL: $sqlPath ($([math]::Round($sql.Length/1024,1)) KB)"
if ($DryRun) {
  Write-Host ''
  Write-Host $sql
  Write-Host ''
  Write-Host 'DRY RUN — nada foi enviado ao Supabase.' -ForegroundColor Yellow
  exit 0
}

$token = Get-SupabaseToken
if (-not $token) { throw 'Token nao informado.' }

$targets = if ($Environment -eq 'both') { @('staging','production') } else { @($Environment) }

foreach ($env in $targets) {
  $ref = $PROJECTS[$env]
  $color = if ($env -eq 'production') { 'Red' } else { 'Yellow' }

  Write-Host ''
  Write-Host "--- $env ($ref) ---" -ForegroundColor $color

  if (-not (Test-ProjectConnection -Token $token -ProjectRef $ref)) {
    Write-Host '  Pulando.' -ForegroundColor DarkGray
    continue
  }

  $r = Invoke-Sql -Token $token -ProjectRef $ref -Sql $sql
  if ($r.ok) {
    Write-Host '  OK — migrations aplicadas.' -ForegroundColor Green
    if ($r.result) { $r.result | Format-List | Out-String | Write-Host }
  } else {
    Write-Host "  FALHOU: $($r.error)" -ForegroundColor Red
  }
}

Write-Host ''
Write-Host 'Concluido.' -ForegroundColor Cyan
Write-Host 'Verifique o relatorio final (SELECT ...) que aparece no output acima.'