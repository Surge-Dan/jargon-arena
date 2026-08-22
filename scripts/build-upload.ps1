[CmdletBinding()]
param(
  [string]$OutputPath = (Join-Path (Split-Path -Parent $PSScriptRoot) '..\jargon-arena-upload.zip')
)

$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$resolvedOutput = [IO.Path]::GetFullPath($OutputPath)
$stagingPath = Join-Path ([IO.Path]::GetTempPath()) ('jargon-arena-upload-' + [guid]::NewGuid().ToString('N'))

New-Item -ItemType Directory -Path $stagingPath -Force | Out-Null
New-Item -ItemType Directory -Path (Split-Path -Parent $resolvedOutput) -Force | Out-Null

try {
  Copy-Item -LiteralPath (Join-Path $repoRoot 'index.html') -Destination $stagingPath
  Copy-Item -LiteralPath (Join-Path $repoRoot 'assets') -Destination $stagingPath -Recurse

  if (Test-Path -LiteralPath $resolvedOutput) {
    Remove-Item -LiteralPath $resolvedOutput -Force
  }

  Compress-Archive -Path (Join-Path $stagingPath '*') -DestinationPath $resolvedOutput -CompressionLevel Optimal

  $size = (Get-Item -LiteralPath $resolvedOutput).Length
  Write-Output "UPLOAD_ZIP=$resolvedOutput"
  Write-Output "UPLOAD_BYTES=$size"
}
finally {
  if (Test-Path -LiteralPath $stagingPath) {
    Remove-Item -LiteralPath $stagingPath -Recurse -Force
  }
}
