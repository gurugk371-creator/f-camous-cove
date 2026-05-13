@echo off
title Amrapali University Vote - Unified Launcher
echo --------------------------------------------------
echo 🚀 Preparing to start BOTH Frontend and Backend...
echo --------------------------------------------------

REM 1. Ensure we are in the correct root directory
cd /d "%~dp0"

REM 2. Stop any existing node instances blocking ports 5500/5173
echo 🧹 Cleaning up any old active ports...
taskkill /F /IM node.exe 2>nul

echo.
echo 🔥 Starting Server and Website together...
echo --------------------------------------------------
echo PLEASE WAIT: Server will run on http://localhost:5500
echo.
npm run dev
pause
