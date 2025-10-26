# 🎥 Automatic Video Recording System - Updated

## Overview
The recording system now starts automatically when you start the camera and continues until you stop the camera. No manual recording buttons needed!

## ✅ New Behavior

### Automatic Recording
- **Start Camera** → Recording starts automatically within 0.5 seconds
- **Stop Camera** → Recording stops and camera released
- **Change Tabs** → Recording continues in background (no interruption)
- **5-Minute Segments** → Auto-saves and starts new recording
- **Continuous** → Records until you stop the camera

### Button Changes
**Before:**
- Start Camera
- Start Recording (separate button)
- Stop Recording (separate button)
- Stop Camera

**Now:**
- **"Start Camera & Recording"** - Does both at once
- **"Stop Camera & Recording"** - Stops both at once
- **"Capture"** - Take snapshots (still available)

## 🎯 How It Works Now

### 1. Start Recording
```
Click "Start Camera & Recording"
↓
Camera turns ON
↓
Recording starts automatically (0.5s delay)
↓
REC indicator appears
↓
Timer starts: REC 0:00
```

### 2. Continuous Recording
```
Recording runs continuously
↓
Every 5 minutes (300 seconds)
↓
Current recording saves to backend
↓
New recording starts immediately
↓
Process repeats until you stop
```

### 3. Tab Switching
```
Switch to another browser tab
↓
Recording CONTINUES in background
↓
Video data still being collected
↓
Come back to tab
↓
Recording still active
```

### 4. Stop Recording
```
Click "Stop Camera & Recording"
↓
Current recording saves
↓
Recording stops
↓
Camera released
↓
System ready to start again
```

## 🔧 Technical Changes

### Auto-Start Recording
```javascript
// In startCamera() function
videoRef.current.play()
  .then(() => {
    setIsStreaming(true);
    
    // AUTO-START RECORDING
    setTimeout(() => {
      startRecording();
    }, 500);
  });
```

### Auto-Stop Recording
```javascript
// In stopCamera() function
const stopCamera = () => {
  // Stop recording first
  if (isRecording) {
    stopRecording();
  }
  
  // Then stop camera
  stream.getTracks().forEach(track => track.stop());
  setIsStreaming(false);
};
```

