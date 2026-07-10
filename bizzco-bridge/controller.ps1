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



function Start-FileDownload {
    param (
        [string]$Uri,
        [string]$OutFile
    )
    
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
    
    try {
        $request = [System.Net.HttpWebRequest]::Create($Uri)
        $request.Method = "GET"
        $request.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        $request.Timeout = 30000
        $request.Proxy = $null
        $request.AutomaticDecompression = [System.Net.DecompressionMethods]::GZip -bor [System.Net.DecompressionMethods]::Deflate
        
        $response = $request.GetResponse()
        $totalBytes = $response.ContentLength
        
        $responseStream = $response.GetResponseStream()
        $fileStream = [System.IO.File]::Create($OutFile)
        
        $buffer = New-Object byte[] 65536
        $bytesReadTotal = 0
        $totalSizeMb = if ($totalBytes -gt 0) { [Math]::Round($totalBytes / 1MB, 2) } else { "Unknown" }
        
        while ($true) {
            $bytesRead = $responseStream.Read($buffer, 0, $buffer.Length)
            if ($bytesRead -eq 0) { break }
            
            $fileStream.Write($buffer, 0, $bytesRead)
            $bytesReadTotal += $bytesRead
            
            $currentMb = [Math]::Round($bytesReadTotal / 1MB, 2)
            if ($totalBytes -gt 0) {
                $percent = [Math]::Round(($bytesReadTotal / $totalBytes) * 100, 0)
                Write-Host -NoNewline "`rDownloaded: $currentMb MB / $totalSizeMb MB ($percent%)"
                Write-Progress -Activity "Downloading file" -Status "$currentMb MB / $totalSizeMb MB ($percent%)" -PercentComplete $percent
            }
            else {
                Write-Host -NoNewline "`rDownloaded: $currentMb MB"
                Write-Progress -Activity "Downloading file" -Status "$currentMb MB"
            }
        }
        
        $fileStream.Close()
        $responseStream.Close()
        $fileStream.Dispose()
        $responseStream.Dispose()
        $response.Close()
        
        Write-Host "`nDownload complete!" -ForegroundColor Green
    }
    catch {
        if ($fileStream) { $fileStream.Close(); $fileStream.Dispose() }
        throw $_
    }
}

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
}
catch {
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
    }
    catch {}
}

# 3. Define the base path for diagnostic tools
$basePath = "C:\QC Software"

# 4. Strict Whitelist: Maps URL commands to target file relative paths
$relativePaths = @{
    "check-qc"        = "Master Checker\BizzCoHub QC File.bat"
    "check-harddrive" = "Hard Disk Tester\HDSentinel.exe"
    "check-lcd"       = "LCD Tester\LCD_checking.exe"
    "check-battery"   = "Battery Tester\Battery_checking.exe"
    "check-keyboard"  = "Keyboard Tester\Keyboard_checking.exe"
    "check-audio"     = "Sound Tester\Sound_checking.mp4"
}

