# PowerShell script to build Windows installer with code signing disabled
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npm run build
if ($LASTEXITCODE -eq 0) {
    electron-builder --win
} else {
    Write-Host "Build failed, skipping electron-builder"
    exit $LASTEXITCODE
}


