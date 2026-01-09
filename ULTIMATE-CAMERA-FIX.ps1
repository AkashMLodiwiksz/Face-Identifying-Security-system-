# COMPREHENSIVE CAMERA FIX
# Run this as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CAMERA DIAGNOSTIC AND FIX TOOL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click this file and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "[DIAGNOSTIC] Checking camera hardware..." -ForegroundColor Yellow
$cameras = Get-PnpDevice | Where-Object {$_.FriendlyName -like '*camera*'}
if ($cameras) {
    foreach ($cam in $cameras) {
        Write-Host "  Found: $($cam.FriendlyName) - Status: $($cam.Status)" -ForegroundColor $(if($cam.Status -eq 'OK'){'Green'}else{'Red'})
    }
} else {
    Write-Host "  ERROR: No camera hardware detected!" -ForegroundColor Red
}
Write-Host ""

Write-Host "[FIX 1] Stopping all processes that might lock camera..." -ForegroundColor Yellow
$toStop = @('python', 'pythonw', 'ffmpeg', 'node')
foreach ($proc in $toStop) {
    $processes = Get-Process $proc -ErrorAction SilentlyContinue
    if ($processes) {
        $processes | Stop-Process -Force
        Write-Host "  Stopped $($processes.Count) $proc process(es)" -ForegroundColor Green
    }
}
Write-Host ""

Write-Host "[FIX 2] Starting Windows Camera Frame Server..." -ForegroundColor Yellow
try {
    # Try to start the service
    $service = Get-Service FrameServer
    Write-Host "  Current Status: $($service.Status)" -ForegroundColor White
    
    if ($service.Status -ne 'Running') {
        Write-Host "  Attempting to start..." -ForegroundColor White
        Start-Service FrameServer -ErrorAction Stop
        Start-Sleep -Seconds 2
        $service = Get-Service FrameServer
        if ($service.Status -eq 'Running') {
            Write-Host "  SUCCESS: FrameServer is now RUNNING!" -ForegroundColor Green
        } else {
            Write-Host "  FAILED: FrameServer did not start" -ForegroundColor Red
        }
    } else {
        Write-Host "  Already running" -ForegroundColor Green
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Trying alternative method..." -ForegroundColor Yellow
    & sc.exe config FrameServer start= demand
    & net start FrameServer
    Start-Sleep -Seconds 2
    $service = Get-Service FrameServer
    Write-Host "  Status after alternative: $($service.Status)" -ForegroundColor $(if($service.Status -eq 'Running'){'Green'}else{'Red'})
}
Write-Host ""

Write-Host "[FIX 3] Checking camera permissions..." -ForegroundColor Yellow
$webcamKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam"
try {
    $value = (Get-ItemProperty -Path $webcamKey -Name Value).Value
    Write-Host "  Current permission: $value" -ForegroundColor White
    if ($value -ne "Allow") {
        Set-ItemProperty -Path $webcamKey -Name Value -Value "Allow"
        Write-Host "  Changed to: Allow" -ForegroundColor Green
    } else {
        Write-Host "  Already set to Allow" -ForegroundColor Green
    }
} catch {
    Write-Host "  ERROR: Could not check permissions" -ForegroundColor Red
}
Write-Host ""

Write-Host "[FIX 4] Resetting camera driver..." -ForegroundColor Yellow
$cameras = Get-PnpDevice -Class Camera
foreach ($cam in $cameras) {
    Write-Host "  Disabling: $($cam.FriendlyName)" -ForegroundColor White
    Disable-PnpDevice -InstanceId $cam.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "  Enabling: $($cam.FriendlyName)" -ForegroundColor White
    Enable-PnpDevice -InstanceId $cam.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}
Write-Host "  Camera driver reset complete" -ForegroundColor Green
Write-Host ""

Write-Host "[FIX 5] Testing camera access..." -ForegroundColor Yellow
Write-Host "  Opening Windows Camera app..." -ForegroundColor White
try {
    Start-Process "microsoft.windows.camera:" -ErrorAction Stop
    Write-Host "  Camera app opened - CHECK IF IT WORKS!" -ForegroundColor Green
    Write-Host "  If you see the camera feed, press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} catch {
    Write-Host "  Could not open camera app automatically" -ForegroundColor Yellow
    Write-Host "  Please open it manually from Start Menu" -ForegroundColor White
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIX COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "RESULTS:" -ForegroundColor Yellow
$finalService = Get-Service FrameServer
Write-Host "  Frame Server Status: $($finalService.Status)" -ForegroundColor $(if($finalService.Status -eq 'Running'){'Green'}else{'Red'})
Write-Host ""

if ($finalService.Status -eq 'Running') {
    Write-Host "Camera should now work!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test Windows Camera app (should be open)" -ForegroundColor White
    Write-Host "2. If camera works there, close it" -ForegroundColor White
    Write-Host "3. Run your app: npm run dev" -ForegroundColor White
} else {
    Write-Host "Frame Server failed to start!" -ForegroundColor Red
    Write-Host ""
    Write-Host "MANUAL FIX REQUIRED:" -ForegroundColor Yellow
    Write-Host "1. Open Services (Win + R, type: services.msc)" -ForegroundColor White
    Write-Host "2. Find 'Windows Camera Frame Server'" -ForegroundColor White
    Write-Host "3. Right-click > Properties" -ForegroundColor White
    Write-Host "4. Set Startup Type to 'Manual'" -ForegroundColor White
    Write-Host "5. Click 'Start'" -ForegroundColor White
    Write-Host "6. Click 'OK'" -ForegroundColor White
    Write-Host "7. RESTART YOUR COMPUTER" -ForegroundColor White
}

Write-Host ""
pause
