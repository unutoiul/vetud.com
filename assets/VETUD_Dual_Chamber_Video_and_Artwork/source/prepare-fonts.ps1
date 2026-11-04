$fontDestination = Join-Path $PSScriptRoot 'assets/fonts'
New-Item -ItemType Directory -Path $fontDestination -Force | Out-Null
$fontSource = Join-Path $env:WINDIR 'Fonts'
$fontMap = @{'GOTHIC.TTF'='brand-regular.ttf'; 'GOTHICB.TTF'='brand-bold.ttf'; 'segoeui.ttf'='vetud-regular.ttf'}
foreach ($fontFile in $fontMap.Keys) {
    $fontPath = Join-Path $fontSource $fontFile
    if (!(Test-Path -LiteralPath $fontPath)) { throw "Required installed font was not found: $fontFile" }
    Copy-Item -LiteralPath $fontPath -Destination (Join-Path $fontDestination $fontMap[$fontFile])
}
Write-Output 'Local font dependencies prepared.'
