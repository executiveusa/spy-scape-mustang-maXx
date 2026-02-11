@echo off
REM Mustang Maxx 006 - Deployment Script
REM Run this to install dependencies and start the development server

cd /d "%~dp0"

echo 🚀 Installing dependencies...
call npm install

echo ✅ Installation complete!
echo.
echo Starting development server...
echo Open http://localhost:3000 in your browser
echo.
echo Demo Login: demo@mustangmaxx.com / demo123456
echo.

pause
npm run dev
