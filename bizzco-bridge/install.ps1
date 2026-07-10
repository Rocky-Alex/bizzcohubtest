# ==============================================================================
# Bizz Co Hub QA - Web-to-Local Bridge Installer
# Description: Deploys the controller files to C:\BizzCo_QC_Software and 
#              registers the custom bizzco-qa:// URI protocol handler.
# ==============================================================================

$targetDir = "C:\QC Software"
$currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Load PresentationFramework for MessageBox
Add-Type -AssemblyName PresentationFramework

try {
    Write-Host "Creating installation directory at $targetDir..." -ForegroundColor Cyan
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    }

    Write-Host "Copying controller files..." -ForegroundColor Cyan
    # Copy all files from the current folder, excluding the installer script itself
    Get-ChildItem -Path $currentDir | Where-Object { $_.Name -ne "install.ps1" -and $_.Name -ne "setup.bat" } | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $targetDir -Force
    }

    Write-Host "Registering protocol handler..." -ForegroundColor Cyan
    $registryPath = "HKCU:\Software\Classes\bizzco-qa"
    if (-not (Test-Path $registryPath)) {
        New-Item -Path $registryPath -Force | Out-Null
    }
    Set-ItemProperty -Path $registryPath -Name "(Default)" -Value "URL:Bizz Co QA Protocol" -Force
    Set-ItemProperty -Path $registryPath -Name "URL Protocol" -Value "" -Force

    $commandPath = "$registryPath\shell\open\command"
    if (-not (Test-Path $commandPath)) {
        New-Item -Path $commandPath -Force | Out-Null
    }
    $commandValue = "powershell.exe -ExecutionPolicy Bypass -File `"$targetDir\controller.ps1`" `"%1`""
    Set-ItemProperty -Path $commandPath -Name "(Default)" -Value $commandValue -Force

    Write-Host "Installation completed successfully!" -ForegroundColor Green
    [System.Windows.MessageBox]::Show(
        "Bizz Co QA Bridge has been installed successfully!`n`nLocation: $targetDir`nProtocol Registered: bizzco-qa://",
        "Installation Success",
        "OK",
        "Information"
    )
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    [System.Windows.MessageBox]::Show(
        "Failed to install Bizz Co QA Bridge:`n`n$_`n`nPlease ensure you have write permissions to C:\ and run setup again.",
        "Installation Error",
        "OK",
        "Error"
    )
}
