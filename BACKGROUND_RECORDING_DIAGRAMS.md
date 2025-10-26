# 🎥 Background Recording System - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LOGIN                              │
│                    (username: 1, password: 1)                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                               │
│              POST /api/auth/login                               │
│              ✅ Success: token returned                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKGROUND RECORDING SERVICE                       │
│                                                                 │
│  1. getUserMedia() → Camera permission                          │
│  2. POST /api/cameras/laptop → Register camera                 │
│  3. MediaRecorder.start(1000) → Begin recording                │
│                                                                 │
│  ┌─────────────────────────────────────────────┐              │
│  │  Recording Loop (every 5 minutes)           │              │
│  │                                              │              │
│  │  • Collect video data (chunks)              │              │
│  │  • Stop at 5:00                              │              │
│  │  • Upload to backend                         │              │
│  │  • Start new recording                       │              │
│  │  • Repeat...                                 │              │
│  └─────────────────────────────────────────────┘              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD PAGE                             │
│                                                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ 🔴 Background Recording Active                         ┃  │
│  ┃ Recording Time: 2:34    Auto-saves every 5 minutes    ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                 │
│  [Stats Cards: Cameras, Persons, Intruders, Detections]        │
│  [Recent Alerts] [Camera Status] [System Health]               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ User navigates system
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌────────────┐    ┌────────────────┐    ┌────────────┐
│ Settings   │    │  Recordings    │    │  Cameras   │
│            │    │                │    │            │
│ Recording  │    │ • View videos  │    │ Camera     │
│ continues  │    │ • Download     │    │ list       │
│ ✅         │    │ • Delete       │    │            │
└────────────┘    └────────────────┘    └────────────┘
                            │
                            │ Recording continues in background
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        LOGOUT                                   │
│                                                                 │
│  1. backgroundRecordingService.stop()                           │
│  2. Stop MediaRecorder                                          │
│  3. Upload final video                                          │
│  4. Release camera tracks                                       │
│  5. Clear authentication                                        │
│  6. Redirect to /login                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Recording Timeline

```
Time  │ Event
──────┼────────────────────────────────────────────────────────
0:00  │ 🟢 Login → Recording starts
      │ ├─ Camera permission granted
      │ ├─ Camera registered
      │ └─ MediaRecorder started
      │
0:30  │ 🎬 Recording (collecting data)
      │ └─ Data saved every 1 second (timeslice)
      │
1:00  │ 🎬 Recording continues
      │
2:00  │ 🎬 Recording continues
      │
3:00  │ 🎬 Recording continues
      │
4:00  │ 🎬 Recording continues
      │
5:00  │ 💾 Segment complete!
      │ ├─ Stop MediaRecorder
      │ ├─ Create Blob from chunks
      │ ├─ Upload: background_recording_xxx.webm
      │ └─ ✅ New recording starts (0:00)
      │
5:30  │ 🎬 Recording (new segment)
      │
10:00 │ 💾 Second segment complete
      │ └─ ✅ Third recording starts
      │
15:00 │ 💾 Third segment complete
      │ └─ ✅ Fourth recording starts
      │
...   │ ⟳  Continues until logout
      │
XX:XX │ 🛑 Logout clicked
      │ ├─ Stop current recording
      │ ├─ Upload final video (may be < 5 min)
      │ └─ Camera released
```

---

## Data Flow

