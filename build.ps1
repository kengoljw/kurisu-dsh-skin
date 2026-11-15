# Build dsh-skin-kurisu/lib/client.js from src/client.template.js + assets/*.webp
#
# Every wallpaper and thumbnail is embedded as a data: URI so the skin is a
# single self-contained client bundle — no static asset route, no file:// URL,
# no extra host configuration.
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$assets = Join-Path $root 'assets'
$template = Join-Path $root 'src\client.template.js'
$outFile = Join-Path $root 'lib\client.js'

function Get-DataUri([string]$name, [string]$mime = 'image/webp') {
  $path = Join-Path $assets $name
  if (-not (Test-Path -LiteralPath $path)) { throw "missing asset: $path" }
  $bytes = [IO.File]::ReadAllBytes($path)
  return ('data:{0};base64,' -f $mime) + [Convert]::ToBase64String($bytes)
}

# Nixie One (SIL OFL 1.1) — latin subset, woff2, inlined so the nixie digits use
# the closest free match to a real tube filament glyph. Licence text lives in
# assets/nixie-one-OFL.txt and MUST ship with any redistribution.
function Get-FontUri([string]$name) {
  $path = Join-Path $assets $name
  if (-not (Test-Path -LiteralPath $path)) { throw "missing font: $path" }
  $bytes = [IO.File]::ReadAllBytes($path)
  return 'data:font/woff2;base64,' + [Convert]::ToBase64String($bytes)
}

$map = [ordered]@{
  '{{WALL_NIGHT}}'   = Get-DataUri 'wall-night.webp'
  '{{WALL_DAY}}'     = Get-DataUri 'wall-day.webp'
  '{{WALL_DUSK}}'    = Get-DataUri 'wall-dusk.webp'
  '{{WALL_LIBRARY}}' = Get-DataUri 'wall-library.webp'
  '{{THUMB_NIGHT}}'  = Get-DataUri 'wall-night-thumb.webp'
  '{{THUMB_DAY}}'    = Get-DataUri 'wall-day-thumb.webp'
  '{{THUMB_DUSK}}'   = Get-DataUri 'wall-dusk-thumb.webp'
  '{{THUMB_LIBRARY}}'= Get-DataUri 'wall-library-thumb.webp'
  '{{NIXIE_FONT}}'   = Get-FontUri 'nixie-one-latin.woff2'
}

# v4 nixie Web Component (steins-gate-nixie-assets). Inlined as a JSON string
# into BOTH bundles: the host needs it before the app mounts, the client needs it
# for the sidebar meter and the splash boards. Keep the pristine upstream file in
# assets/nixie-v4/ for provenance; src/sg-nixie.inline.js is the integration copy.
$componentSource = [IO.File]::ReadAllText((Join-Path $root 'src\sg-nixie.inline.js'), [Text.Encoding]::UTF8)
$componentLiteral = ConvertTo-Json -InputObject ([string]$componentSource) -Compress

$raw = [IO.File]::ReadAllText($template, [Text.Encoding]::UTF8)
$text = $raw
foreach ($key in $map.Keys) { $text = $text.Replace($key, $map[$key]) }
$text = $text.Replace('__SG_NIXIE_JS__', $componentLiteral)

if ($text -match '\{\{[A-Z_]+\}\}') { throw 'unreplaced template placeholder remains' }

$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.Directory]::CreateDirectory((Split-Path -Parent $outFile)) | Out-Null
[IO.File]::WriteAllText($outFile, $text, $utf8)

# ---- host entry -----------------------------------------------------------
# The desktop loading screen is built before any client plugin activates, so it
# has to be themed from the host side through the boot injection table. The tube
# stylesheet is cut out of the very same template above, so both surfaces share
# one definition.
$hostTemplate = Join-Path $root 'src\host.template.js'
$hostOut = Join-Path $root 'lib\index.js'
if (Test-Path -LiteralPath $hostTemplate) {
  $nixieStart = $raw.IndexOf('/* ===== nixie tubes')
  $nixieEnd = $raw.IndexOf('/* ===== product splash', [Math]::Max(0, $nixieStart))
  if ($nixieStart -lt 0 -or $nixieEnd -le $nixieStart) { throw 'cannot locate the nixie css block in the template' }
  $nixieCss = $raw.Substring($nixieStart, $nixieEnd - $nixieStart)
  foreach ($key in $map.Keys) { $nixieCss = $nixieCss.Replace($key, $map[$key]) }
  if ($nixieCss -match '\{\{[A-Z_]+\}\}') { throw 'unreplaced placeholder in the extracted nixie css' }
  $literal = ConvertTo-Json -InputObject ([string]$nixieCss) -Compress
  $hostText = [IO.File]::ReadAllText($hostTemplate, [Text.Encoding]::UTF8).Replace('__NIXIE_CSS__', $literal).Replace('__SG_NIXIE_JS__', $componentLiteral)
  # The host load screen shares the app's wallpaper stack so the boot screen
  # dissolves into exactly the same picture once React mounts. It needs the same
  # data: URI substitutions as the client bundle.
  foreach ($key in $map.Keys) { $hostText = $hostText.Replace($key, $map[$key]) }
  if ($hostText -match '\{\{[A-Z_]+\}\}') { throw 'unreplaced placeholder in host template' }
  [IO.File]::WriteAllText($hostOut, $hostText, $utf8)
}

$info = [ordered]@{
  builtAt = (Get-Date).ToString('o')
  version = ([IO.File]::ReadAllText((Join-Path $root 'package.json'), [Text.Encoding]::UTF8) | ConvertFrom-Json).version
  bundleBytes = (Get-Item -LiteralPath $outFile).Length
  assets = @{}
}
foreach ($name in @('wall-night.webp','wall-day.webp','wall-dusk.webp','wall-library.webp')) {
  $p = Join-Path $assets $name
  $info.assets[$name] = [ordered]@{ bytes = (Get-Item -LiteralPath $p).Length; sha256 = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash }
}
[IO.File]::WriteAllText(
  (Join-Path $root 'build-info.json'),
  ($info | ConvertTo-Json -Depth 5),
  $utf8)

Write-Host ("built {0} ({1:N0} KB)" -f $outFile, ((Get-Item -LiteralPath $outFile).Length / 1KB))
if (Test-Path -LiteralPath $hostOut) { Write-Host ("built {0} ({1:N0} KB)" -f $hostOut, ((Get-Item -LiteralPath $hostOut).Length / 1KB)) }
