[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ZipPath
)

$ErrorActionPreference = 'Stop'
$resolvedZip = [IO.Path]::GetFullPath($ZipPath)
$extractPath = Join-Path ([IO.Path]::GetTempPath()) ('jargon-arena-preflight-' + [guid]::NewGuid().ToString('N'))
$allowedExtensions = @('.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.json')
$forbiddenPatterns = @(
  'fetch\s*\(',
  'XMLHttpRequest',
  'new\s+WebSocket\s*\(',
  'new\s+EventSource\s*\(',
  'new\s+RTCPeerConnection\s*\(',
  'navigator\.geolocation',
  'navigator\.clipboard',
  'document\.execCommand',
  'navigator\.(bluetooth|usb|hid|serial)',
  'navigator\.(getBattery|connection|credentials|locks)',
  'enumerateDevices',
  'getDisplayMedia',
  'navigator\.storage\.persist',
  'navigator\.serviceWorker',
  'new\s+(Worker|SharedWorker)\s*\(',
  'new\s+(Accelerometer|Gyroscope|Magnetometer)\s*\(',
  'Device(Motion|Orientation)Event',
  'requestFullscreen',
  'eval\s*\(',
  'new\s+Function\s*\(',
  'WebAssembly',
  'window\.open',
  'window\.prompt',
  'location\.(href|assign)\s*=',
  '<iframe',
  '<object',
  '<base\b',
  '\bdownload\b',
  'target\s*=',
  'https?://',
  'onclick\s*=',
  'javascript:'
)

if (-not (Test-Path -LiteralPath $resolvedZip)) {
  throw "ZIP not found: $resolvedZip"
}

New-Item -ItemType Directory -Path $extractPath -Force | Out-Null

try {
  Expand-Archive -LiteralPath $resolvedZip -DestinationPath $extractPath -Force
  $files = @(Get-ChildItem -LiteralPath $extractPath -Recurse -File)
  $relativeFiles = @($files | ForEach-Object { $_.FullName.Substring($extractPath.Length + 1) })

  if (-not (Test-Path -LiteralPath (Join-Path $extractPath 'index.html'))) {
    throw 'index.html must be at the ZIP root'
  }

  $badTypes = @($relativeFiles | Where-Object { [IO.Path]::GetExtension($_).ToLowerInvariant() -notin $allowedExtensions })
  if ($badTypes.Count -gt 0) {
    throw "Unsupported file type: $($badTypes -join ', ')"
  }

  $textFiles = @($files | Where-Object { $_.Extension.ToLowerInvariant() -in @('.html', '.css', '.js', '.json') })
  foreach ($pattern in $forbiddenPatterns) {
    $matches = @($textFiles | Select-String -Pattern $pattern -CaseSensitive:$false)
    if ($matches.Count -gt 0) {
      throw "Forbidden pattern matched: $pattern"
    }
  }

  $inlineScript = @(Select-String -LiteralPath (Join-Path $extractPath 'index.html') -Pattern '<script(?![^>]*\bsrc=)' -CaseSensitive:$false)
  if ($inlineScript.Count -gt 0) {
    throw 'Inline script found'
  }

  $bytes = ($files | Measure-Object -Property Length -Sum).Sum
  if ($bytes -ge 2MB) {
    throw "Package exceeds 2MB: $bytes bytes"
  }

  Write-Output 'UPLOAD_PREFLIGHT=PASS'
  Write-Output "FILES=$($relativeFiles -join ',')"
  Write-Output "BYTES=$bytes"
}
finally {
  if (Test-Path -LiteralPath $extractPath) {
    Remove-Item -LiteralPath $extractPath -Recurse -Force
  }
}
