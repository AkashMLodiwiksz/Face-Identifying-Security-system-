# 🎥 Background Recording System

## Overview
The system now automatically starts recording **immediately after login** without needing to visit the Live Monitoring page. Recording runs in the background across all pages!

---

## ✨ New Features

### Automatic Start on Login
- Recording starts **automatically** when you log in
- No need to go to Live Monitoring tab
- Works in the background on all pages (Dashboard, Recordings, Settings, etc.)
- Camera permission requested once at login

### Background Operation
- Recording continues on **all pages**
- Doesn't stop when switching tabs
- Continues when navigating between Dashboard, Recordings, etc.
- Only stops when you logout

### Visual Indicator
- **Red banner** on Dashboard shows recording status
- **Recording time** displayed (updates every second)
- **Pulsing animation** indicates active recording
- **Auto-save reminder** (every 5 minutes)

---

## 🚀 How It Works

### Login Flow
```
1. Enter username and password
   ↓
2. Click "Sign In"
   ↓
3. Authentication successful
   ↓
4. Background recording starts automatically
   ↓
5. Camera permission popup appears
   ↓
6. Allow camera access
   ↓
7. Recording begins
   ↓
8. Redirect to Dashboard
   ↓
9. See red "Recording Active" banner
```

### While Using System
```
Dashboard → Recording continues ✅
   ↓
Click "Recordings" → Recording continues ✅
   ↓
Click "Settings" → Recording continues ✅
   ↓
Switch browser tabs → Recording continues ✅
   ↓
Return to system → Recording still active ✅
```

### Logout Flow
```
1. Click "Logout" button
   ↓
2. Recording stops automatically
   ↓
3. Current video segment saves
   ↓
4. Camera released
   ↓
5. Redirect to login page
```

---

## 📊 Dashboard Indicator

### Recording Active Banner
```
┌─────────────────────────────────────────────────────────┐
│ 🔴 Background Recording Active                          │
│                                                          │
│ Recording Time: 2:34        Auto-saves every 5 minutes  │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- **Red background** with pulsing animation
- **Recording timer** shows elapsed time
- **Auto-save notice** reminds you of 5-minute segments
- **Appears on all pages** when recording is active

---

## 🎯 User Experience

### Simple 2-Step Process

**Before (Old Way):**
1. Login
2. Go to Live Monitoring
3. Click "Start Camera & Recording"
4. Recording starts

**Now (New Way):**
1. Login
2. That's it! Recording starts automatically ✅

---

## 🔧 Technical Details

### Background Recording Service
Located: `/frontend-react/src/services/backgroundRecording.js`

**Features:**
- Singleton service instance
- Auto-starts after login
- Runs independently of UI components
- Continues across page navigation
- Handles camera permissions
- Manages 5-minute video segments
- Auto-uploads to backend

### Integration Points

**1. Login Page** (`Login.jsx`)
```javascript
// After successful authentication
await backgroundRecordingService.start();
console.log('✅ Background recording started');
```

**2. Layout Component** (`Layout.jsx`)
```javascript
// On logout
const handleLogout = () => {
  backgroundRecordingService.stop();
  // Clear auth and redirect...
};
```

**3. Dashboard** (`Dashboard.jsx`)
```javascript
// Check status every second
const status = backgroundRecordingService.getStatus();
// Display recording banner if active
```

---

## 📹 Recording Behavior

### Automatic Segments
- **00:00 - 05:00** → First segment (background_recording_xxx.webm)
- **05:00** → Auto-saves, starts new segment
- **05:00 - 10:00** → Second segment
- **10:00** → Auto-saves, starts new segment
- Continues until logout...

### File Naming Convention
```
background_recording_2025-10-19T14-00-00-123Z.webm
background_recording_2025-10-19T14-05-00-456Z.webm
background_recording_2025-10-19T14-10-00-789Z.webm
```

**Format:** `background_recording_<ISO-TIMESTAMP>.webm`
- Includes date and time
- Unique timestamp prevents overwrites
- Stored in `/backend/recordings/`

---

## 🎬 Recording Settings

### Video Quality
- **Resolution:** 1280x720 (HD)
- **Codec:** VP9 (fallback to VP8)
- **Bitrate:** 2.5 Mbps
- **Format:** WebM
- **Audio:** Disabled (video only)

### Duration
- **Segment Length:** 5 minutes (300 seconds)
- **Timeslice:** 1 second (data saves every second)
- **Auto-restart:** Yes (continues after each segment)

---

## 🔍 Monitoring & Status

### Console Logs
```
🎬 Starting background recording service...
✅ Camera access granted for background recording
✅ Camera registered with backend
🔴 Background recording started - Auto-saves every 5 minutes
📹 Recording segment completed, uploading...
✅ Background recording uploaded: background_recording_xxx.webm
📱 Tab hidden - background recording continues
📱 Tab visible - background recording still active
⏹️ Stopping background recording service...
✅ Background recording service stopped
```

### Check Recording Status
```javascript
// From any component
import backgroundRecordingService from '../services/backgroundRecording';

