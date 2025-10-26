# 🧪 Background Recording - Testing Guide

## Pre-Testing Checklist

### 1. Verify Backend is Running
```bash
# Check if backend is running
curl http://localhost:5000/api/health
# Should return 200 OK
```

### 2. Verify Frontend is Running
```bash
# Frontend should be on
# http://localhost:5173
```

### 3. Check Folders Exist
```bash
# Windows CMD
dir backend\recordings
dir backend\captures

# Should show empty or existing files
```

---

## 🎯 Test Scenarios

### Test 1: Basic Auto-Start Recording
**Objective:** Verify recording starts automatically on login

**Steps:**
1. Open browser to http://localhost:5173
2. Login with username `1` and password `1`
3. Wait for camera permission popup
4. Click "Allow"
5. Should redirect to Dashboard

**Expected Results:**
- ✅ Camera permission prompt appears
- ✅ After allowing, redirected to Dashboard
- ✅ Red "Background Recording Active" banner visible
- ✅ Timer shows "Recording Time: 0:01, 0:02, 0:03..."
- ✅ Console shows:
  ```
  🎬 Starting background recording service...
  ✅ Camera access granted for background recording
  ✅ Camera registered with backend
  🔴 Background recording started - Auto-saves every 5 minutes
  ```

**Pass/Fail:** ___________

---

### Test 2: Recording Status on Dashboard
**Objective:** Verify recording status is visible

**Steps:**
1. After Test 1, stay on Dashboard
2. Observe red banner at top
3. Watch timer for 10 seconds

**Expected Results:**
- ✅ Red banner says "Background Recording Active"
- ✅ Timer increases every second (0:01 → 0:11)
- ✅ Shows "Auto-saves every 5 minutes"
- ✅ Banner has pulsing animation

**Pass/Fail:** ___________

---

### Test 3: Navigate Between Pages
**Objective:** Verify recording continues when changing pages

**Steps:**
1. After Test 2, click "Settings" in sidebar
2. Wait 5 seconds
3. Click "Dashboard" in sidebar
4. Check banner timer

**Expected Results:**
- ✅ On Settings page: recording continues (check console)
- ✅ Return to Dashboard: banner still visible
- ✅ Timer shows increased time (not reset)
- ✅ Console logs: No stop messages

**Pass/Fail:** ___________

---

### Test 4: Tab Switching
**Objective:** Verify recording continues when switching browser tabs

**Steps:**
1. After Test 3, stay on Dashboard
2. Note current recording time (e.g., 0:45)
3. Open new tab (Gmail, YouTube, etc.)
4. Wait 30 seconds in other tab
5. Return to system tab
6. Check banner timer

**Expected Results:**
- ✅ Console shows: "📱 Tab hidden - recording continues"
- ✅ After returning: Timer increased by ~30 seconds
- ✅ Console shows: "📱 Tab visible - recording still active"
- ✅ Recording didn't stop

**Pass/Fail:** ___________

---

### Test 5: 5-Minute Auto-Save (Quick Test - 10 Seconds)
**Objective:** Verify recording would restart after segment

**Note:** Full 5-minute test is time-consuming. For quick test, just verify the logic.

**Steps:**
1. Open browser console
2. Let recording run for 10 seconds
3. Check console for data collection messages

**Expected Results:**
- ✅ Every second, MediaRecorder ondataavailable fires
- ✅ Chunks being collected
- ✅ No errors in console

**Optional Full Test (5 minutes):**
1. Let recording run for exactly 5 minutes
2. At 5:00, check console

**Expected (at 5:00):**
- ✅ "📹 Recording segment completed, uploading..."
- ✅ "✅ Background recording uploaded: background_recording_xxx.webm"
- ✅ Timer resets to 0:00
- ✅ New recording starts

**Pass/Fail:** ___________

---

### Test 6: Video File Creation
**Objective:** Verify videos are saved to backend

**Steps:**
1. Let recording run for 5+ minutes
2. After first segment uploads, check backend folder

```bash
# Windows CMD
dir backend\recordings

# Look for files like:
# background_recording_2025-10-19T14-00-00-123Z.webm
```

**Expected Results:**
- ✅ File exists in `/backend/recordings/`
- ✅ Filename format: `background_recording_<timestamp>.webm`
- ✅ File size: ~15-20 MB
- ✅ File can be opened in video player

**Pass/Fail:** ___________

---

### Test 7: Recordings Page Display
**Objective:** Verify videos appear in Recordings page

**Steps:**
1. After Test 6, navigate to "Recordings" page
2. Check if video appears in list

**Expected Results:**
- ✅ Video appears in table
- ✅ Shows filename
- ✅ Shows date/time
- ✅ Shows file size
- ✅ Can click "Play" and video plays
- ✅ Can click "Download" and file downloads

**Pass/Fail:** ___________

---

### Test 8: Logout Recording Stop
**Objective:** Verify recording stops cleanly on logout

**Steps:**
1. After Test 7, return to Dashboard
2. Note current recording time (e.g., 1:23)
3. Click "Logout" button
4. Check console messages

**Expected Results:**
- ✅ Console shows: "⏹️ Stopping background recording service..."
- ✅ Console shows: "📹 Recording segment completed, uploading..."
- ✅ Console shows: "✅ Background recording uploaded..."
- ✅ Console shows: "✅ Background recording service stopped"
- ✅ Redirected to login page
- ✅ Final video saved (may be < 5 minutes)

**Pass/Fail:** ___________

---

### Test 9: Re-Login Auto-Start
**Objective:** Verify recording starts again on next login

**Steps:**
1. After Test 8 (logged out), login again
2. Username: `1`, Password: `1`
3. Camera permission should be remembered (no popup)
4. Check Dashboard

