@echo off
cd /d "%~dp0"
echo === Estoria: re-render sample PDFs (no AI calls) ===
echo Building the app (1-2 minutes)...
call npm run build
call npm run pdfs
if exist samples\anger-en-book.pdf start "" samples\anger-en-book.pdf
pause
