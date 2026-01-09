# START ALL CAMERA SERVICES - Run as Administrator
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STARTING ALL CAMERA SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -NoExit -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# List of camera-related services to start
$cameraServices = @(
    @{Name="FrameServer"; Display="Windows Camera Frame Server"},
    @{Name="FrameServerMonitor"; Display="Windows Camera Frame Server Monitor"},
    @{Name="QWAVE"; Display="Quality Windows Audio Video Experience"},
    @{Name="FvSvc"; Display="NVIDIA FrameView SDK service"}
)

Write-Host "[STEP 1] Stopping processes that might lock camera..." -ForegroundColor Yellow
$processesToKill = @('python', 'pythonw', 'ffmpeg', 'node', 'chrome', 'msedge')
foreach ($proc in $processesToKill) {
    $processes = Get-Process $proc -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "  Stopping $($processes.Count) $proc process(es)..." -ForegroundColor White
        $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  Done!" -ForegroundColor Green
Write-Host ""

Write-Host "[STEP 2] Configuring and starting camera services..." -ForegroundColor Yellow
foreach ($svc in $cameraServices) {
    $serviceName = $svc.Name
    $displayName = $svc.Display
    
    Write-Host ""
    Write-Host "  Processing: $displayName" -ForegroundColor Cyan
    
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    
    if ($null -eq $service) {
        Write-Host "    ⓘ Service not found (may not exist on this system)" -ForegroundColor Gray
        continue
    }
    
    Write-Host "    Current Status: $($service.Status)" -ForegroundColor White
    Write-Host "    Current StartType: $($service.StartType)" -ForegroundColor White
    
    # Set to Automatic
    try {
        if ($serviceName -eq "FrameServer") {
            # FrameServer should be Automatic
            Write-Host "    Setting to Automatic..." -ForegroundColor White
            Set-Service -Name $serviceName -StartupType Automatic -ErrorAction Stop
            Write-Host "    ✓ Set to Automatic" -ForegroundColor Green
        } elseif ($serviceName -eq "QWAVE") {
            # QWAVE helps with audio/video quality
            Write-Host "    Setting to Automatic..." -ForegroundColor White
            Set-Service -Name $serviceName -StartupType Automatic -ErrorAction Stop
            Write-Host "    ✓ Set to Automatic" -ForegroundColor Green
        } else {
            # Others keep as Manual but we'll start them
            Write-Host "    Keeping as Manual (demand start)" -ForegroundColor White
        }
    } catch {
        Write-Host "    ✗ Could not set startup type: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Start the service
    if ($service.Status -ne 'Running') {
        Write-Host "    Starting service..." -ForegroundColor White
        try {
            Start-Service -Name $serviceName -ErrorAction Stop
            Start-Sleep -Milliseconds 500
            $service = Get-Service -Name $serviceName
            if ($service.Status -eq 'Running') {
                Write-Host "    ✓ Service STARTED!" -ForegroundColor Green
            } else {
                Write-Host "    ✗ Service did not start (Status: $($service.Status))" -ForegroundColor Red
            }
        } catch {
            Write-Host "    ✗ Failed to start: $($_.Exception.Message)" -ForegroundColor Red
            
            # Try alternative method
            Write-Host "    Trying alternative method..." -ForegroundColor Yellow
            & sc.exe start $serviceName 2>&1 | Out-Null
            Start-Sleep -Milliseconds 500
            $service = Get-Service -Name $serviceName
            if ($service.Status -eq 'Running') {
                Write-Host "    ✓ Started via alternative method!" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "    ✓ Already running" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[STEP 3] Resetting camera hardware..." -ForegroundColor Yellow
$cameras = Get-PnpDevice -Class Camera -ErrorAction SilentlyContinue
if ($cameras) {
    foreach ($cam in $cameras) {
        Write-Host "  Resetting: $($cam.FriendlyName)" -ForegroundColor White
        Disable-PnpDevice -InstanceId $cam.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
        Enable-PnpDevice -InstanceId $cam.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
    Write-Host "  ✓ Camera hardware reset complete" -ForegroundColor Green
} else {
    Write-Host "  ⓘ No camera devices found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[STEP 4] Checking camera permissions..." -ForegroundColor Yellow
$webcamKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam"
try {
    $value = (Get-ItemProperty -Path $webcamKey -Name Value -ErrorAction Stop).Value
    if ($value -ne "Allow") {
        Set-ItemProperty -Path $webcamKey -Name Value -Value "Allow"
        Write-Host "  ✓ Camera permission set to Allow" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Camera permission already set to Allow" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Could not check permissions" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FINAL STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($svc in $cameraServices) {
    $service = Get-Service -Name $svc.Name -ErrorAction SilentlyContinue
    if ($service) {
        $statusColor = if ($service.Status -eq 'Running') { 'Green' } else { 'Red' }
        $statusSymbol = if ($service.Status -eq 'Running') { '✓' } else { '✗' }
        Write-Host "  $statusSymbol $($svc.Display)" -ForegroundColor $statusColor
        Write-Host "    Status: $($service.Status) | StartType: $($service.StartType)" -ForegroundColor White
    }
}

Write-Host ""
$frameServer = Get-Service FrameServer
if ($frameServer.Status -eq 'Running') {
    Write-Host "SUCCESS! Camera services are running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Open Windows Camera app to test" -ForegroundColor White
    Write-Host "2. If camera works, close it" -ForegroundColor White
    Write-Host "3. Run: npm run dev" -ForegroundColor White
} else {
    Write-Host "WARNING: FrameServer failed to start!" -ForegroundColor Red
    Write-Host ""
    Write-Host "PLEASE TRY:" -ForegroundColor Yellow
    Write-Host "1. Restart your computer" -ForegroundColor White
    Write-Host "2. After restart, check if camera works" -ForegroundColor White
    Write-Host "3. If still not working, check Windows Update" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
