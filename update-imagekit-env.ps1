# PowerShell script to update .env.local with ImageKit credentials
# Run this script from the project root: .\update-imagekit-env.ps1

$envLocalPath = ".env.local"
$imagekitConfig = @"

# ImageKit Configuration
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_g42DWEqY1R/8z+j7SFlv6KNuLdo=
IMAGEKIT_PRIVATE_KEY=private_9ALMbOBNb1sNMnb5lt5Pdy1e/WA=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/kxci2a0h5
"@

Write-Host "ImageKit Environment Variable Updater" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path $envLocalPath) {
    Write-Host "Found .env.local file" -ForegroundColor Green
    
    # Read current content
    $currentContent = Get-Content $envLocalPath -Raw
    
    # Check if ImageKit config already exists
    if ($currentContent -match "NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY") {
        Write-Host "ImageKit configuration already exists in .env.local" -ForegroundColor Yellow
        Write-Host ""
        $response = Read-Host "Do you want to replace it? (y/n)"
        
        if ($response -eq "y" -or $response -eq "Y") {
            # Remove old ImageKit config
            $pattern = "(?ms)#\s*ImageKit Configuration.*?NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=.*?\r?\n"
            $newContent = $currentContent -replace $pattern, ""
            
            # Add new ImageKit config
            $newContent = $newContent.TrimEnd() + "`n" + $imagekitConfig + "`n"
            
            # Write back to file
            Set-Content -Path $envLocalPath -Value $newContent -NoNewline
            
            Write-Host "ImageKit configuration updated successfully!" -ForegroundColor Green
        }
        else {
            Write-Host "Update cancelled" -ForegroundColor Red
            exit
        }
    }
    else {
        # Append ImageKit config
        Add-Content -Path $envLocalPath -Value $imagekitConfig
        Write-Host "ImageKit configuration added successfully!" -ForegroundColor Green
    }
}
else {
    Write-Host ".env.local file not found" -ForegroundColor Red
    Write-Host "Creating .env.local from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" $envLocalPath
        Write-Host "Created .env.local from .env.example" -ForegroundColor Green
        Write-Host "ImageKit credentials are already included!" -ForegroundColor Green
    }
    else {
        Write-Host ".env.example not found. Creating new .env.local..." -ForegroundColor Red
        Set-Content -Path $envLocalPath -Value $imagekitConfig
        Write-Host "Created .env.local with ImageKit configuration" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "2. Test image upload in admin panel" -ForegroundColor White
Write-Host "   http://localhost:3001/admin/products" -ForegroundColor Gray
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
