@echo off
REM Mustang Maxx 006 - Quick Install Script

cd /d "%~dp0"

echo 📦 Installing Node.js dependencies...
call npm install

echo ✅ Done!
echo.
echo To start the dev server, run:
echo   npm run dev
echo.
echo Or double-click: deploy.bat
echo.
echo Demo login: demo@mustangmaxx.com / demo123456

pause
