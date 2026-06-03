@echo off
title Sudha Dental Clinic - Frontend Server
echo -------------------------------------------------------------
echo Starting Sudha Dental Clinic Frontend (Port 5174)...
echo -------------------------------------------------------------

:: Navigate to frontend and run
cd /d "%~dp0frontend"
npm run dev

pause
