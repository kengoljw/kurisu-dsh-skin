# backup-package.ps1 - full, verifiable backup of the kurisu-skin package.
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File backup-package.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File backup-package.ps1 -Slim
#   powershell -NoProfile -ExecutionPolicy Bypass -File backup-package.ps1 -Dest D:\backup -NoZip
# Output: <Dest>\kurisu-skin-backup-<yyyyMMdd-HHmmss>\ + MANIFEST.txt + (optional) .zip

param(
    [string]$Dest = '',
    [switch]$Slim,
    [switch]$NoZip
)

$ErrorActionPreference = 'Stop'
$src = (Resolve-Path -LiteralPath $PSScriptRoot).Path
if ([string]::IsNullOrWhiteSpace($Dest)) {
    $Dest = Join-Path (Split-Path -Parent $src) 'kurisu-skin-backup'
}
if (-not (Test-Path -LiteralPath $Dest)) {
    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
}
$Dest = (Resolve-Path -LiteralPath $Dest).Path

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$stage = Join-Path $Dest ("kurisu-skin-backup-" + $stamp)
if (Test-Path -LiteralPath $stage) { throw "Backup directory already exists: $stage" }
New-Item -ItemType Directory -Path $stage -Force | Out-Null

# robocopy /XD excludes whole directories. Always exclude the backup destination
# itself in case the caller points -Dest inside the package.
$excludes = @()
if ($Dest.StartsWith($src + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    $excludes += (Split-Path -Parent $stage)
}
$preview = Join-Path $src 'preview'
if ($Slim) { $excludes += $preview }

$rcArgs = @($src, $stage, '/E', '/R:1', '/W:1', '/NFL', '/NDL', '/NJH', '/NJS', '/NP')
if ($excludes.Count -gt 0) { $rcArgs += '/XD'; $rcArgs += $excludes }
& robocopy @rcArgs | Out-Null
$rc = $LASTEXITCODE
if ($rc -ge 8) { throw "robocopy failed with code $rc" }

# In slim mode keep a handful of representative previews for visual reference.
$representatives = @('preview-dark.png', 'preview-light.png', 'v111-native-splash.jpg', 'splash-themed.png')
if ($Slim) {
    $keepDir = Join-Path $stage 'preview'
    New-Item -ItemType Directory -Path $keepDir -Force | Out-Null
    foreach ($name in $representatives) {
        $from = Join-Path $preview $name
        if (Test-Path -LiteralPath $from) {
            Copy-Item -LiteralPath $from -Destination (Join-Path $keepDir $name) -Force
        }
    }
}

$files = @(Get-ChildItem -LiteralPath $stage -Recurse -File)
$totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
if ($null -eq $totalBytes) { $totalBytes = 0 }

$keyFiles = @(
    'src/client.template.js',
    'src/host.template.js',
    'src/sg-nixie.inline.js',
    'lib/client.js',
    'lib/index.js',
    'package.json',
    'cordis.patch.yml',
    'research/patch-asar-splash.mjs',
    'research/native-splash/payload.mjs',
    'research/native-splash/fixture-test.mjs',
    'research/native-splash/web-document.orig.js',
    'research/native-splash/header.orig.json',
    'research/native-splash/backup-manifest.json'
)

$lines = @()
$lines += 'kurisu-skin package backup manifest'
$lines += ('created       : ' + (Get-Date).ToString('o'))
$lines += ('source        : ' + $src)
$lines += ('staged at     : ' + $stage)
$lines += ('mode          : ' + $(if ($Slim) { 'SLIM (preview/ reduced to representative images)' } else { 'FULL' }))
$lines += ('files         : ' + $files.Count)
$lines += ('bytes         : ' + $totalBytes)
$pkgText = Get-Content -LiteralPath (Join-Path $src 'package.json') -Raw -Encoding UTF8
$lines += ('version       : ' + ($pkgText | ConvertFrom-Json).version)
$lines += ''
$lines += 'asar facts at backup time (read-only):'
$asar = '<install>\AppData\Local\Programs\DSH NEXT\resources\app.asar'
if (Test-Path -LiteralPath $asar) {
    $lines += ('  app.asar bytes : ' + (Get-Item -LiteralPath $asar).Length)
    $lines += '  patch status   : run "research\native-splash\verify-applied-payload.mjs" after restore'
} else {
    $lines += '  app.asar       : not found at default path'
}
$lines += ''
$lines += 'SHA-256 of key files:'
foreach ($rel in $keyFiles) {
    $p = Join-Path $stage ($rel.Replace('/', [IO.Path]::DirectorySeparatorChar))
    if (Test-Path -LiteralPath $p) {
        $h = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash
        $lines += ('  ' + $h + '  ' + $rel)
    } else {
        $lines += ('  MISSING                                                          ' + $rel)
    }
}
$lines += ''
$lines += 'Restore: extract, then follow BACKUP.md section 4 and APPLY.md sections A/B.'
$manifest = Join-Path $stage 'MANIFEST.txt'
[IO.File]::WriteAllLines($manifest, $lines, [Text.UTF8Encoding]::new($false))

Write-Output ("mode       : " + $(if ($Slim) { 'slim' } else { 'full' }))
Write-Output ("files      : " + $files.Count)
Write-Output ("bytes      : " + $totalBytes)
Write-Output ("stage      : " + $stage)
Write-Output ("manifest   : " + $manifest)

if (-not $NoZip) {
    $zip = $stage + '.zip'
    Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal -Force
    Write-Output ("zip        : " + $zip)
    Write-Output ("zip bytes  : " + (Get-Item -LiteralPath $zip).Length)
}
Write-Output 'BACKUP OK'
