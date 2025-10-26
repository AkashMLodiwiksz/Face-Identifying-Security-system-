# 🎥 Video Recording System

## Overview
The system now records live camera feeds as 5-minute video segments in WebM format, stored in the `/backend/recordings/` folder.

## Features

### ✅ Automatic 5-Minute Segments
- Each recording is automatically 5 minutes (300 seconds)
- After 5 minutes, current recording stops and a new one starts automatically
- Continuous recording until you click "Stop Recording"

### 📹 Video Recording Controls
**On Live Monitoring Page:**
- **Start Recording** - Begins recording the live feed
- **Stop Recording** - Stops current recording and saves
- **REC Timer** - Shows recording time (MM:SS format)
- **Red dot indicator** - Blinks while recording

### 📁 File Storage
**Location:** `/backend/recordings/`

**File Format:**
- Format: WebM (vp9 codec)
- Naming: `recording_YYYYMMDD_HHMMSS.webm`
- Example: `recording_20251019_143045.webm`

### 🎬 Recordings Page
**Access:** Click "Recordings" in the sidebar

**Features:**
- **Video List** - Table showing all recordings
- **Statistics** - Total count, total size (MB), storage location
- **Play** - Watch videos directly in the browser
- **Download** - Save videos to your computer
- **Delete** - Remove individual videos
- **Format All** - Delete ALL recordings (⚠️ DANGER!)

## API Endpoints

### 1. Upload Recording
```http
POST /api/recordings/upload
Content-Type: multipart/form-data

Form Data:
- video: File (video blob)
- duration: Number (seconds)
```

**Response:**
```json
{
    "success": true,
    "message": "Video uploaded successfully",
    "filename": "recording_20251019_143045.webm",
    "filepath": "/path/to/file",
    "duration": 300
}
```

### 2. Get All Recordings
```http
GET /api/recordings
```

**Response:**
```json
{
    "recordings": [
        {
            "filename": "recording_20251019_143045.webm",
            "size": 15728640,
            "sizeMB": 15.00,
            "created": "2025-10-19 14:30:45",
            "timestamp": 1729343445
        }
    ],
    "total": 10,
    "totalSizeMB": 150.50
}
```

### 3. Stream/Download Video
```http
GET /api/recordings/{filename}
```
Returns video file for streaming or download.

### 4. Delete Recording
```http
DELETE /api/recordings/{filename}
```

**Response:**
```json
{
    "success": true,
    "message": "Recording deleted"
}
```

### 5. Format All (Delete Everything)
```http
DELETE /api/recordings/format
```

**Response:**
```json
{
    "success": true,
    "message": "All recordings deleted (10 files)",
    "deleted": 10
}
```

## How It Works

### Recording Process

1. **Start Camera** on Live Monitoring page
2. **Click "Start Recording"** button
3. **Recording begins:**
   - MediaRecorder captures video stream
   - Timer starts counting
   - Red "REC" indicator appears
   - Data collected every second
4. **After 5 minutes (300s):**
   - Current recording automatically stops
   - Video saved to backend
   - New recording starts immediately
5. **Click "Stop Recording" anytime** to stop manually

### Video Upload Process

```javascript
// Frontend (WebcamCapture.jsx)
mediaRecorderRef.current.onstop = async () => {
  const blob = new Blob(chunksRef.current, { type: 'video/webm' });
  
  const formData = new FormData();
  formData.append('video', blob, `recording_${Date.now()}.webm`);
  formData.append('duration', recordingTime);

  await fetch('http://localhost:5000/api/recordings/upload', {
    method: 'POST',
    body: formData
  });
};
```

```python
# Backend (app.py)
@app.route('/api/recordings/upload', methods=['POST'])
def upload_recording():
    video_file = request.files['video']
    filename = f'recording_{timestamp}.webm'
    
    recordings_dir = os.path.join(os.path.dirname(__file__), 'recordings')
    video_file.save(os.path.join(recordings_dir, filename))
    
    # Log to database
    log = SystemLog(event_type='video_recorded', ...)
    db.session.add(log)
    db.session.commit()
```

### View Recordings

1. Navigate to **Recordings** page
2. See list of all videos with:
   - Filename
   - Date/Time recorded
   - File size
3. Actions available:
   - ▶️ **Play** - Watch in browser
   - ⬇️ **Download** - Save to computer
   - 🗑️ **Delete** - Remove file

### Format All Recordings

