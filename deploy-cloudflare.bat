@echo off
setlocal
cd /d "%~dp0"

where npx >nul 2>nul
if errorlevel 1 (
    echo Node.js is required. Install it first: https://nodejs.org/
    exit /b 1
)

if not exist "package.json" (
    echo package.json not found.
    exit /b 1
)

if not exist ".dev.vars" (
    if exist ".dev.vars.example" (
        copy ".dev.vars.example" ".dev.vars" >nul
        echo Created .dev.vars from .dev.vars.example
        echo Fill BOT_TOKEN, ADMIN_CHAT_ID, WEBHOOK_SECRET_TOKEN and WORKER_PUBLIC_URL, then run deploy-cloudflare.bat again.
    ) else (
        echo .dev.vars is missing.
    )
    exit /b 1
)

call npm install
if errorlevel 1 exit /b 1

call npx wrangler deploy
if errorlevel 1 exit /b 1

call npm run cf:webhook
if errorlevel 1 exit /b 1

call npm run cf:profile
if errorlevel 1 exit /b 1

echo Cloudflare deploy complete, webhook configured and bot profile synchronized.
endlocal
