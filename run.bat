@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Virtual environment is missing. Run install.bat first.
    exit /b 1
)

call ".venv\Scripts\activate.bat"
python -m app
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%