# 5. Execute the diagnostic tool if it exists in the whitelist
if ($command -eq "download-qc") {
    $fileName = "QC Software.exe"
    $downloadUrl = "$origin/QC_Software/QC_Software.exe"
    try {
        # Show Save File Dialog to choose target directory and filename
        Add-Type -AssemblyName System.Windows.Forms
        $saveDialog = New-Object System.Windows.Forms.SaveFileDialog
        $saveDialog.Filter = "Executable Files (*.exe)|*.exe|All Files (*.*)|*.*"
        $saveDialog.FileName = $fileName
        $saveDialog.Title = "Choose where to save Bizz Co QC Software"
        
        # Show dialog
        $dialogResult = $saveDialog.ShowDialog()
        if ($dialogResult -ne [System.Windows.Forms.DialogResult]::OK) {
            # User cancelled dialog
            exit 0
        }
        
        # Force redirect chosen path to the user's Downloads folder
        $downloadsFolder = Join-Path $env:USERPROFILE "Downloads"
        $targetPath = Join-Path $downloadsFolder $fileName
        
        # Show progress console window
        Write-Host "=========================================================" -ForegroundColor Cyan
        Write-Host "Bizz Co Hub - Downloading QC Software..." -ForegroundColor Cyan
        Write-Host "Destination: $targetPath" -ForegroundColor White
        Write-Host "Source:      $downloadUrl" -ForegroundColor White
        Write-Host "=========================================================" -ForegroundColor Cyan
        Write-Host ""
        Start-FileDownload -Uri $downloadUrl -OutFile $targetPath
        if (Test-Path $targetPath) {
            [System.Windows.MessageBox]::Show("Bizz Co QC Software downloaded successfully to $targetPath", "Download Successful", "OK", "Information")
        }
        else {
            [System.Windows.MessageBox]::Show("Download completed, but file could not be written to '$targetPath'.", "Download Failed", "OK", "Error")
        }
    }
    catch {
        [System.Windows.MessageBox]::Show("Failed to download the tool from:`n$downloadUrl`n`nPlease ensure the local server is running.", "Download Error", "OK", "Error")
    }
}
elseif ($relativePaths.ContainsKey($command)) {
    $relPath = $relativePaths[$command]
    $fullPath = Join-Path $basePath $relPath

    # Auto-create the base folder if it doesn't exist
    if (-not (Test-Path $basePath)) {
        try {
            New-Item -ItemType Directory -Force -Path $basePath | Out-Null
        }
        catch {
            [System.Windows.MessageBox]::Show("Failed to create folder '$basePath'. Please check user write permissions.", "Installation Error", "OK", "Error")
            exit 1
        }
    }

    if (Test-Path $fullPath) {
        try {
            # Launch the local application
            Unblock-File -Path $fullPath -ErrorAction SilentlyContinue
            Write-Host "Launching $command..." -ForegroundColor Green
            Start-Process $fullPath -WorkingDirectory (Split-Path -Parent $fullPath)
            Start-Sleep -Seconds 3
        }
        catch {
            [System.Windows.MessageBox]::Show("Failed to launch application:`n$fullPath`n`nError: $_", "Launch Error", "OK", "Error")
        }
    }
    else {
        # Auto-installer block: install from Downloads if present, else alert user
        $installerName = "QC Software.exe"
        $installerPath = Join-Path $basePath $installerName
        $localDownloadsInstaller = Join-Path (Join-Path $env:USERPROFILE "Downloads") $installerName
        try {
            if (Test-Path $localDownloadsInstaller) {
                Write-Host "=========================================================" -ForegroundColor Cyan
                Write-Host "Bizz Co Hub - Installing QC Software from Downloads..." -ForegroundColor Cyan
                Write-Host "Source:      $localDownloadsInstaller" -ForegroundColor White
                Write-Host "Destination: $installerPath" -ForegroundColor White
                Write-Host "=========================================================" -ForegroundColor Cyan
                Write-Host ""
                Copy-Item -Path $localDownloadsInstaller -Destination $installerPath -Force
                
                if (Test-Path $installerPath) {
                    try {
                        # Run installer silently and wait for it to finish
                        Unblock-File -Path $installerPath -ErrorAction SilentlyContinue
                        Write-Host "Running installation silently..." -ForegroundColor Green
                        Start-Process -FilePath $installerPath -ArgumentList "/VERYSILENT", "/SUPPRESSMSGBBOXES", "/NORESTART", "/DIR=""$basePath""" -Wait
                        
                        if (Test-Path $fullPath) {
                            # Run it
                            Unblock-File -Path $fullPath -ErrorAction SilentlyContinue
                            Write-Host "Launching $command..." -ForegroundColor Green
                            Start-Process $fullPath -WorkingDirectory (Split-Path -Parent $fullPath)
                            Start-Sleep -Seconds 3
                        }
                        else {
                            [System.Windows.MessageBox]::Show("Installation completed, but could not find the target file:`n$fullPath", "Installation Failed", "OK", "Error")
                        }
                    }
                    catch {
                        [System.Windows.MessageBox]::Show("Failed to launch application after download:`n$installerPath`n`nError: $_", "Launch Error", "OK", "Error")
                    }
                }
            }
            else {
                [System.Windows.MessageBox]::Show(
                    "QC Software installer not found in your Downloads folder. Please download the software first.",
                    "Bizz Co QA Bridge - Installation Required",
                    "OK",
                    "Warning"
                )
            }
        }
        catch {
            [System.Windows.MessageBox]::Show("Failed to launch installation: $_", "Launch Error", "OK", "Error")
        }
    }
}
else {
    [System.Windows.MessageBox]::Show(
        "Unauthorized or invalid command:`n'$command'`n`nFor security reasons, only pre-configured diagnostic commands are permitted.",
        "Security Alert - Bizz Co QA Bridge",
        "OK",
        "Warning"
    )
}
