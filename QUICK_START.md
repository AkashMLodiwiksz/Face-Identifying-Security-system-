# 🚀 Quick Start - Background Recording System

## ⚡ 3-Step Test

### Step 1: Start Servers
```bash
# Make sure you're in the project root directory
cd "e:\work\New folder\Face-Identifying-Security-system-"

# Start both frontend and backend
npm run dev
```

**Expected:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Both running concurrently

---

### Step 2: Login and Test
1. Open browser: http://localhost:5173
2. Login: username `1`, password `1`
3. Allow camera permission
4. Should redirect to Dashboard

**Expected:**
- ✅ Red banner: "Background Recording Active"
- ✅ Timer: "Recording Time: 0:01, 0:02..."
- ✅ Console: "🎬 Starting background recording service..."

---

### Step 3: Verify Recording
1. Stay on Dashboard for 1 minute
2. Navigate to Settings page
3. Return to Dashboard
4. Check timer increased

**Expected:**
- ✅ Timer continues counting (didn't reset)
- ✅ Recording continues on all pages
- ✅ Console: No stop messages

---

## ✅ If All Works

**Congratulations!** Background recording is working perfectly! 🎉

### What's Happening
- Camera is recording in background
- Videos will save every 5 minutes
- Videos stored in `/backend/recordings/`
- View videos in Recordings page

---

## 🎯 Quick Actions

### Check Recording Status
```
Dashboard → See red banner at top
```

### View Saved Videos
```
Sidebar → Recordings → See list of videos
```

### Stop Recording
```
Logout button → Recording stops automatically
```

---

## 🔍 Console Commands (For Debugging)

Open browser console (F12) and try:

```javascript
// Check if service is running
import backgroundRecordingService from './src/services/backgroundRecording.js';
backgroundRecordingService.getStatus();

// Should return:
// { isInitialized: true, isRecording: true, recordingTime: 123 }
```

---

## 📁 Check Video Files

### Windows Command
```bash
# List all recordings
dir backend\recordings

# Should show files like:
# background_recording_2025-10-19T14-00-00-123Z.webm
```

---

## ⏱️ Timeline

```
0:00 - Login
0:01 - Recording starts
0:02 - Timer: 0:02
0:03 - Timer: 0:03
...
5:00 - First video saves automatically
5:01 - New recording starts (timer resets to 0:00)
...
10:00 - Second video saves
...
XX:XX - Logout → Final video saves
```

---

## 🎨 Visual Reference

### Dashboard When Recording
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🔴 Background Recording Active                 ┃
┃ 🎥 Recording Time: 2:34    Auto-saves every    ┃
┃                            5 minutes            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

[Stats Cards...]
[Dashboard Content...]
```

---

## 🐛 Troubleshooting

### Issue: Banner Not Showing
**Fix:** Make sure you're on Dashboard page (not Settings/Recordings)

### Issue: Camera Permission Denied
**Fix:** 
1. Click lock icon in address bar
2. Camera → Allow
3. Refresh and login again

### Issue: No Videos Saving
**Fix:**
1. Check backend is running (http://localhost:5000)
2. Wait full 5 minutes for first video
3. Check `/backend/recordings/` folder exists

---

## 📚 More Info

For complete documentation:
- **User Guide:** BACKGROUND_RECORDING.md
- **Testing:** TESTING_GUIDE.md
- **Diagrams:** BACKGROUND_RECORDING_DIAGRAMS.md
- **Summary:** AUTO_RECORDING_COMPLETE.md

---

## 🎉 That's It!

**The system now automatically records when you login.**

**No buttons to click. No manual work. Just login and it works!** 🚀

---

**Quick Reference:**
- Login → Recording starts ✅
- Any page → Recording continues ✅
- Logout → Recording stops ✅
- **IT JUST WORKS!** ✅
