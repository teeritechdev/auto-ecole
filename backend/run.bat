@echo off
title Backend - Nerwaya Auto-Ecole (Spring Boot)
echo ===================================================
echo   Lancement du Backend Spring Boot (Port 8080)
echo   Nerwaya Auto-Ecole
echo ===================================================
echo.
cd /d "%~dp0"
call mvnw.cmd spring-boot:run
pause