```
┌──────────────┐
│   Browser    │
│              │
│  ┌────────┐  │
│  │ Camera │  │
│  └───┬────┘  │
│      │       │
└──────┼───────┘
       │ Video Stream
       ▼
┌──────────────────────────────────────────────────┐
│   Background Recording Service                   │
│                                                  │
│   ┌─────────────────────────────────────────┐   │
│   │  MediaRecorder                          │   │
│   │  • Codec: VP9/VP8                       │   │
│   │  • Bitrate: 2.5 Mbps                    │   │
│   │  • Timeslice: 1000ms                    │   │
│   └─────────────┬───────────────────────────┘   │
│                 │ Chunks (every 1 second)        │
│                 ▼                                │
│   ┌─────────────────────────────────────────┐   │
│   │  Chunks Array                           │   │
│   │  [chunk1, chunk2, ..., chunkN]          │   │
│   └─────────────┬───────────────────────────┘   │
│                 │ Every 5 minutes                │
│                 ▼                                │
│   ┌─────────────────────────────────────────┐   │
│   │  Blob (video/webm)                      │   │
│   │  Size: ~15-20 MB                        │   │
│   └─────────────┬───────────────────────────┘   │
└─────────────────┼────────────────────────────────┘
                  │ HTTP POST (FormData)
                  ▼
┌──────────────────────────────────────────────────┐
│   Backend Server (Flask)                         │
│                                                  │
│   POST /api/recordings/upload                    │
│   ├─ Receive video file                          │
│   ├─ Save to /backend/recordings/               │
│   └─ Log to system_logs table                   │
│                                                  │
│   ┌─────────────────────────────────────────┐   │
│   │  /backend/recordings/                   │   │
│   │                                          │   │
│   │  background_recording_20251019...webm   │   │
│   │  background_recording_20251019...webm   │   │
│   │  background_recording_20251019...webm   │   │
│   └─────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Component Interaction

```
┌─────────────────────────────────────────────────────────┐
│                    Login.jsx                            │
│                                                         │
│  handleSubmit() {                                       │
│    ✅ Authenticate                                       │
│    await backgroundRecordingService.start() ← START    │
│    navigate('/dashboard')                               │
│  }                                                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│         backgroundRecording.js (Service)                │
│                                                         │
│  • Singleton instance                                   │
│  • stream: MediaStream                                  │
│  • mediaRecorder: MediaRecorder                         │
│  • chunks: Array                                        │
│  • recordingTime: number                                │
│  • isRecording: boolean                                 │
│                                                         │
│  Methods:                                               │
│  • start() → Initialize camera & recording              │
│  • startRecording() → Start MediaRecorder              │
│  • stopRecordingSegment() → Stop for 5-min restart    │
│  • uploadVideo(blob) → Send to backend                 │
│  • stop() → Complete shutdown                          │
│  • getStatus() → Return current state                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Status polling (every 1 second)
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                 Dashboard.jsx                           │
│                                                         │
│  useEffect(() => {                                      │
│    setInterval(() => {                                  │
│      const status = service.getStatus() ← CHECK        │
│      setRecordingStatus(status)                         │
│    }, 1000)                                             │
│  }, [])                                                 │
│                                                         │
│  {recordingStatus.isRecording && (                      │
│    <RedBanner>                                          │
│      🔴 Recording: {formatTime(recordingTime)}          │
│    </RedBanner>                                         │
│  )}                                                     │
└─────────────────────────────────────────────────────────┘
                  │
                  │ User clicks Logout
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   Layout.jsx                            │
│                                                         │
│  handleLogout() {                                       │
│    backgroundRecordingService.stop() ← STOP            │
│    clearAuth()                                          │
│    navigate('/login')                                   │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

---

## State Diagram

```
┌─────────────┐
│   STOPPED   │ (Initial state)
└──────┬──────┘
       │ User logs in
       │ backgroundRecordingService.start()
       ▼
┌─────────────┐
│ INITIALIZING│
│             │
│ • Request camera
│ • Register with backend
└──────┬──────┘
       │ Camera granted
       │ startRecording()
       ▼
┌─────────────┐
│  RECORDING  │◄─────┐ Auto-restart every 5 min
│             │      │
│ • Collecting│      │
│ • Timer++   │      │
│ • Timeslice │      │
└──────┬──────┘      │
       │ 5 minutes   │
       │ elapsed     │
       ▼             │
┌─────────────┐      │
│  UPLOADING  │      │
│             │      │
│ • Stop rec  │      │
│ • Create blob│      │
│ • Upload    ├──────┘
└──────┬──────┘
       │ User logs out
       │ backgroundRecordingService.stop()
       ▼
┌─────────────┐
│ STOPPING    │
│             │
│ • Stop rec  │
│ • Upload    │
│ • Release   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   STOPPED   │
└─────────────┘
```

---

## Browser Tab States

```
Scenario: User switches tabs

┌─────────────────────────────────────────────────────────┐
│  TAB ACTIVE (Face Recognition System)                   │
│                                                         │
│  • document.hidden = false                              │
│  • MediaRecorder: RECORDING ✅                          │
│  • Data collection: ACTIVE ✅                           │
│  • UI updates: VISIBLE ✅                               │
│  • Timer: COUNTING ✅                                   │
└─────────────────────────────────────────────────────────┘
                            │
                            │ User switches to Gmail tab
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  TAB HIDDEN (Background)                                │
│                                                         │
│  • document.hidden = true                               │
│  • MediaRecorder: STILL RECORDING ✅                    │
│  • Data collection: STILL ACTIVE ✅                     │
│  • Timeslice: SAVES EVERY 1 SEC ✅                      │
│  • UI updates: PAUSED (no visual changes) ⏸️           │
│  • Timer: STILL COUNTING (but not displayed) ✅         │
│                                                         │
│  Console: "📱 Tab hidden - recording continues"         │
└─────────────────────────────────────────────────────────┘
                            │
                            │ User returns to system tab
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  TAB ACTIVE (Back to Face Recognition System)          │
│                                                         │
│  • document.hidden = false                              │
│  • MediaRecorder: STILL RECORDING ✅                    │
│  • Data collection: STILL ACTIVE ✅                     │
│  • UI updates: RESUMED ✅                               │
│  • Timer: SHOWS UPDATED TIME ✅                         │
│                                                         │
│  Console: "📱 Tab visible - recording still active"     │
└─────────────────────────────────────────────────────────┘
```

---

## Key Innovations

### 1. Singleton Service Pattern
```javascript
// One instance shared across entire app
const backgroundRecordingService = new BackgroundRecordingService();
export default backgroundRecordingService;

// Any component can access:
import backgroundRecordingService from '../services/backgroundRecording';
```

### 2. Timeslice for Reliability
```javascript
// Without timeslice:
mediaRecorder.start() → Data only saved on stop() → Tab switch = DATA LOSS ❌

// With timeslice:
mediaRecorder.start(1000) → Data saved every 1 second → Tab switch = NO LOSS ✅
```

### 3. Auto-Restart Logic
```javascript
mediaRecorder.onstop = async () => {
  await uploadVideo(blob);
  
  // Check if still logged in
  if (isInitialized && stream) {
    // Start next segment
    setTimeout(() => {
      recordingTime = 0;
      startRecording();
    }, 1000);
  }
};
```

### 4. Visibility API Handling
```javascript
// Monitor but don't stop
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Tab hidden - recording continues');
    // DON'T stop recording!
  }
});
```

---

## 🎉 Result

**Before:** Manual recording, stops when leaving page  
**After:** Automatic, continuous, system-wide recording!

✅ Zero user effort  
✅ Works everywhere  
✅ Never stops accidentally  
✅ Clean shutdown on logout  

**It just works!** 🚀