⚠️ **WARNING: This deletes EVERYTHING!**

1. Click "Format All" button
2. Confirm first warning
3. Confirm second warning
4. All files in `/backend/recordings/` deleted
5. Cannot be undone!

## File Structure

```
backend/
├── recordings/                           # Video storage folder
│   ├── recording_20251019_140000.webm   # 5-minute video
│   ├── recording_20251019_140500.webm   # Next 5-minute video
│   ├── recording_20251019_141000.webm   # Another 5-minute video
│   └── ...
├── app.py                                # API endpoints
└── models.py                             # Database models

frontend-react/src/
├── pages/
│   ├── LiveMonitoring.jsx               # Recording controls
│   └── Recordings.jsx                    # Video management
├── components/
│   └── WebcamCapture.jsx                # Recording logic
└── services/
    └── api.js                            # API service
```

## Usage Example

### Record Live Feed

1. **Go to Live Monitoring** page
2. **Start Camera** (if not already on)
3. **Click "Start Recording"** 
4. See timer: REC 0:00
5. Watch it count up: REC 0:01, 0:02, 0:03...
6. At REC 5:00 → Auto-saves and starts new recording
7. **Click "Stop Recording"** whenever done

### Watch Recordings

1. **Go to Recordings** page
2. See all your videos listed
3. **Click Play icon** (▶️) to watch
4. Video opens in player above the list
5. Use browser controls to play/pause/seek
6. **Click Download** (⬇️) to save to computer
7. **Click Delete** (🗑️) to remove file

### Delete Everything

1. **Go to Recordings** page
2. **Click "Format All"** button (red, top-right)
3. **Confirm warning #1** ⚠️
4. **Confirm warning #2** ⚠️
5. All videos deleted
6. Folder empty

## Technical Details

### Video Specs
- **Codec:** VP9 (WebM container)
- **Bitrate:** 2.5 Mbps
- **Duration:** 300 seconds (5 minutes) per file
- **Size:** ~15-20 MB per 5-minute video
- **Quality:** High (suitable for face recognition)

### Browser Compatibility
- ✅ Chrome/Edge: Full support (VP9)
- ✅ Firefox: Full support (VP9)
- ⚠️ Safari: May use H.264 fallback
- ⚠️ Older browsers: WebM fallback

### Storage Considerations
- **1 hour recording** = ~12 files = ~180-240 MB
- **1 day continuous** = ~288 files = ~4-5 GB
- **1 week continuous** = ~2,016 files = ~30-35 GB

**Recommendation:** Use "Format All" regularly to manage disk space!

## Database Logging

All recording events are logged in `system_logs` table:

**Events:**
- `video_recorded` - New video saved
- `video_deleted` - Video removed
- `recordings_formatted` - All videos deleted

**Example Log:**
```json
{
    "event_type": "video_recorded",
    "description": "Video recording saved: recording_20251019_143045.webm (Duration: 300s)",
    "severity": "info",
    "created_at": "2025-10-19 14:35:45"
}
```

## Future Enhancements

- [ ] Convert WebM to MP4 for better compatibility
- [ ] Add video compression options
- [ ] Implement retention policies (auto-delete old videos)
- [ ] Add date range filter on Recordings page
- [ ] Thumbnail generation for videos
- [ ] Multiple quality options (Low/Medium/High)
- [ ] Cloud storage integration (AWS S3, Azure Blob)
- [ ] Time-lapse mode
- [ ] Motion-triggered recording only

## Troubleshooting

### Recording doesn't start
- Check if camera is started
- Ensure browser supports MediaRecorder
- Check browser console for errors

### Video won't play
- Ensure WebM codec is supported
- Try downloading and playing in VLC
- Check file isn't corrupted

### Files not appearing
- Refresh Recordings page
- Check `/backend/recordings/` folder exists
- Verify backend server is running

### Large file sizes
- Expected: ~15-20 MB per 5 minutes
- Reduce bitrate in WebcamCapture.jsx if needed
- Use "Format All" to free up space

## Benefits

✅ **Continuous Recording** - Never miss an event  
✅ **Manageable Segments** - Easy to find specific times  
✅ **Watch Later** - Review any past recording  
✅ **Download** - Keep important videos offline  
✅ **Easy Management** - Delete individual or all files  
✅ **Database Logged** - Track all recording activities  
✅ **Browser-based** - No special software needed  
✅ **High Quality** - Suitable for face recognition
