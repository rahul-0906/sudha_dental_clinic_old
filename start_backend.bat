@echo off
title Sudha Dental Clinic - Backend Server
echo -------------------------------------------------------------
echo Starting Sudha Dental Clinic Backend (Port 8081)...
echo -------------------------------------------------------------

:: Configure local Environment Variables
set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%PATH%;C:\tools\apache-maven-3.9.6\bin;C:\Program Files\Java\jdk-17\bin

:: Navigate to backend and run
cd /d "%~dp0backend"
mvn spring-boot:run

pause
