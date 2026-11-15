# Remove dsh-skin-kurisu from a DSH profile (package + patch row).
[CmdletBinding()]
param([string]$ProfileDir = $env:DSH_PROFILE_DIR)

$ErrorActionPreference = 'Stop'
if (-not $ProfileDir) { $ProfileDir = Join-Path $env:USERPROFILE '.dsh\profiles\desktop' }
$ProfileDir = (Resolve-Path -LiteralPath $ProfileDir).Path

$dest = Join-Path $ProfileDir 'node_modules\dsh-skin-kurisu'
$expectedParent = Join-Path $ProfileDir 'node_modules'
if ((Split-Path -Parent $dest) -ne $expectedParent) { throw "unexpected path: $dest" }
if (Test-Path -LiteralPath $dest) {
  Remove-Item -LiteralPath $dest -Recurse -Force
  Write-Host "removed $dest"
}

$patch = Join-Path $ProfileDir 'cordis.patch.yml'
if (Test-Path -LiteralPath $patch) {
  $yaml = [IO.File]::ReadAllText($patch, [Text.Encoding]::UTF8)
  $block = @(
    '',
    '# dsh-skin-kurisu: Makise Kurisu theme + switchable wallpapers (Settings -> General).',
    '- insert:',
    '    - id: dsh-skin-kurisu',
    '      name: "dsh-skin-kurisu"',
    ''
  ) -join "`r`n"
  if ($yaml.Contains($block)) {
    $yaml = $yaml.Replace($block, "`r`n")
    Copy-Item -LiteralPath $patch -Destination ($patch + '.bak-kurisu-uninstall-' + (Get-Date -Format 'yyyyMMdd-HHmmss')) -Force
    [IO.File]::WriteAllText($patch, $yaml, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "removed patch row from $patch"
  } elseif ($yaml -match 'id:\s*dsh-skin-kurisu') {
    Write-Warning "a dsh-skin-kurisu row remains in $patch — remove it manually (formatting differs)."
  }
}
