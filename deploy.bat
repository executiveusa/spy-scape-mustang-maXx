@echo off
REM ============================================================================
REM Spy Scape Mustang MaXx - GitHub & Vercel Deployment Script
REM ============================================================================
REM This script deploys the spy-themed Next.js website to GitHub and Vercel
REM 
REM PREREQUISITES:
REM 1. Install Node.js from https://nodejs.org (v18+ required)
REM 2. Generate GitHub Personal Access Token:
REM    - Go to https://github.com/settings/tokens
REM    - Generate new token (classic)
REM    - Select 'repo' scope
REM 3. Generate Vercel Access Token:
REM    - Go to https://vercel.com/account/tokens
REM    - Create new token
REM
REM USAGE:
REM   deploy.bat GITHUB_TOKEN VERCEL_TOKEN GITHUB_USERNAME
REM
REM EXAMPLE:
REM   deploy.bat ghp_yourgithubtoken yourverceltoken yourusername
REM ============================================================================

setlocal EnableDelayedExpansion

REM === Configuration ===
set "PROJECT_PATH=%~dp0spy-scape-mustang-maXx"
set "REPO_NAME=spy-scape-mustang-maXx"
set "DESCRIPTION=Spy/Cyberpunk themed website with Next.js 14 - Hero, Mission, Training, Skills, Gadgets, PhotoBooth, Footer components"

REM === Color Codes ===
for /f "delims=#" %%a in ('"prompt #$E# & for %%b in (1) do rem"') do set "$E=%%a"
set "RED=%$E?[91m"
set "GREEN=%$E?[92m"
set "YELLOW=%$E?[93m"
set "CYAN=%$E?[96m"
set "NC=%$E?[0m"

echo.
echo %CYAN%========================================%NC%
echo %CYAN%   Spy Scape Deployment Script      %NC%
echo %CYAN%========================================%NC%
echo.

REM === Check Arguments ===
if "%GITHUB_TOKEN%"=="" set "GITHUB_TOKEN=%1"
if "%VERCEL_TOKEN%"=="" set "VERCEL_TOKEN=%2"
if "%GITHUB_USERNAME%"=="" set "GITHUB_USERNAME=%3"

REM === Try to load tokens from environment ===
if "%GITHUB_TOKEN%"=="" set "GITHUB_TOKEN=%GITHUB_TOKEN%"
if "%VERCEL_TOKEN%"=="" set "VERCEL_TOKEN=%VERCEL_TOKEN%"
if "%GITHUB_USERNAME%"=="" set "GITHUB_USERNAME=%GITHUB_USERNAME%"

if "%GITHUB_TOKEN%"=="" (
    echo %YELLOW%WARNING: GitHub Token not provided%NC%
    echo Set GITHUB_TOKEN env var or pass as first argument
)

echo %GREEN%[1/7]%NC% Checking prerequisites...

REM === Check Node.js ===
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%ERROR: Node.js not found%NC%
    echo Please install Node.js from https://nodejs.org
    goto :end
)
echo %GREEN%   Node.js found%NC%

REM === Check Git ===
git --version >nul 2>&1
if errorlevel 1 (
    echo %RED%ERROR: Git not found%NC%
    echo Please install Git from https://git-scm.com
    goto :end
)
echo %GREEN%   Git found%NC%

echo.
echo %GREEN%[2/7]%NC% Configuring Git...

REM === Configure Git ===
git config user.name "%GITHUB_USERNAME%" 2>nul
git config user.email "%GITHUB_USERNAME%@users.noreply.github.com" 2>nul
echo %GREEN%   Git configured%NC%

echo.
echo %GREEN%[3/7]%NC% Initializing Git repository...

REM === Initialize Git ===
cd /d "%PROJECT_PATH%"

if not exist ".git" (
    git init
    echo %GREEN%   Git repository initialized%NC%
) else (
    echo %YELLOW%   Git repository already exists%NC%
)

REM === Create .gitignore if not exists ===
if not exist ".gitignore" (
    echo Creating .gitignore...
    (
        echo # Dependencies
        echo node_modules/
        echo.
        echo # Build
        echo .next/
        echo out/
        echo build/
        echo dist/
        echo.
        echo # Environment
        echo .env
        echo .env.local
        echo.
        echo # IDE
        echo .vscode/
        echo .idea/
        echo.
        echo # OS
        echo .DS_Store
        echo Thumbs.db
        echo.
        echo # Logs
        echo *.log
        echo npm-debug.log*
    ) > .gitignore
    echo %GREEN%   .gitignore created%NC%
)

