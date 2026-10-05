@echo off
cd /d "%~dp0"
echo === Estoria sample generator ===
where node >nul 2>nul || (echo Node.js is not installed. Install the LTS from https://nodejs.org then run this again. & pause & exit /b 1)
if not exist .env.local (copy .env.example .env.local >nul & echo Created .env.local - open it in Notepad, paste your Gemini key after GEMINI_API_KEY= , save, then run this again. & notepad .env.local & pause & exit /b 1)
findstr /R "^GEMINI_API_KEY=.." .env.local >nul || (echo GEMINI_API_KEY is empty in .env.local - paste your key and run again. & notepad .env.local & pause & exit /b 1)
if not exist node_modules (echo Installing dependencies, 1-2 minutes... & call npm install --no-audit --no-fund)
echo Generating 22 sample books with Gemini (about 5 minutes, ~$1.60)...
call npm run samples -- %*
if exist samples\index.html start "" samples\index.html
pause