const status = backgroundRecordingService.getStatus();
console.log(status);
// {
//   isInitialized: true,
//   isRecording: true,
//   recordingTime: 156 (seconds)
// }
```

---

## 🎯 Use Cases

### Scenario 1: Standard Login
```
9:00 AM - Login to system
9:00 AM - Recording starts automatically
9:05 AM - First video saved (5 minutes)
9:10 AM - Second video saved
12:00 PM - Navigate to different pages (recording continues)
5:00 PM - Logout (recording stops, final video saved)

Total: 48 videos (8 hours × 6 per hour)
```

### Scenario 2: Short Session
```
2:00 PM - Login
2:00 PM - Recording starts
2:03 PM - Check Dashboard
2:07 PM - View Recordings page (first 5-min segment saved at 2:05)
2:10 PM - Logout (3-minute final segment saved)

Total: 2 videos
```

### Scenario 3: Multi-Tab Work
```
10:00 AM - Login to system
10:00 AM - Recording starts
10:15 AM - Open email in new tab
10:30 AM - Work in email (recording continues)
11:00 AM - Return to system tab
11:00 AM - Recording still active ✅
12:00 PM - Logout

Total: 12 videos (all recorded, no gaps)
```

---

## ⚠️ Important Notes

### Camera Permission
- **Browser popup** appears on first login
- Must click **"Allow"** for recording to work
- Permission is remembered for future sessions
- If denied, recording won't start (but login works)

### Browser Compatibility
- **Chrome/Edge:** ✅ Full support
- **Firefox:** ✅ Full support
- **Safari:** ⚠️ May need permissions configuration
- **Mobile browsers:** ⚠️ Limited background support

### Storage Management
- Videos saved in `/backend/recordings/`
- Each 5-minute video: ~15-20 MB
- 1 hour session: ~180-240 MB (12 videos)
- 8 hour day: ~1.4-1.9 GB (96 videos)
- Use "Format All" button to clear old recordings

### Performance Impact
- **Minimal CPU usage** when tab is in background
- **Memory usage:** ~50-100 MB
- **Network:** Uploads video every 5 minutes
- **No impact** on other tabs or applications

---

## 🛠️ Troubleshooting

### Recording Not Starting
**Check:**
1. Camera permission allowed?
2. Camera not in use by other app?
3. Check browser console for errors
4. Try refreshing and re-login

### Red Banner Not Showing
**Possible Reasons:**
1. Recording hasn't started yet (wait 1-2 seconds after login)
2. Not on Dashboard page (banner only shows on Dashboard)
3. Camera permission denied
4. Check console logs

### Videos Not Saving
**Check:**
1. Backend server running? (http://localhost:5000)
2. `/backend/recordings/` folder exists?
3. Check backend console for errors
4. Network connection stable?

### Recording Stops Unexpectedly
**Check:**
1. Did you close browser tab/window?
2. Did you logout?
3. Did browser crash?
4. Check browser console logs

---

## 🔄 Manual Control (Advanced)

### Start Recording Manually
```javascript
import backgroundRecordingService from '../services/backgroundRecording';

await backgroundRecordingService.start();
```

### Stop Recording Manually
```javascript
backgroundRecordingService.stop();
```

### Check Status
```javascript
const status = backgroundRecordingService.getStatus();
console.log('Recording:', status.isRecording);
console.log('Time:', status.recordingTime);
```

---

## 📋 Comparison: Old vs New

| Feature | Old System | New System |
|---------|-----------|------------|
| **Start Recording** | Manual (Live Monitoring page) | Automatic (on login) |
| **Page Navigation** | Stops when leaving page | Continues across pages ✅ |
| **Tab Switching** | Stops (data loss) | Continues (no data loss) ✅ |
| **User Action Required** | Click button | None (automatic) ✅ |
| **Visual Feedback** | Only on Live Monitoring | Dashboard banner ✅ |
| **Recording Location** | Live Monitoring only | System-wide ✅ |

---

## ✅ Advantages

1. **Automatic** - No manual button clicking required
2. **Reliable** - Runs in background, won't stop accidentally
3. **Convenient** - Start system and forget about it
4. **Continuous** - Records from login to logout
5. **Visible** - Dashboard shows recording status
6. **Safe** - Auto-stops on logout (no hanging processes)

---

## 🎉 Summary

The background recording system provides a **seamless, automatic recording experience**:

✅ **Login** → Recording starts automatically  
✅ **Use system** → Recording continues everywhere  
✅ **Switch tabs** → Recording keeps going  
✅ **Navigate pages** → Recording stays active  
✅ **Logout** → Recording stops cleanly  

**No manual intervention needed!** Just login and the system handles everything automatically. 🚀
