param(
    [string]$Token = '',
    [string]$Proxy = ''
)

$Repo = 'slixxxx1007/home-wardrobe'
$Branch = 'gh-pages'
$TempDir = Join-Path $env:TEMP 'hw-deploy'

if (-not $Token) { $Token = (git config --get deploy.token 2>$null) }
if (-not $Proxy) { $Proxy = (git config --get deploy.proxy 2>$null) }

if (-not (Test-Path 'dist')) { Write-Error 'dist 目录不存在，请先 npm run build'; exit 1 }

if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
New-Item -ItemType Directory -Path $TempDir | Out-Null

Copy-Item 'dist\*' $TempDir -Recurse -Force

Push-Location $TempDir
try {
    git init -b $Branch | Out-Null
    git add -A
    git commit -m ('deploy: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) | Out-Null

    $Remote = if ($Token) { "https://slixxxx1007:$Token@github.com/$Repo.git" } else { "https://github.com/$Repo.git" }
    if ($Proxy) { git -c "http.proxy=$Proxy" push $Remote "$Branch" --force 2>&1 | Out-Null }
    else { git push $Remote "$Branch" --force 2>&1 | Out-Null }

    Write-Output ''
    Write-Output 'Deployed. Site refreshes in ~1 min:'
    Write-Output '  https://slixxxx1007.github.io/home-wardrobe/'
}
finally {
    Pop-Location
    Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue
}
