# CCTV Camera Integration Guide

## Overview
The Face-Identifying Security System now supports comprehensive CCTV camera integration with full management capabilities for IP cameras, RTSP streams, and PTZ (Pan-Tilt-Zoom) cameras.

## Features

### 1. Camera Management
- ✅ Add multiple CCTV cameras per user
- ✅ Support for various camera types (IP, CCTV, USB, PTZ)
- ✅ RTSP stream integration
- ✅ Real-time camera status monitoring
- ✅ User-specific camera isolation
- ✅ Full CRUD operations (Create, Read, Update, Delete)

### 2. Camera Configuration
Each camera can be configured with:
- **Name**: Custom identifier for the camera
- **Location**: Physical location (e.g., "Front Door", "Parking Lot")
- **RTSP URL**: Connection string for IP/CCTV cameras
- **Camera Type**: IP Camera, CCTV, USB, or PTZ
- **Resolution**: From 640x480 up to 4K (3840x2160)
- **FPS**: Frame rate (1-60 fps)
- **PTZ Controls**: Enable/disable Pan-Tilt-Zoom functionality

### 3. Camera Status
- **Online/Offline** status indicators
- **Connection testing** feature
- **Real-time status updates**
- Visual indicators (WiFi icons, status badges)

## API Endpoints

### Get All Cameras
```http
GET /api/cameras?username={username}
```
Returns all cameras for the specified user.

### Add New Camera
```http
POST /api/cameras
Content-Type: application/json

{
  "username": "your_username",
  "name": "Front Door Camera",
  "location": "Main Entrance",
  "rtsp_url": "rtsp://admin:password@192.168.1.100:554/stream",
  "camera_type": "IP",
  "fps": 30,
  "resolution": "1920x1080",
  "is_ptz": false
}
```

### Get Single Camera
```http
GET /api/cameras/{camera_id}?username={username}
```

### Update Camera
```http
PUT /api/cameras/{camera_id}
Content-Type: application/json

{
  "username": "your_username",
  "name": "Updated Camera Name",
  "location": "New Location",
  "status": "online"
}
```

### Delete Camera
```http
DELETE /api/cameras/{camera_id}?username={username}
```

### Test Camera Connection
```http
POST /api/cameras/{camera_id}/test
Content-Type: application/json

{
  "username": "your_username"
}
```

## RTSP URL Format

### Standard Format
```
rtsp://[username]:[password]@[ip_address]:[port]/[path]
```

### Examples

#### Hikvision
```
rtsp://admin:password123@192.168.1.100:554/Streaming/Channels/101
```

#### Dahua
```
rtsp://admin:password123@192.168.1.101:554/cam/realmonitor?channel=1&subtype=0
```

#### Amcrest
```
rtsp://admin:password123@192.168.1.102:554/cam/realmonitor?channel=1&subtype=1
```

#### TP-Link
```
rtsp://admin:password123@192.168.1.103:554/stream1
```

#### Generic IP Camera
```
rtsp://admin:password123@192.168.1.104:554/live/ch00_0
```

## Usage Guide

### Adding a CCTV Camera

1. **Navigate to Cameras Page**
   - Click on "Cameras" in the sidebar navigation

2. **Click "Add Camera" Button**
   - Fill in the camera details:
     - **Camera Name**: Give it a descriptive name
     - **Location**: Where the camera is installed
     - **RTSP URL**: Your camera's stream URL
     - **Camera Type**: Select IP/CCTV/USB/PTZ
     - **Resolution**: Choose appropriate resolution
     - **FPS**: Set frame rate
     - **PTZ**: Enable if your camera supports it

3. **Save Camera**
   - Click "Add Camera" to save
   - The camera will be added with "offline" status initially

4. **Test Connection**
   - Click the "Test" button on the camera card
   - System will verify connection to the camera
   - Status will update to "online" if successful

### Editing a Camera

