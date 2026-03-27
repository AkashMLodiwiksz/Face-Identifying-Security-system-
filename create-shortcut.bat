@echo off
title SecureVision AI - Create Desktop Shortcut
color 0B

echo.
echo  Creating Desktop Shortcut for SecureVision AI...
echo.

:: Create a PowerShell command to make the shortcut
powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; ^
   $desktop = [Environment]::GetFolderPath('Desktop'); ^
   $shortcut = $ws.CreateShortcut(\"$desktop\SecureVision AI.lnk\"); ^
   $shortcut.TargetPath = '%~dp0SecureVision.vbs'; ^
   $shortcut.WorkingDirectory = '%~dp0'; ^
   $shortcut.Description = 'SecureVision AI - Face Recognition Security System'; ^
   $shortcut.WindowStyle = 7; ^
   $shortcut.Save(); ^
   Write-Host '  [OK] Shortcut created on Desktop!'"

echo.

:: Also create a Start Menu shortcut
powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; ^
   $startMenu = [Environment]::GetFolderPath('StartMenu'); ^
   $programsDir = \"$startMenu\Programs\"; ^
   $shortcut = $ws.CreateShortcut(\"$programsDir\SecureVision AI.lnk\"); ^
   $shortcut.TargetPath = '%~dp0SecureVision.vbs'; ^
   $shortcut.WorkingDirectory = '%~dp0'; ^
   $shortcut.Description = 'SecureVision AI - Face Recognition Security System'; ^
   $shortcut.WindowStyle = 7; ^
   $shortcut.Save(); ^
   Write-Host '  [OK] Shortcut created in Start Menu!'"

echo.
echo  ============================================
echo    SHORTCUTS CREATED!
echo  ============================================
echo.
echo  You can now find "SecureVision AI" on your:
echo    - Desktop
echo    - Start Menu
echo.
echo  Double-click the shortcut to launch the app!
echo.
pause
