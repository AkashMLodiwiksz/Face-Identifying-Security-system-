# 📸 Live Camera Capture System

## Overview
The Live Monitoring system now automatically saves captured frames to the database with timestamps, allowing you to review them later.

## Features

### ✅ Automatic Frame Capture & Storage
- Every captured frame is saved to the database
- Images are stored in `/backend/captures/` folder
- Each capture includes timestamp (date & time)
- Captures are linked to the camera that recorded them

### 📊 Database Storage
**Tables Used:**
- `cameras` - Stores camera information (laptop camera registered as "Laptop Camera")
- `detection_events` - Each capture creates a detection event record
- `system_logs` - Logs all capture activities

**Detection Event Fields:**
```python
{
    "id": 1,
    "camera_id": 1,
    "person_id": null,  # Will be set after face recognition
    "detection_type": "face",
    "confidence": 0.0,
    "timestamp": "2025-10-19 14:30:45",
    "image_path": "capture_1_20251019_143045_123456.jpg"
}
```

### 🖼️ Capture Gallery
**Features:**
- Grid view of all saved captures
- Hover to see date and time
- Sorted by newest first
- Shows total capture count
- Pagination support (50 captures per page)

### 🔗 API Endpoints

#### 1. Register Laptop Camera
```http
POST /api/cameras/laptop
```
**Response:**
```json
{
    "success": true,
    "message": "Laptop camera registered",
    "cameraId": 1
}
```

#### 2. Process & Save Frame
```http
POST /api/detection/process-frame
Content-Type: application/json

{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "cameraId": 1
}
```
**Response:**
```json
{
    "success": true,
    "message": "Frame processed and saved successfully",
    "detectionId": 123,
    "filename": "capture_1_20251019_143045_123456.jpg",
    "timestamp": "2025-10-19 14:30:45",
    "faces_detected": 0
}
```

#### 3. Get All Saved Captures
```http
GET /api/captures?page=1&perPage=50&cameraId=1
```
**Response:**
```json
{
    "captures": [
        {
            "id": 123,
            "cameraId": 1,
            "filename": "capture_1_20251019_143045_123456.jpg",
            "timestamp": "2025-10-19 14:30:45",
            "date": "2025-10-19",
            "time": "14:30:45",
            "confidence": 0.0,
            "isAuthorized": false
        }
    ],
    "total": 150,
    "pages": 3,
    "current_page": 1,
    "per_page": 50
}
```

#### 4. Get Capture Image
```http
GET /api/captures/capture_1_20251019_143045_123456.jpg
```
Returns the actual JPEG image file.

#### 5. Get Detection Events
```http
GET /api/detections
```
Returns last 100 detection events.

## How It Works

### 1. Camera Registration
When you open the Live Monitoring page:
- Frontend calls `POST /api/cameras/laptop`
- Backend creates/updates "Laptop Camera" in database
- Returns camera ID for future use

### 2. Frame Capture Process
When you click "Capture Frame" button:
1. Frontend captures current video frame
2. Converts to base64 JPEG
3. Sends to backend via `POST /api/detection/process-frame`
4. Backend:
   - Decodes base64 image
   - Saves to `/backend/captures/` folder
   - Creates `DetectionEvent` record
   - Creates `SystemLog` entry
   - Returns success with filename and timestamp

### 3. Gallery Display
On page load and after each capture:
- Frontend calls `GET /api/captures`
- Displays images in grid layout
- Shows date/time on hover
- Images loaded via `GET /api/captures/{filename}`

## File Structure

```
backend/
├── captures/                          # Saved capture images
│   ├── capture_1_20251019_143045.jpg
│   ├── capture_1_20251019_143046.jpg
│   └── ...
├── app.py                            # Flask endpoints
└── models.py                         # Database models

frontend-react/src/
├── pages/
│   └── LiveMonitoring.jsx           # Main monitoring page
├── components/
│   └── WebcamCapture.jsx            # Camera component
└── services/
    └── api.js                        # API service
```

## Usage Example

### Basic Workflow
1. **Open Live Monitoring** → Camera registers automatically
2. **Start Camera** → Status becomes "ACTIVE"
3. **Click "Capture Frame"** → Frame saved to database
4. **View Gallery Below** → See all saved captures with timestamps
5. **Hover Over Image** → See exact date and time

### Timestamps Format
- **Database**: `2025-10-19 14:30:45` (ISO format)
- **Display Date**: `2025-10-19`
- **Display Time**: `14:30:45`
- **Filename**: `capture_1_20251019_143045_123456.jpg`

## Future Enhancements
- [ ] Automatic capture every N seconds
- [ ] Face detection on captured frames
- [ ] Face recognition against authorized persons
- [ ] Filter captures by date range
- [ ] Download captures as ZIP
- [ ] Delete old captures (retention policy)
- [ ] Search captures by person
- [ ] Video recording (not just frames)

## Benefits
✅ **Historical Record** - Review all past captures
✅ **Timestamp Tracking** - Know exactly when each frame was captured
✅ **Database Integrity** - All data safely stored in PostgreSQL
✅ **Scalable** - Pagination supports thousands of captures
✅ **Future-Ready** - Ready for face detection integration