echo.
echo %GREEN%[4/7]%NC% Staging and committing files...

REM === Stage Files ===
git add .
echo %GREEN%   Files staged%NC%

REM === Create Commit ===
git commit -m "Initial commit: Spy Scape Mustang MaXx - Next.js 14 spy/cyberpunk themed website

Features:
- Hero section with scan-line effects
- Mission statement component
- Training programs display
- Skills assessment
- Gadgets showcase
- Interactive PhotoBooth
- Footer component

Tech Stack:
- Next.js 14 with App Router
- Tailwind CSS
- Framer Motion
- TypeScript" 2>nul

if errorlevel 1 (
    echo %YELLOW%   Nothing to commit (already committed)%NC%
) else (
    echo %GREEN%   Commit created%NC%
)

echo.
echo %GREEN%[5/7]%NC% Creating GitHub repository...

REM === Create GitHub Repository via API ===
set "REPO_URL=https://api.github.com/user/repos"
set "AUTH_HEADER=Authorization: token %GITHUB_TOKEN%"
set "POST_DATA={\"name\":\"%REPO_NAME%\",\"description\":\"%DESCRIPTION%\",\"private\":false,\"auto_init\":false}"

REM Try to create repository
curl -s -X POST -H "%AUTH_HEADER%" -H "Accept: application/vnd.github.v3+json" -d "%POST_DATA%" "%REPO_URL%" > create_repo_response.json

REM Check if repo was created or already exists
type create_repo_response.json | findstr /c:"\"message\":\"Repository already exists\"" >nul
if not errorlevel 1 (
    echo %YELLOW%   Repository already exists%NC%
) else (
    type create_repo_response.json | findstr /c:"\"id\":" >nul
    if not errorlevel 1 (
        echo %GREEN%   Repository created%NC%
    ) else (
        echo %RED%   Failed to create repository%NC%
        type create_repo_response.json
        del create_repo_response.json 2>nul
        goto :end
    )
)
del create_repo_response.json 2>nul

echo.
echo %GREEN%[6/7]%NC% Pushing to GitHub...

REM === Add Remote and Push ===
git remote remove origin 2>nul
git remote add origin "https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git"

REM Push with token embedded in URL
git push -u origin master

if errorlevel 1 (
    echo %RED%   Push failed%NC%
    echo.
    echo Try manually:
    echo   cd "%PROJECT_PATH%"
    echo   git push -u origin master
    goto :end
)

echo %GREEN%   Pushed to GitHub%NC%

echo.
echo %GREEN%[7/7]%NC% Deploying to Vercel...

REM === Deploy to Vercel ===
REM Install Vercel CLI if not installed
where vercel >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%   Installing Vercel CLI...%NC%
    npm install -g vercel
)

REM Set Vercel token
set "VERCEL_TOKEN=%VERCEL_TOKEN%"

REM Deploy
echo %YELLOW%   Deploying to Vercel...%NC%
vercel --token=%VERCEL_TOKEN% --prod --yes

if errorlevel 1 (
    echo %RED%   Vercel deployment may have failed%NC%
    echo.
    echo Try manually:
    echo   cd "%PROJECT_PATH%"
    echo   vercel --token=%VERCEL_TOKEN% --prod --yes
    goto :end
)

echo %GREEN%   Vercel deployment initiated%NC%

echo.
echo %GREEN%========================================%NC%
echo %GREEN%   DEPLOYMENT COMPLETE!              %NC%
echo %GREEN%========================================%NC%
echo.
echo %CYAN%GitHub Repository:%NC%
echo   https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
echo.
echo %CYAN%Vercel Deployment:%NC%
echo   Check your Vercel dashboard or email for deployment URL
echo.
echo %YELLOW%Next Steps:%NC%
echo   1. Visit your GitHub repository to verify upload
echo   2. Check Vercel dashboard for deployment status
echo   3. Configure custom domain if needed in Vercel

:end
endlocal
pause
