@echo off
title Monthly Expenses
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
echo Starting Monthly Expenses at http://localhost:5173
echo Close this window to stop the app.
call npm run dev
pause
