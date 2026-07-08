@echo off
:: ==============================================================================
:: Bizz Co Hub QA - Installer Bootstrap Batch File
# Description: Runs install.ps1 with ExecutionPolicy Bypass to deploy files
#              and set up registry associations.
:: ==============================================================================
title Bizz Co QA Bridge Installer
echo =========================================================
echo  Bizz Co Hub - Installing QA Web-to-Local Bridge...
echo =========================================================
echo.

:: Run powershell installer script
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"

echo.
echo =========================================================
echo  Done. Press any key to exit this installer window.
echo =========================================================
pause > nul
