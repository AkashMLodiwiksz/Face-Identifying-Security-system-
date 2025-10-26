# 🔍 Camera Not Recording - Debugging Guide

## Step 1: Check Browser Console

After logging in, open the browser console (Press **F12**) and look for these messages:

### ✅ Expected Messages (What You Should See):
```
📍 Attempting to start background recording...
📍 BackgroundRecordingService.start() called
📍 Current state - isInitialized: false
🎬 Starting background recording service...
📍 Requesting camera access...
✅ Camera access granted for background recording
📍 Camera stream: [MediaStream object]
✅ Camera registered with backend
📍 Starting recording in 1 second...
✅ Background recording service initialized
✅ Background recording service started after login
📍 startRecording() called
📍 Current state - stream: true isRecording: false
📍 Setting up MediaRecorder...
📍 Using codec: video/webm;codecs=vp9
🔴 Background recording started - continuous recording (2-minute segments)
```

### ❌ If You See Permission Error:
```
❌ Failed to start background recording: NotAllowedError
❌ Error name: NotAllowedError
❌ Error message: Permission denied
```

**Solution:** Allow camera access in browser
- Click the camera icon in address bar
- Click "Allow" for camera permission
- Refresh page and login again

### ❌ If You See "Camera Already in Use":
```
❌ Failed to start background recording: NotReadableError
❌ Error name: NotReadableError
❌ Error message: Could not start video source
```

**Solution:** Close other apps using camera
- Close Zoom, Teams, Skype, etc.
- Close other browser tabs using camera
- Restart browser and try again

---

## Step 2: Test Camera Manually

Open console (F12) and run:
```javascript
// Test 1: Check if backgroundRecordingService exists
backgroundRecordingService

// Test 2: Check current status
backgroundRecordingService.getStatus()

// Test 3: Try to start manually
await backgroundRecordingService.start()
```

---

## Step 3: Check Dashboard

1. Go to Dashboard page
2. Look for red banner at top
3. Should say: "Background Recording Active"
4. Should show timer counting up

**If NOT showing:**
- Recording didn't start
- Check console for errors

---

## Step 4: Check Camera Permission

### Chrome:
1. Click 🔒 lock icon in address bar
2. Look for "Camera" setting
3. Should be "Allow"
4. If blocked, change to "Allow" and refresh

### Firefox:
1. Click 🔒 lock icon in address bar
2. Click "Connection secure" > "More information"
3. Go to "Permissions" tab
4. Find "Use the Camera"
5. Remove "Block" if present

### Edge:
1. Click 🔒 lock icon in address bar
2. Click "Permissions for this site"
3. Find "Camera"
4. Set to "Allow"

---

## Step 5: Manual Camera Test

Try this simple test in console:
```javascript
// Test if camera works at all
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ Camera works!', stream);
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => {
    console.error('❌ Camera error:', err);
  });
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Camera permission denied** | Allow camera in browser settings |
| **Camera already in use** | Close other apps (Zoom, Teams) |
| **No camera found** | Connect/enable webcam |
| **HTTPS required** | Use localhost (already correct) |
| **Service already initialized** | Refresh page and try again |

---

## Quick Fix Checklist

- [ ] Browser has camera permission
- [ ] No other apps using camera
- [ ] Camera physically connected
- [ ] Running on localhost:5173
- [ ] Browser console shows no errors
- [ ] Refreshed page after code changes

---

## Still Not Working?

**Please share:**
1. Screenshot of browser console (F12)
2. What browser you're using (Chrome/Firefox/Edge)
3. What error messages you see
4. Whether dashboard shows recording banner

---

## Force Restart Everything

```bash
# 1. Stop all terminals (Ctrl+C)

# 2. Clear browser data
# - In browser: Ctrl+Shift+Delete
# - Clear "Cookies and site data"
# - Clear "Cached images and files"

# 3. Restart backend
cd backend
python app.py

# 4. Restart frontend  
cd frontend-react
npm run dev

# 5. Open fresh browser tab
# Go to: http://localhost:5173
# Login: username: 1, password: 1

# 6. Open console (F12)
# Watch for messages
```

---

**The enhanced logging will help us see exactly where it's failing!** 🔍
