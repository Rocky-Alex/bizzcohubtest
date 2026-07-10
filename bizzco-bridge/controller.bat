@echo off
:: ==============================================================================
:: Bizz Co Hub QA - Web-to-Local Bridge Controller (Batch Version)
:: Location: C:\QC Software\controller.bat
:: Description: Receives custom URI protocol arguments and runs specific whitelisted
::              diagnostic utilities locally on the workstation.
:: ==============================================================================
setlocal enabledelayedexpansion

:: 1. Get raw URL argument passed by the Windows Registry
set "URL=%~1"

if "%URL%"=="" (
    echo Error: No command argument received.
    msg * "Bizz Co QA Bridge Error: No diagnostic command received."
    exit /b 1
)

:: 2. Clean up trailing slash if present
if "%URL:~-1%"=="/" set "URL=%URL:~0,-1%"

:: 3. Strip the protocol prefix "bizzco-qa://"
set "COMMAND=%URL:bizzco-qa://=%"

:: 4. Define local path
set "QA_DIR=C:\QC Software"

:: 5. Security Whitelist Check & Execution
if /i "%COMMAND%"=="check-qc" (
    set "EXE_PATH=%QA_DIR%\Master Checker\BizzCoHub QC File.bat"
    goto LAUNCH
) else if /i "%COMMAND%"=="check-harddrive" (
    set "EXE_PATH=%QA_DIR%\Hard Disk Tester\HDSentinel.exe"
    goto LAUNCH
) else if /i "%COMMAND%"=="check-lcd" (
    set "EXE_PATH=%QA_DIR%\LCD Tester\LCD_checking.exe"
    goto LAUNCH
) else if /i "%COMMAND%"=="check-battery" (
    set "EXE_PATH=%QA_DIR%\Battery Tester\Battery_checking.exe"
    goto LAUNCH
) else if /i "%COMMAND%"=="check-keyboard" (
    set "EXE_PATH=%QA_DIR%\Keyboard Tester\Keyboard_checking.exe"
    goto LAUNCH
) else if /i "%COMMAND%"=="check-audio" (
    set "EXE_PATH=%QA_DIR%\Sound Tester\Sound_checking.mp4"
    goto LAUNCH
) else (
    msg * "Security Alert: Unauthorized or unknown diagnostic command: %COMMAND%"
    exit /b 1
)

:LAUNCH
:: Check if the file exists
if exist "%EXE_PATH%" (
    start "" "%EXE_PATH%"
) else (
    msg * "Bizz Co QA Bridge Error: Diagnostic tool not found at %EXE_PATH%"
)

endlocal