1. Click the "Edit" button on any camera card
2. Modify the desired fields
3. Click "Update Camera" to save changes

### Deleting a Camera

1. Click the trash icon on the camera card
2. Confirm deletion in the popup dialog
3. Camera will be permanently removed

### Testing Connection

1. Click the "Test" button on any camera card
2. System will attempt to connect to the camera
3. Success/failure message will be displayed
4. Status will update accordingly

## Database Schema

### Camera Model
```python
class Camera(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200))
    rtsp_url = db.Column(db.String(500))
    camera_type = db.Column(db.String(20), default='IP')
    status = db.Column(db.String(20), default='offline')
    is_active = db.Column(db.Boolean, default=True)
    is_ptz = db.Column(db.Boolean, default=False)
    fps = db.Column(db.Integer, default=30)
    resolution = db.Column(db.String(20), default='1920x1080')
    username = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

## Frontend Components

### Camera Card Features
- **Status Indicator**: WiFi icon (connected/disconnected)
- **Camera Type Icon**: Different icons for IP, CCTV, USB, PTZ
- **Details Display**: Location, resolution, FPS, status
- **Action Buttons**: Test, Edit, Delete
- **PTZ Badge**: Shows if PTZ is enabled

### Modal Form
- **Responsive Design**: Works on mobile and desktop
- **Form Validation**: Required fields marked with *
- **Helpful Hints**: RTSP format hints
- **Dark Mode Support**: Full dark mode compatibility

## Security Features

1. **User Isolation**: Each user can only see/manage their own cameras
2. **Username Validation**: All endpoints require username parameter
3. **Database Constraints**: Cameras are linked to user accounts
4. **URL Protection**: RTSP URLs stored securely in database

## Common RTSP Ports

- **554**: Default RTSP port
- **8554**: Alternative RTSP port
- **88**: Some Hikvision cameras
- **37777**: Some Dahua cameras

## Troubleshooting

### Camera Won't Connect
1. Verify RTSP URL is correct
2. Check username/password in URL
3. Ensure camera is on same network
4. Test camera with VLC Media Player first
5. Check firewall settings

### Getting RTSP URL from Your Camera
1. Check camera manufacturer's documentation
2. Look in camera's web interface (usually under Network > RTSP)
3. Try common URLs for your camera brand
4. Use camera manufacturer's app to find URL

### Status Shows Offline
- Click "Test" button to retry connection
- Verify camera is powered on
- Check network connectivity
- Ensure RTSP port is open

## Next Steps

### Future Enhancements
- [ ] Live video streaming in browser
- [ ] Motion detection integration
- [ ] Face recognition on camera streams
- [ ] Recording from CCTV cameras
- [ ] PTZ control interface
- [ ] Camera groups/zones
- [ ] Notification alerts
- [ ] Multi-camera view dashboard

## Support

For issues or questions:
1. Check RTSP URL format
2. Verify camera network settings
3. Test with VLC: `vlc rtsp://your-camera-url`
4. Check backend server logs
5. Review browser console for errors

## Example Setup

### Step-by-Step Example

1. **Find Your Camera's IP**
   ```cmd
   arp -a
   ```
   or check your router's connected devices

2. **Access Camera Web Interface**
   - Open browser: `http://192.168.1.100`
   - Login with camera credentials

3. **Enable RTSP in Camera Settings**
   - Go to Network > RTSP
   - Enable RTSP stream
   - Note the stream path

4. **Get Complete RTSP URL**
   ```
   rtsp://admin:password123@192.168.1.100:554/stream1
   ```

5. **Test with VLC**
   - Open VLC > Media > Open Network Stream
   - Paste RTSP URL
   - Click Play

6. **Add to Security System**
   - Go to Cameras page
   - Click "Add Camera"
   - Enter all details
   - Click "Add Camera"
   - Test connection

---

**Note**: This system requires the backend server to be running on `http://localhost:5000` and proper database migrations applied.
