@echo off
cd /d "%~dp0"
for /f "tokens=5" %%p in ('netstat -ano -p tcp ^| findstr :3000 ^| findstr LISTENING') do taskkill /pid %%p /T /F >nul 2>&1
echo Installing packages (fast when nothing changed)...
call npm install --no-audit --no-fund
start "" http://localhost:3000
call npm run dev
pause
