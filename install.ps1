# Install dsh-skin-kurisu into a DSH profile.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1 -ProfileDir "C:\Users\me\.dsh\profiles\desktop"
#
# What it does (idempotent):
#   1. copies package.json / cordis.patch.yml / lib / assets / README into
#      <profile>\node_modules\dsh-skin-kurisu
#   2. backs up <profile>\cordis.patch.yml once per run and appends the
#      `- insert:` row when it is not already present.
[CmdletBinding()]
param(
  [string]$ProfileDir = $env:DSH_PROFILE_DIR,
  [switch]$NoPatch
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ProfileDir) { $ProfileDir = Join-Path $env:USERPROFILE '.dsh\profiles\desktop' }
$ProfileDir = (Resolve-Path -LiteralPath $ProfileDir).Path

$dest = Join-Path $ProfileDir 'node_modules\dsh-skin-kurisu'
$expectedParent = Join-Path $ProfileDir 'node_modules'
if ((Split-Path -Parent $dest) -ne $expectedParent -or (Split-Path -Leaf $dest) -ne 'dsh-skin-kurisu') {
  throw "refusing to write outside the profile node_modules: $dest"
}

if (-not (Test-Path -LiteralPath (Join-Path $root 'lib\client.js'))) {
  throw 'lib/client.js is missing — run build.ps1 first'
}

if (Test-Path -LiteralPath $dest) {
  Remove-Item -LiteralPath $dest -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $dest | Out-Null

foreach ($item in @('package.json', 'cordis.patch.yml', 'lib', 'assets', 'README.md')) {
  $src = Join-Path $root $item
  if (Test-Path -LiteralPath $src) {
    Copy-Item -LiteralPath $src -Destination $dest -Recurse -Force
  }
}
Write-Host "installed package -> $dest"

if (-not $NoPatch) {
  $patch = Join-Path $ProfileDir 'cordis.patch.yml'
  if (-not (Test-Path -LiteralPath $patch)) { throw "profile patch not found: $patch" }
  $yaml = [IO.File]::ReadAllText($patch, [Text.Encoding]::UTF8)
  if ($yaml -notmatch 'id:\s*dsh-skin-kurisu') {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    Copy-Item -LiteralPath $patch -Destination ($patch + '.bak-kurisu-' + $stamp) -Force
    $block = @(
      '',
      '# dsh-skin-kurisu: Makise Kurisu theme + switchable wallpapers (Settings -> General).',
      '- insert:',
      '    - id: dsh-skin-kurisu',
      '      name: "dsh-skin-kurisu"',
      ''
    ) -join "`r`n"
    [IO.File]::AppendAllText($patch, $block, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "patched $patch"
  } else {
    Write-Host "patch row already present in $patch"
  }
}

Write-Host ''
Write-Host 'Done. The skin registers itself the next time the profile loads.' -ForegroundColor Cyan
Write-Host 'If the running window does not pick it up automatically, restart DSH once.'
Write-Host 'Then open Settings -> General -> "Makise Kurisu" to switch wallpapers.'
