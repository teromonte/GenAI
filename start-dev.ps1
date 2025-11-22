# GenAI Local Development Starter
# ==============================================================================
# This script starts the entire local development environment in one go.
# 1. Checks Docker & Starts Database
# 2. Runs Database Migrations
# 3. Starts Backend (in new window)
# 4. Starts Frontend (in new window)
# ==============================================================================

Write-Host "Starting GenAI Local Development Environment..." -ForegroundColor Cyan
Write-Host ""

# 1. Check Docker
# ------------------------------------------------------------------------------
Write-Host "1 Checking Database..." -ForegroundColor Yellow

# Check if Docker is running
$dockerRunning = $false
for ($i = 1; $i -le 5; $i++) {
    docker info > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        break
    }
    Write-Host "   Waiting for Docker to be ready... ($i/5)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if (-not $dockerRunning) {
    Write-Error " Docker is not running. Please start Docker Desktop and try again."
    exit 1
}

# Start Database
Write-Host "   Starting PostgreSQL container..." -ForegroundColor Gray
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error " Failed to start database. Check Docker logs."
    exit 1
}
Write-Host " Database is running." -ForegroundColor Green
Write-Host ""

# 2. Run Migrations
# ------------------------------------------------------------------------------
Write-Host "2 Running Database Migrations..." -ForegroundColor Yellow
python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Migration warning. If this is the first run, ensure venv is active."
}
else {
    Write-Host " Migrations applied." -ForegroundColor Green
}
Write-Host ""

# 3. Start Backend
# ------------------------------------------------------------------------------
Write-Host "3 Starting Backend..." -ForegroundColor Yellow
$backendCmd = ". .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload --port 8001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Write-Host 'BACKEND LOGS' -ForegroundColor Cyan; $backendCmd}"
Write-Host " Backend started in new window." -ForegroundColor Green

# 4. Start Frontend
# ------------------------------------------------------------------------------
Write-Host "4 Starting Frontend..." -ForegroundColor Yellow
# Frontend doesn't strictly need venv, but good practice to be consistent if needed
$frontendCmd = "cd frontend; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Write-Host 'FRONTEND LOGS' -ForegroundColor Cyan; $frontendCmd}"
Write-Host " Frontend started in new window." -ForegroundColor Green
Write-Host ""

# Summary
# ------------------------------------------------------------------------------
Write-Host " All services started!" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000"
Write-Host "   - Backend:  http://localhost:8001/docs"
Write-Host "   - Database: localhost:5432"
Write-Host ""
Write-Host "Check the two new terminal windows for logs." -ForegroundColor Gray
