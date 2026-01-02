
@echo off
echo ==========================================
echo      BizzcoHub Battery Diagnostics
echo ==========================================
echo.
echo 1. Generating Battery Report...
powercfg /batteryreport /xml /output "%TEMP%\battery_report.xml"

echo 2. Uploading Data for Analysis...
powershell -Command "$res = Invoke-RestMethod -Uri 'https://bchtest.netlify.app/api/battery-check' -Method Post -InFile '%TEMP%\battery_report.xml' -ContentType 'text/xml'; Start-Process 'https://bchtest.netlify.app/resources/battery-status?reportId=' + $res.id"

echo.
echo Done! Please check your browser.
pause
        