[CmdletBinding()]
param(
  [string]$Version = "latest",
  [switch]$Silent
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$repository = "leondic1976/Deploy-Think-Frame-Concept-Edit-TFCedit"
$releaseApi = if ($Version -eq "latest") {
  "https://api.github.com/repos/$repository/releases/latest"
} else {
  $tag = if ($Version.StartsWith("v")) { $Version } else { "v$Version" }
  "https://api.github.com/repos/$repository/releases/tags/$tag"
}

$headers = @{
  Accept = "application/vnd.github+json"
  "User-Agent" = "ThinkFrame-Installer"
  "X-GitHub-Api-Version" = "2022-11-28"
}

$temporaryDirectory = Join-Path ([IO.Path]::GetTempPath()) (
  "ThinkFrameInstall-" + [Guid]::NewGuid().ToString("N")
)
New-Item -ItemType Directory -LiteralPath $temporaryDirectory | Out-Null

try {
  Write-Host "ThinkFrame 릴리스 정보를 확인합니다..."
  $release = Invoke-RestMethod -Uri $releaseApi -Headers $headers
  $setupAsset = $release.assets | Where-Object { $_.name -eq "ThinkFrameSetup.exe" } |
    Select-Object -First 1
  $checksumAsset = $release.assets | Where-Object { $_.name -eq "SHA256SUMS.txt" } |
    Select-Object -First 1

  if (-not $setupAsset) {
    throw "선택한 릴리스에서 ThinkFrameSetup.exe를 찾을 수 없습니다."
  }
  if (-not $checksumAsset) {
    throw "선택한 릴리스에서 SHA256SUMS.txt를 찾을 수 없습니다."
  }

  $setupPath = Join-Path $temporaryDirectory "ThinkFrameSetup.exe"
  $checksumPath = Join-Path $temporaryDirectory "SHA256SUMS.txt"
  Write-Host "ThinkFrame $($release.tag_name)을 다운로드합니다..."
  Invoke-WebRequest -Uri $setupAsset.browser_download_url -OutFile $setupPath -Headers $headers
  Invoke-WebRequest -Uri $checksumAsset.browser_download_url -OutFile $checksumPath -Headers $headers

  $expectedHash = ((Get-Content -LiteralPath $checksumPath -Raw).Trim() -split "\s+")[0]
  $actualHash = (Get-FileHash -LiteralPath $setupPath -Algorithm SHA256).Hash
  if ($actualHash -ne $expectedHash) {
    throw "설치 파일의 SHA-256 체크섬이 일치하지 않습니다."
  }

  Write-Host "체크섬 확인 완료. ThinkFrame 설치를 시작합니다..."
  $process = if ($Silent) {
    Start-Process -FilePath $setupPath -ArgumentList "--silent" -Wait -PassThru
  } else {
    Start-Process -FilePath $setupPath -Wait -PassThru
  }
  if ($process.ExitCode -ne 0) {
    throw "ThinkFrame 설치가 종료 코드 $($process.ExitCode)로 실패했습니다."
  }
  Write-Host "ThinkFrame 설치가 완료되었습니다."
} finally {
  if (Test-Path -LiteralPath $temporaryDirectory) {
    Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force
  }
}
