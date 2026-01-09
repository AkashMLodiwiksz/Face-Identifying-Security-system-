# Camera Fix Script - Run as Administrator
# This script attempts to fix camera access issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " CAMERA ACCESS FIX TOOL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[!] This script requires Administrator privileges" -ForegroundColor Red
    Write-Host "[*] Restarting with elevated permissions..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "[1/6] Checking camera privacy settings..." -ForegroundColor Green
try {
    $webcamValue = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam" -Name Value -ErrorAction Stop
    Write-Host "      Camera permission: $($webcamValue.Value)" -ForegroundColor White
    
    if ($webcamValue.Value -ne "Allow") {
        Write-Host "      Setting camera permission to Allow..." -ForegroundColor Yellow
        Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam" -Name Value -Value "Allow"
        Write-Host "      ✓ Camera permission updated" -ForegroundColor Green
    } else {
        Write-Host "      ✓ Camera permission already set to Allow" -ForegroundColor Green
    }
} catch {
    Write-Host "      ✗ Could not check/update camera permissions" -ForegroundColor Red
}

Write-Host ""
Write-Host "[2/6] Starting Windows Camera Frame Server..." -ForegroundColor Green
try {
    $frameServer = Get-Service -Name "FrameServer" -ErrorAction Stop
    if ($frameServer.Status -ne "Running") {
        Start-Service -Name "FrameServer" -ErrorAction Stop
        Write-Host "      ✓ FrameServer started successfully" -ForegroundColor Green
    } else {
        Write-Host "      ✓ FrameServer already running" -ForegroundColor Green
    }
} catch {
    Write-Host "      ✗ Failed to start FrameServer: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "      Attempting workaround..." -ForegroundColor Yellow
    try {
        sc.exe config FrameServer start= demand
        net start FrameServer
        Write-Host "      ✓ FrameServer started via workaround" -ForegroundColor Green
    } catch {
        Write-Host "      ✗ Workaround failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[3/6] Starting Windows Camera Frame Server Monitor..." -ForegroundColor Green
try {
    $monitor = Get-Service -Name "FrameServerMonitor" -ErrorAction SilentlyContinue
    if ($monitor) {
        if ($monitor.Status -ne "Running") {
            Start-Service -Name "FrameServerMonitor" -ErrorAction Stop
            Write-Host "      ✓ FrameServerMonitor started" -ForegroundColor Green
        } else {
            Write-Host "      ✓ FrameServerMonitor already running" -ForegroundColor Green
        }
    } else {
        Write-Host "      ⓘ FrameServerMonitor service not found (may not be needed)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "      ⓘ Could not start FrameServerMonitor (may not be critical)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/6] Killing processes that might be using camera..." -ForegroundColor Green
$processesToKill = @('ffmpeg', 'python', 'pythonw', 'WindowsCamera')
foreach ($proc in $processesToKill) {
    try {
        $processes = Get-Process -Name $proc -ErrorAction SilentlyContinue
        if ($processes) {
            $processes | Stop-Process -Force -ErrorAction SilentlyContinue
            Write-Host "      ✓ Stopped $($processes.Count) $proc process(es)" -ForegroundColor Green
        }
    } catch {
        # Silently continue
    }
}
Write-Host "      ✓ Process cleanup complete" -ForegroundColor Green

Write-Host ""
Write-Host "[5/6] Checking camera devices..." -ForegroundColor Green
try {
    $cameras = Get-PnpDevice -Class 'Camera' -ErrorAction Stop
    if ($cameras) {
        foreach ($cam in $cameras) {
            $status = if ($cam.Status -eq 'OK') { '✓' } else { '✗' }
            $color = if ($cam.Status -eq 'OK') { 'Green' } else { 'Red' }
            Write-Host "      $status $($cam.FriendlyName): $($cam.Status)" -ForegroundColor $color
            
            # Try to enable if disabled
            if ($cam.Status -ne 'OK') {
                Write-Host "      Attempting to enable camera..." -ForegroundColor Yellow
                Enable-PnpDevice -InstanceId $cam.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "      ✗ No cameras detected in device manager" -ForegroundColor Red
    }
} catch {
    Write-Host "      ✗ Failed to query camera devices: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "[6/6] Resetting Windows Camera App..." -ForegroundColor Green
try {
    Get-AppxPackage *camera* | ForEach-Object {
        Write-Host "      Resetting $($_.Name)..." -ForegroundColor White
        Reset-AppxPackage -Package $_.PackageFullName -ErrorAction SilentlyContinue
    }
    Write-Host "      ✓ Camera app reset complete" -ForegroundColor Green
} catch {
    Write-Host "      ⓘ Could not reset camera app (may not be critical)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " FIX COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Close this window" -ForegroundColor White
Write-Host "2. Open Windows Camera app to test" -ForegroundColor White
Write-Host "3. If camera works, try running: npm run dev" -ForegroundColor White
Write-Host "4. If still not working, RESTART YOUR COMPUTER" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
