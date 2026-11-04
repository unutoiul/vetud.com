$ErrorActionPreference = 'Stop'
$stage = $PSScriptRoot
$repo = 'C:\projects\vetud-peptides'
$articleRoot = [IO.Path]::GetFullPath((Join-Path $repo 'assets\articles'))
$appRoot = [IO.Path]::GetFullPath((Join-Path $repo 'apps\storefront'))
$manifest = Get-Content -LiteralPath (Join-Path $stage 'manifest.json') -Raw | ConvertFrom-Json
$changed = Get-Content -LiteralPath (Join-Path $stage 'changed-files.json') -Raw | ConvertFrom-Json
$baseline = Get-Content -LiteralPath (Join-Path $stage 'source-baseline.json') -Raw | ConvertFrom-Json
$backup = Join-Path $stage 'before-update'
New-Item -ItemType Directory -Path $backup -Force | Out-Null
function Safe-Child([string]$root,[string]$relative) {
  $candidate = [IO.Path]::GetFullPath((Join-Path $root $relative))
  if (-not $candidate.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Path outside intended directory' }
  return $candidate
}
function Hash([string]$file) { return (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant() }
# Validate every retained file and duplicate before changing any originals.
foreach ($entry in $manifest) {
  if (-not $entry.originalName) {
    $prepared = Safe-Child (Join-Path $stage 'originals') $entry.filename
    if ((Hash $prepared) -ne $entry.sha256) { throw "Prepared file changed: $($entry.filename)" }
  }
  $target = Safe-Child $articleRoot $entry.filename
  if (Test-Path -LiteralPath $target) { throw "Target already exists: $($entry.filename)" }
  foreach ($old in (@($entry.originalName) + @($entry.duplicates))) {
    if ($old -and (Hash (Safe-Child $articleRoot $old)) -ne $entry.sha256) { throw "Original file changed: $old" }
  }
}
foreach ($item in $baseline) {
  $target = Safe-Child $appRoot $item.path
  if ($item.sha256) {
    if (-not (Test-Path -LiteralPath $target) -or (Hash $target) -ne $item.sha256) { throw "Website source changed since preparation: $($item.path). Review before applying." }
  } elseif (Test-Path -LiteralPath $target) { throw "New website source already exists: $($item.path)" }
}
$sourceBackup = @()
foreach ($relative in $changed) {
  $target = Safe-Child $appRoot $relative
  if (Test-Path -LiteralPath $target) {
    $saved = Safe-Child $backup $relative
    New-Item -ItemType Directory -Path (Split-Path $saved) -Force | Out-Null
    Copy-Item -LiteralPath $target -Destination $saved
    $sourceBackup += [pscustomobject]@{path=$relative;sha256=(Hash $target)}
  }
}
$sourceBackup | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $backup 'source-hashes.json') -Encoding utf8
foreach ($entry in $manifest) {
  $target = Safe-Child $articleRoot $entry.filename
  if ($entry.originalName) {
    Rename-Item -LiteralPath (Safe-Child $articleRoot $entry.originalName) -NewName $entry.filename
  } else {
    Copy-Item -LiteralPath (Safe-Child (Join-Path $stage 'originals') $entry.filename) -Destination $target
  }
  if ((Hash $target) -ne $entry.sha256) { throw "Renamed file verification failed: $target" }
  foreach ($duplicate in $entry.duplicates) {
    $duplicatePath = Safe-Child $articleRoot $duplicate
    if ((Hash $duplicatePath) -ne (Hash $target)) { throw 'Duplicate differs from retained file' }
    Remove-Item -LiteralPath $duplicatePath
  }
}
foreach ($relative in $changed) {
  $target = Safe-Child $appRoot $relative
  New-Item -ItemType Directory -Path (Split-Path $target) -Force | Out-Null
  Copy-Item -LiteralPath (Safe-Child (Join-Path $stage 'storefront') $relative) -Destination $target -Force
}
$imageTarget = Safe-Child $appRoot 'public\images\learn\illustrations'
New-Item -ItemType Directory -Path $imageTarget -Force | Out-Null
foreach ($entry in $manifest) {
  $webName = "vetud-learn-$($entry.slug).webp"
  Copy-Item -LiteralPath (Safe-Child (Join-Path $stage 'storefront\public\images\learn\illustrations') $webName) -Destination (Safe-Child $imageTarget $webName)
  if ((Hash (Safe-Child $imageTarget $webName)) -ne $entry.webSha256) { throw 'Website image verification failed' }
}
Copy-Item -LiteralPath (Join-Path $stage 'manifest.json') -Destination (Safe-Child $articleRoot 'image-manifest.json')
[pscustomobject]@{renamed=41;duplicatesRemoved=18;missingImageAdded='ahk-cu';websiteImages=42;sourceFiles=$changed.Count;backup=$backup} | ConvertTo-Json
