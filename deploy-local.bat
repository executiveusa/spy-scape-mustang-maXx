@echo off
REM ============================================
REM Mustang Maxx 006 - Docker Deploy (Local/Coolify)
REM ============================================
REM This script builds and runs the production Docker image locally.
REM For Coolify: connect your GitHub repo and it builds from the Dockerfile automatically.

cd /d "%~dp0"

echo ============================================
echo  MUSTANG MAXX 006 - DOCKER DEPLOY
echo ============================================
echo.

REM Check Docker is available
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Install Docker Desktop: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

echo [1/5] Stopping existing containers...
docker-compose down 2>nul

echo [2/5] Building Docker image...
docker build -t mustang-maxx:latest .
if %errorlevel% neq 0 (
    echo [FAIL] Docker build failed. Check errors above.
    pause
    exit /b 1
)

echo [3/5] Starting container...
docker-compose up -d

echo [4/5] Waiting for service to start (15s)...
timeout /t 15 /nobreak >nul

echo [5/5] Verifying deployment...
curl -s -o nul -w "HTTP %%{http_code}" http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Service is running!
) else (
    echo [WARN] Could not verify - check: docker logs mustang-maxx-006
)

echo.
echo ============================================
echo  DEPLOYMENT COMPLETE
echo  Site:  http://localhost:3000
echo  Login: demo@mustangmaxx.com / demo123456
echo  Dash:  http://localhost:3000/dashboard
echo  Logs:  docker logs -f mustang-maxx-006
echo ============================================
pause
