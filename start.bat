@echo off
title Sudha Dental Clinic - Server Manager
echo =============================================================
echo               SUDHA DENTAL CLINIC SERVERS
echo =============================================================
echo.

:: 1. Launch Backend Server in a new window
echo [1/2] Launching Backend Server (Port 8081)...
start "Sudha Clinic - Backend Server" cmd /k "cd /d "%~dp0backend" && set "JAVA_HOME=C:\Program Files\Java\jdk-23" && set "PATH=C:\tools\apache-maven-3.9.16\bin;C:\Program Files\Java\jdk-23\bin;%PATH%" && mvn spring-boot:run"

:: 2. Launch Frontend Server in a new window
echo [2/2] Launching Frontend Server (Port 5174)...
start "Sudha Clinic - Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo =============================================================
echo Both servers have been launched in separate console windows.
echo You can monitor logs or stop the servers in their windows.
echo Closing this launcher window in 5 seconds...
echo =============================================================
timeout /t 5 > nul
