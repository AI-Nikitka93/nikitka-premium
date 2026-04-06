@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv" (
    py -3.11 -m venv .venv
)

call ".venv\Scripts\activate.bat"
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if exist "package.json" (
    call npm install
)

if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo Created .env from .env.example
)

if exist ".dev.vars.example" (
    if not exist ".dev.vars" (
        copy ".dev.vars.example" ".dev.vars" >nul
        echo Created .dev.vars from .dev.vars.example
    )
)

echo.
echo Installation complete.
echo 1. Update .env with BOT_TOKEN and ADMIN_CHAT_ID.
echo 2. For local Python run use run.bat
echo 3. For Cloudflare deploy use deploy-cloudflare.bat after wrangler login
endlocal
