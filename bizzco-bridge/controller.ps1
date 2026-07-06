# ==============================================================================
# Bizz Co Hub QA - Web-to-Local Bridge Controller (PowerShell Version)
# Location: C:\BizzCo_QC_Software\controller.ps1
# Description: Receives custom URI protocol arguments, launches matching local
#              tools, and automatically downloads/installs them if missing.
# ==============================================================================

param (
    [string]$Url
)

# Load PresentationFramework for GUI popups (MessageBox)
Add-Type -AssemblyName PresentationFramework

# 1. Check if argument was received
if (-not $Url) {
    [System.Windows.MessageBox]::Show(
        "No diagnostic command argument received from the browser.",
        "Bizz Co QA Bridge - Error",
        "OK",
        "Error"
    )
    exit 1
}

# 2. Parse the command from the URL
# Example input: "bizzco-qa://check-qc?origin=http%3A%2F%2Flocalhost%3A3000"
try {
    $uri = [System.Uri]$Url
    $command = $uri.Host
} catch {
    # Fallback manual parsing if URI parsing fails
    $command = $Url -replace "^bizzco-qa://", ""
    $command = $command -replace "\?.*$", ""
}

# Clean trailing slashes or spaces
$command = $command.Trim().TrimEnd('/')

# Extract the origin host query parameter to know where to download from
$origin = "http://localhost:3000" # Fallback origin
if ($Url -match "origin=([^&]+)") {
    try {
        $rawOrigin = $Matches[1]
        $origin = [System.Uri]::UnescapeDataString($rawOrigin)
    } catch {}
}

# 3. Define the base path for diagnostic tools
$basePath = "C:\BizzCo_QC_Software"

# 4. Strict Whitelist: Maps URL commands to executable/file names
$whitelist = @{
    "check-qc"        = "QC_Software.exe"
    "download-qc"     = "QC_Software.exe"
    "check-harddrive" = "hdd_checking.exe"
    "check-lcd"       = "LCD_checking.exe"
    "check-battery"   = "Battery_checking.exe"
    "check-keyboard"  = "Keyboard_checking.exe"
    "check-audio"     = "Sound_checking.mp4"
}

# 5. Execute the diagnostic tool if it exists in the whitelist
if ($whitelist.ContainsKey($command)) {
    $fileName = $whitelist[$command]
    $fullPath = Join-Path $basePath $fileName

    # Auto-create the base folder if it doesn't exist
    if (-not (Test-Path $basePath)) {
        try {
            New-Item -ItemType Directory -Force -Path $basePath | Out-Null
        } catch {
            [System.Windows.MessageBox]::Show("Failed to create folder '$basePath'. Please check user write permissions.", "Installation Error", "OK", "Error")
            exit 1
        }
    }

    if ($command -eq "download-qc") {
        # Quiet download without running
        $downloadUrl = "$origin/qc_softwaes/$fileName"
        try {
            Write-Host "=========================================================" -ForegroundColor Cyan
            Write-Host "Bizz Co Hub - Downloading QC Software..." -ForegroundColor Cyan
            Write-Host "Destination: $fullPath" -ForegroundColor White
            Write-Host "Source:      $downloadUrl" -ForegroundColor White
            Write-Host "=========================================================" -ForegroundColor Cyan
            Write-Host ""
            Invoke-WebRequest -Uri $downloadUrl -OutFile $fullPath -UseBasicParsing
            if (Test-Path $fullPath) {
                [System.Windows.MessageBox]::Show("Bizz Co QC Software downloaded successfully to C:\BizzCo_QC_Software\QC_Software.exe", "Download Successful", "OK", "Information")
            } else {
                [System.Windows.MessageBox]::Show("Download completed, but file could not be written to '$fullPath'.", "Download Failed", "OK", "Error")
            }
        } catch {
            [System.Windows.MessageBox]::Show("Failed to download the tool from:`n$downloadUrl`n`nPlease ensure the local server is running.", "Download Error", "OK", "Error")
        }
    } else {
        # Regular execution
        if (Test-Path $fullPath) {
            # Launch the local application
            Start-Process $fullPath
        } else {
            # Auto-installer block: create folder and download file if missing (without prompt query)
            $downloadUrl = "$origin/qc_softwaes/$fileName"
            try {
                Write-Host "=========================================================" -ForegroundColor Cyan
                Write-Host "Bizz Co Hub - Installing & Launching QC Software..." -ForegroundColor Cyan
                Write-Host "Destination: $fullPath" -ForegroundColor White
                Write-Host "Source:      $downloadUrl" -ForegroundColor White
                Write-Host "=========================================================" -ForegroundColor Cyan
                Write-Host ""
                # Perform the download request
                Invoke-WebRequest -Uri $downloadUrl -OutFile $fullPath -UseBasicParsing
                
                if (Test-Path $fullPath) {
                    # Run it
                    Start-Process $fullPath
                } else {
                    [System.Windows.MessageBox]::Show("Download completed, but file could not be written to '$fullPath'.", "Installation Failed", "OK", "Error")
                }
            } catch {
                [System.Windows.MessageBox]::Show("Failed to download the tool from:`n$downloadUrl`n`nPlease ensure your workstation is connected to the network or the dashboard is running.", "Download Error", "OK", "Error")
            }
        }
    }
} else {
    [System.Windows.MessageBox]::Show(
        "Unauthorized or invalid command:`n'$command'`n`nFor security reasons, only pre-configured diagnostic commands are permitted.",
        "Security Alert - Bizz Co QA Bridge",
        "OK",
        "Warning"
    )
}
