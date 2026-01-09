# ============================================
# CAMERA ACCESS FIX GUIDE
# ============================================

## Problem
Your laptop camera shows error: "We can't find your camera" with error code 0xA00F4244 <NoCamerasAreAttached>
The camera light is blinking but access is blocked.

## Root Causes Identified
1. Windows Camera Frame Server is STOPPED
2. Possible process holding camera lock

## SOLUTION - Follow these steps:

### Step 1: Fix Windows Camera Service (REQUIRES ADMIN)
Run this in Command Prompt as Administrator:

```cmd
net start FrameServer
net start FrameServerMonitor
```

### Step 2: Check Camera Privacy Settings
1. Press Windows + I to open Settings
2. Go to Privacy & Security > Camera
3. Make sure these are ON:
   - "Camera access" toggle
   - "Let apps access your camera" toggle
   - "Let desktop apps access your camera" toggle

### Step 3: Verify Camera Driver
1. Open Device Manager (Win + X, then M)
2. Expand "Cameras" or "Imaging devices"
3. Right-click your camera
4. Select "Update driver"
5. Choose "Search automatically for drivers"

### Step 4: Reset Camera App
Run in PowerShell as Administrator:

```powershell
Get-AppxPackage *camera* | Reset-AppxPackage
```

### Step 5: Restart Computer
A full restart is often required for camera service changes to take effect.

## Quick Test After Fix
1. Open Windows Camera app
2. If it works, your Flask app should also work
3. Then run: npm run dev

## If Still Not Working
1. Check if antivirus is blocking camera access
2. Disable any VPN software temporarily
3. Check BIOS settings - ensure camera is not disabled there

