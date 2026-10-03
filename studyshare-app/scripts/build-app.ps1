<#
.SYNOPSIS
    Builds the StudyShare React app with app-specific env vars and syncs it
    into the Capacitor Android project.

.DESCRIPTION
    Run this script from the studyshare-app/ directory every time you want
    to publish an updated APK:

        cd studyshare-app
        .\scripts\build-app.ps1

    What it does:
      1. Builds frontend/ using .env.production.app (absolute backend URL)
      2. Clears studyshare-app/www/ and copies the fresh dist in
      3. Runs `npx cap sync android` to update the Android WebView assets

.NOTES
    Requirements:
      - Node.js >= 18 installed
      - studyshare-app/node_modules present (run `npm install` first)
      - android/ project already generated (run `npm run cap:add-android` first)
      - .env.production.app filled in with real values
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Paths ─────────────────────────────────────────────────────────────────────
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppRoot     = Split-Path -Parent $ScriptDir          # studyshare-app/
$RepoRoot    = Split-Path -Parent $AppRoot            # project root
$FrontendDir = Join-Path $RepoRoot "frontend"
$WwwDir      = Join-Path $AppRoot "www"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  StudyShare Android Build Script" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Build the React app with app-specific env ─────────────────────────
Write-Host "[1/3] Building frontend with .env.production.app ..." -ForegroundColor Yellow

if (-not (Test-Path (Join-Path $FrontendDir ".env.production.app"))) {
    Write-Host ""
    Write-Host "ERROR: frontend/.env.production.app not found!" -ForegroundColor Red
    Write-Host "       Copy frontend/.env.production.app.example and fill in your real values." -ForegroundColor Red
    exit 1
}

Push-Location $FrontendDir
try {
    npm run build -- --mode production.app
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed (exit code $LASTEXITCODE)" }
} finally {
    Pop-Location
}

Write-Host "  Build complete." -ForegroundColor Green

# ── Step 2: Sync dist → www ───────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/3] Copying dist/ → studyshare-app/www/ ..." -ForegroundColor Yellow

$DistDir = Join-Path $FrontendDir "dist"
if (-not (Test-Path $DistDir)) {
    Write-Host "ERROR: frontend/dist/ does not exist after build!" -ForegroundColor Red
    exit 1
}

# Remove old www and recreate
if (Test-Path $WwwDir) {
    Remove-Item -Recurse -Force $WwwDir
}
Copy-Item -Recurse $DistDir $WwwDir

Write-Host "  www/ updated." -ForegroundColor Green

# ── Step 3: Capacitor sync ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] Running npx cap sync android ..." -ForegroundColor Yellow

Push-Location $AppRoot
try {
    npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "cap sync failed (exit code $LASTEXITCODE)" }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  SUCCESS! Android project is ready." -ForegroundColor Green
Write-Host "  Next: Open Android Studio with 'npx cap open android'" -ForegroundColor Green
Write-Host "  Then: Build > Generate Signed Bundle / APK > APK" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

