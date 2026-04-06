@echo off
setlocal
cd /d "%~dp0"

where vercel >nul 2>nul
if errorlevel 1 (
    echo Vercel CLI is not installed. Install it with: npm i -g vercel
    exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
    echo Virtual environment is missing. Run install.bat first.
    exit /b 1
)

call ".venv\Scripts\activate.bat"
vercel --prod
if errorlevel 1 exit /b 1

python -m scripts.set_webhook
if errorlevel 1 exit /b 1

echo Deploy complete and webhook configured.
endlocal