**Expected Results:**
- ✅ No camera permission popup (already allowed)
- ✅ Recording starts immediately
- ✅ Banner appears with timer at 0:00
- ✅ Console shows startup messages

**Pass/Fail:** ___________

---

### Test 10: Browser Refresh
**Objective:** Verify behavior on page refresh

**Steps:**
1. After Test 9, on Dashboard with recording active
2. Note recording time
3. Press F5 or Ctrl+R to refresh page
4. May need to login again

**Expected Results:**
- ⚠️ Recording stops (expected behavior)
- ⚠️ Current unsaved segment may be lost
- ✅ After login, recording starts fresh
- ✅ Timer starts at 0:00

**Note:** This is expected - refresh breaks WebRTC connection

**Pass/Fail:** ___________

---

## 🔍 Console Log Verification

### Expected Startup Logs
```
🎬 Starting background recording service...
✅ Camera access granted for background recording
✅ Camera registered with backend
🔴 Background recording started - Auto-saves every 5 minutes
```

### Expected During Recording
```
(Every second - MediaRecorder data available)
```

### Expected Tab Switch
```
📱 Tab hidden - background recording continues
📱 Tab visible - recording still active
```

### Expected 5-Minute Upload
```
📹 Recording segment completed, uploading...
✅ Background recording uploaded: background_recording_2025-10-19T14-00-00-123Z.webm
```

### Expected Logout
```
⏹️ Stopping background recording service...
✅ Background recording service stopped
```

---

## 📊 Test Results Summary

| Test | Description | Status | Notes |
|------|-------------|--------|-------|
| 1 | Auto-start on login | ⬜ Pass / ⬜ Fail | |
| 2 | Dashboard status | ⬜ Pass / ⬜ Fail | |
| 3 | Page navigation | ⬜ Pass / ⬜ Fail | |
| 4 | Tab switching | ⬜ Pass / ⬜ Fail | |
| 5 | Auto-save logic | ⬜ Pass / ⬜ Fail | |
| 6 | Video file creation | ⬜ Pass / ⬜ Fail | |
| 7 | Recordings page | ⬜ Pass / ⬜ Fail | |
| 8 | Logout stop | ⬜ Pass / ⬜ Fail | |
| 9 | Re-login auto-start | ⬜ Pass / ⬜ Fail | |
| 10 | Browser refresh | ⬜ Pass / ⬜ Fail | |

---

## 🐛 Common Issues & Solutions

### Issue 1: Camera Permission Denied
**Symptom:** No recording starts, no banner

**Solution:**
1. Click address bar lock icon
2. Camera permissions → Allow
3. Refresh page and login again

### Issue 2: Banner Not Showing
**Symptom:** Recording works but no visual indicator

**Solution:**
1. Make sure you're on Dashboard page (banner only there)
2. Wait 1-2 seconds after login
3. Check console - if recording started, banner should show

### Issue 3: Videos Not Saving
**Symptom:** Recording runs but no files in backend/recordings/

**Solution:**
1. Verify backend is running: http://localhost:5000
2. Check backend console for errors
3. Verify `/backend/recordings/` folder exists
4. Let recording run for full 5 minutes before checking

### Issue 4: Recording Stops on Page Change
**Symptom:** Timer resets when navigating

**Solution:**
- This shouldn't happen with background service
- Check browser console for errors
- Verify backgroundRecordingService is properly imported

### Issue 5: Multiple Recordings Starting
**Symptom:** Multiple red banners or multiple uploads

**Solution:**
- Clear browser cache
- Close all tabs of the system
- Restart browser
- Login fresh

---

## 🎯 Performance Checks

### CPU Usage
- Open Task Manager (Windows) or Activity Monitor (Mac)
- Look for browser process
- CPU should be < 10% when tab is active
- CPU should be < 3% when tab is hidden

### Memory Usage
- Browser memory usage: +50-100 MB while recording
- Should not continuously increase (memory leak)

### Network Usage
- Idle: minimal traffic
- Every 5 minutes: ~15-20 MB upload spike (video upload)

---

## ✅ Final Checklist

Before marking system as "Ready for Production":

- [ ] All 10 tests pass
- [ ] No console errors
- [ ] Videos save correctly
- [ ] Recordings page works
- [ ] CPU usage acceptable
- [ ] Memory usage stable
- [ ] Recording survives tab switches
- [ ] Clean logout/stop behavior
- [ ] Re-login works correctly
- [ ] Videos playable in browser

---

## 📝 Test Report Template

```
Test Date: _______________
Tester Name: _______________
Browser: _______________ (Chrome / Firefox / Edge / Safari)
Browser Version: _______________
OS: _______________ (Windows / Mac / Linux)

Results:
- Tests Passed: ___ / 10
- Tests Failed: ___ / 10
- Critical Issues: _______________
- Minor Issues: _______________

Overall Status: [ ] PASS / [ ] FAIL

Notes:
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## 🚀 Quick Test (5 Minutes)

If you don't have time for full testing:

1. **Login** (1 min)
   - ✅ Recording starts
   - ✅ Banner shows

2. **Navigate** (1 min)
   - ✅ Go to Settings
   - ✅ Return to Dashboard
   - ✅ Timer increased

3. **Tab Switch** (1 min)
   - ✅ Open new tab
   - ✅ Return
   - ✅ Recording continued

4. **Check Files** (1 min)
   - ✅ Wait 5 min or check folder
   - ✅ Video exists

5. **Logout** (1 min)
   - ✅ Recording stops
   - ✅ Clean shutdown

**If all 5 pass → System works! ✅**

---

**Happy Testing! 🎉**
