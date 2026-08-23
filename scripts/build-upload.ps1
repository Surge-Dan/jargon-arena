[CmdletBinding()]
param(
  [string]$OutputPath = (Join-Path (Split-Path -Parent $PSScriptRoot) '..\jargon-arena-upload.zip')
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

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

  $zipStream = $null
  $archive = $null
  try {
    $zipStream = [IO.File]::Open($resolvedOutput, [IO.FileMode]::CreateNew)
    $archive = [IO.Compression.ZipArchive]::new($zipStream, [IO.Compression.ZipArchiveMode]::Create)
    $runtimeFiles = @(Get-ChildItem -LiteralPath $stagingPath -Recurse -File)
    foreach ($file in $runtimeFiles) {
      $entryName = $file.FullName.Substring($stagingPath.Length + 1).Replace('\', '/')
      $entry = $archive.CreateEntry($entryName, [IO.Compression.CompressionLevel]::Optimal)
      $sourceStream = [IO.File]::OpenRead($file.FullName)
      $entryStream = $entry.Open()
      try {
        $sourceStream.CopyTo($entryStream)
      }
      finally {
        $entryStream.Dispose()
        $sourceStream.Dispose()
      }
    }
  }
  finally {
    if ($null -ne $archive) {
      $archive.Dispose()
    }
    if ($null -ne $zipStream) {
      $zipStream.Dispose()
    }
  }

  $size = (Get-Item -LiteralPath $resolvedOutput).Length
  Write-Output "UPLOAD_ZIP=$resolvedOutput"
  Write-Output "UPLOAD_BYTES=$size"
}
finally {
  if (Test-Path -LiteralPath $stagingPath) {
    Remove-Item -LiteralPath $stagingPath -Recurse -Force
  }
}
