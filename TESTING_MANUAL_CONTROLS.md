# Testing Manual Recording Controls

## Quick Test Guide - October 26, 2025

### ✅ Prerequisites
- Backend running on http://localhost:5000
- Frontend running on http://localhost:5173
- Logged into the system

### 🧪 Test Steps

#### 1. **Test Auto-Start (Existing Feature)**
1. Open browser and go to http://localhost:5173/login
2. Login with credentials
3. **Expected**: Recording should start automatically
4. **Check**: Dashboard shows red banner "Background Recording Active"
5. **Check**: Timer is counting up

#### 2. **Test Stop Recording (New Feature)**
1. Go to Dashboard
2. Click the **"Stop Recording"** button (white button with square icon)
3. **Expected Results**:
   - Banner turns gray
   - Text changes to "Recording Stopped"
   - Timer disappears
   - Button changes to green "Start Recording" button
   - Current video segment saves to backend
   - Console shows: `⏸️ Pausing background recording...`
   - Console shows: `✅ Camera status updated to: offline`

#### 3. **Test Camera Status Update**
1. While recording is stopped, go to **Cameras** page
2. Look for "Laptop Camera"
3. **Expected**: Status should show "offline" or inactive
4. Go back to Dashboard

#### 4. **Test Start Recording (New Feature)**
1. On Dashboard, click the **"Start Recording"** button (green button with play icon)
2. **Expected Results**:
   - Banner turns red
   - Text changes to "Background Recording Active"
   - Timer appears and starts counting from 0
   - Button changes to white "Stop Recording" button
   - New recording session begins
   - Console shows: `▶️ Resuming background recording...`
   - Console shows: `✅ Camera status updated to: online`

#### 5. **Test Camera Status Update After Start**
1. Go to **Cameras** page
2. Look for "Laptop Camera"
3. **Expected**: Status should show "online" or active

#### 6. **Test Recording Files**
1. Stop and start recording a few times
2. Wait at least 2 minutes while recording
3. Go to **Recordings** page
4. **Expected**: 
   - All recorded segments appear in the list
   - Videos are named with timestamps
   - All videos are playable
   - Continuous playback works

#### 7. **Test Multiple Start/Stop Cycles**
1. Click Stop → Wait 5 seconds → Click Start → Wait 10 seconds
2. Repeat 3-4 times
3. **Expected**:
   - Each cycle creates a new video segment
   - No errors in console
   - Timer resets on each start
   - Status updates correctly each time

### 🔍 What to Check in Browser Console

#### When Stopping Recording:
```
⏸️ Pausing background recording...
✅ Camera status updated to: offline
✅ Recording paused
```

#### When Starting Recording:
```
▶️ Resuming background recording...
✅ Camera status updated to: online
📍 BackgroundRecordingService.startRecording() called
📍 Creating MediaRecorder with stream
📍 MediaRecorder setup complete, starting recording...
✅ Recording resumed
```

### ❌ Common Issues to Watch For

1. **Button doesn't respond**
   - Check console for errors
   - Verify backend is running (http://localhost:5000)

2. **Status doesn't update**
   - Check Network tab for failed PUT request to `/api/cameras/laptop/status`
   - Verify camera exists in database

3. **Recording doesn't actually stop/start**
   - Check console logs for service errors
   - Verify camera permissions are granted

4. **Timer doesn't reset**
   - This is normal - timer should reset when starting new recording

### 📊 Expected Behavior Summary

| Action | Banner Color | Banner Text | Button | Timer | Camera Status |
|--------|-------------|-------------|--------|-------|---------------|
| Login/Auto-start | Red | Background Recording Active | Stop (White) | Counting | Online |
| Click Stop | Gray | Recording Stopped | Start (Green) | Hidden | Offline |
| Click Start | Red | Background Recording Active | Stop (White) | Counting | Online |

### ✅ Success Criteria

- [ ] Stop button stops recording and saves segment
- [ ] Start button resumes recording
- [ ] Banner color changes correctly
- [ ] Banner text updates correctly
- [ ] Button switches between Start/Stop
- [ ] Timer shows when recording, hidden when stopped
- [ ] Camera status updates in backend
- [ ] Camera status visible in Cameras page
- [ ] All videos save to `/backend/recordings/`
- [ ] All videos playable in Recordings page
- [ ] Console shows correct log messages
- [ ] No JavaScript errors in console

### 🎯 Final Verification

1. Start recording
2. Let it record for 3 minutes (should create 1.5 segments)
3. Stop recording
4. Go to Recordings page
5. Verify segments are there
6. Play the videos
7. Check continuous playback works

---

**If all tests pass**: Feature is working correctly! ✅

**If any test fails**: Check console logs and backend logs for error messages.