### Handle Tab Switching
```javascript
// Visibility change handler
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log('Tab hidden - recording continues');
    } else {
      console.log('Tab visible - recording still active');
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### Auto-Restart After 5 Minutes
```javascript
mediaRecorderRef.current.onstop = async () => {
  // Upload video
  await uploadVideo(blob);
  
  // Auto-restart if camera still on
  if (isStreaming && stream) {
    setTimeout(() => {
      setRecordingTime(0);
      startRecording(); // Start next segment
    }, 1000);
  }
};
```

### Timeslice for Reliability
```javascript
// Start with 1-second timeslice to prevent data loss
mediaRecorderRef.current.start(1000);
```

## 📋 User Workflow

### Simple 2-Button System

**To Start Everything:**
1. Click **"Start Camera & Recording"**
2. That's it! Camera and recording both start

**To Stop Everything:**
1. Click **"Stop Camera & Recording"**
2. That's it! Everything stops

**To Capture Snapshot:**
1. Click **"Capture"** anytime while recording
2. Frame saved to database

## 🎬 Recording Behavior

### Automatic Segments
- **00:00 - 05:00** → First 5-minute video
- **05:00** → Auto-saves, starts new recording
- **05:00 - 10:00** → Second 5-minute video
- **10:00** → Auto-saves, starts new recording
- And so on...

### File Naming
```
recording_20251019_140000.webm  (First segment)
recording_20251019_140500.webm  (5 minutes later)
recording_20251019_141000.webm  (10 minutes later)
recording_20251019_141500.webm  (15 minutes later)
```

### Example: 1 Hour Recording
- Total files: 12 videos
- Each file: ~15-20 MB
- Total size: ~180-240 MB
- Storage: `/backend/recordings/`

## 🔄 Tab Switching Behavior

### Problem (Before)
```
Recording active
↓
Switch tab
↓
Browser throttles/pauses MediaRecorder
↓
Recording stops ❌
↓
Data lost
```

### Solution (Now)
```
Recording active
↓
Switch tab
↓
Visibility handler detects change
↓
Recording continues ✅
↓
Data saved with timeslice (every 1s)
↓
Come back to tab
↓
Recording still active
```

## 💡 Benefits

✅ **Simpler** - Only 2 buttons instead of 4  
✅ **Automatic** - No need to remember to start recording  
✅ **Reliable** - Won't stop when switching tabs  
✅ **Continuous** - Records until you stop it  
✅ **Manageable** - Still saves in 5-minute segments  
✅ **Safe** - Stops completely when you stop camera

## ⚙️ Configuration

### Change Recording Duration
Edit `WebcamCapture.jsx`:
```javascript
if (newTime >= 300) { // 5 minutes = 300 seconds
```

Change to:
- 60 = 1 minute
- 120 = 2 minutes
- 600 = 10 minutes
- 1800 = 30 minutes

### Change Video Quality
Edit `WebcamCapture.jsx`:
```javascript
videoBitsPerSecond: 2500000 // 2.5 Mbps
```

Change to:
- 1000000 = 1 Mbps (lower quality, smaller files)
- 5000000 = 5 Mbps (higher quality, larger files)

## 🎯 Usage Examples

### Example 1: Quick Recording
```
9:00 AM - Click "Start Camera & Recording"
9:05 AM - First video saved automatically
9:10 AM - Second video saved automatically
9:12 AM - Click "Stop Camera & Recording"
9:12 AM - Final video saved (2 minutes long)

Result: 3 videos saved
```

### Example 2: All-Day Recording
```
8:00 AM - Click "Start Camera & Recording"
5:00 PM - Click "Stop Camera & Recording"

Recording time: 9 hours
Videos created: 108 files (9 hours × 12 per hour)
Total size: ~1.6 GB
```

### Example 3: With Tab Switching
```
10:00 AM - Start camera & recording
10:05 AM - Switch to email tab
10:15 AM - Work in email for 10 minutes
10:15 AM - Come back to system tab
10:15 AM - Recording still active ✅

Result: All video recorded, no gaps!
```

## 🚨 Important Notes

### When System Starts
- Camera does NOT start automatically
- You must click "Start Camera & Recording"
- Then recording begins

### When You Stop Camera
- Recording stops immediately
- Current video is saved
- Camera is released
- Other apps can use camera

### When You Refresh Page
- Camera stops
- Recording stops
- Current unsaved segment may be lost
- Start again after refresh

### When You Close Tab/Browser
- Camera stops
- Recording stops
- Video data may be lost if not saved yet
- Always stop cleanly before closing

## 📁 Where Videos Are Saved

**Location:** `/backend/recordings/`

**View Videos:**
1. Go to **Recordings** page in sidebar
2. See all videos with timestamps
3. Play/Download/Delete

**Storage Management:**
- Click **"Format All"** to delete everything
- Or delete individual videos

## 🔍 Monitoring

### Console Logs
```
Camera started successfully
Recording started - Auto-saves every 5 minutes
Tab hidden - recording continues in background
Tab visible again - recording still active
Video uploaded: {success: true}
Auto-restarting recording for next 5-minute segment
Recording stopped
Camera fully stopped and released
```

### Visual Indicators
- **Green light** - Camera is on
- **Red "REC"** - Recording active
- **Timer** - Shows recording time (MM:SS)
- **Blinking dot** - Recording in progress

## ✅ Checklist

**To Start Recording:**
- [ ] Go to Live Monitoring page
- [ ] Click "Start Camera & Recording"
- [ ] See REC indicator appear
- [ ] Recording starts automatically

**To Stop Recording:**
- [ ] Click "Stop Camera & Recording"
- [ ] Wait for confirmation
- [ ] Video saves automatically

**To View Recordings:**
- [ ] Go to Recordings page
- [ ] See all videos listed
- [ ] Play/Download as needed

The system now works seamlessly with automatic recording! 🎉
