# 🎥 CCTV Camera RTSP URL Quick Reference

## Common Camera Brands

### Hikvision
```
rtsp://[username]:[password]@[ip]:554/Streaming/Channels/101
rtsp://[username]:[password]@[ip]:554/Streaming/Channels/102  (Sub-stream)
rtsp://[username]:[password]@[ip]:554/h264/ch1/main/av_stream
```

### Dahua
```
rtsp://[username]:[password]@[ip]:554/cam/realmonitor?channel=1&subtype=0  (Main)
rtsp://[username]:[password]@[ip]:554/cam/realmonitor?channel=1&subtype=1  (Sub)
```

### Amcrest
```
rtsp://[username]:[password]@[ip]:554/cam/realmonitor?channel=1&subtype=0
```

### Axis
```
rtsp://[username]:[password]@[ip]:554/axis-media/media.amp
rtsp://[username]:[password]@[ip]:554/axis-media/media.amp?videocodec=h264
```

### Foscam
```
rtsp://[username]:[password]@[ip]:554/videoMain
rtsp://[username]:[password]@[ip]:554/videoSub
```

### TP-Link
```
rtsp://[username]:[password]@[ip]:554/stream1  (High quality)
rtsp://[username]:[password]@[ip]:554/stream2  (Low quality)
```

### Reolink
```
rtsp://[username]:[password]@[ip]:554/h264Preview_01_main  (Main)
rtsp://[username]:[password]@[ip]:554/h264Preview_01_sub   (Sub)
```

### Uniview (UNV)
```
rtsp://[username]:[password]@[ip]:554/unicast/c1/s0/live  (Main)
rtsp://[username]:[password]@[ip]:554/unicast/c1/s1/live  (Sub)
```

### Zosi
```
rtsp://[username]:[password]@[ip]:554/11
```

### Annke
```
rtsp://[username]:[password]@[ip]:554/Streaming/Channels/101
```

### Wyze Cam (with firmware mod)
```
rtsp://[ip]:8554/unicast
```

### Eufy
```
rtsp://[username]:[password]@[ip]:8554/live0  (High)
rtsp://[username]:[password]@[ip]:8554/live1  (Medium)
rtsp://[username]:[password]@[ip]:8554/live2  (Low)
```

## Generic Formats

### Standard IP Camera
```
rtsp://[ip]:554/live
rtsp://[ip]:554/stream1
rtsp://[ip]:554/video
rtsp://[ip]:554/ch0
rtsp://[ip]:554/11
```

### With Authentication
```
rtsp://[username]:[password]@[ip]:554/[path]
```

### Custom Port
```
rtsp://[username]:[password]@[ip]:[port]/[path]
```

## Common Ports
- **554**: Default RTSP port
- **8554**: Alternative RTSP port
- **88**: Some Hikvision models
- **37777**: Some Dahua models

## Username/Password Examples
- **Default Hikvision**: admin / 12345
- **Default Dahua**: admin / admin
- **Default Amcrest**: admin / password
- **Default TP-Link**: admin / admin
- **Default Foscam**: admin / (blank)

> ⚠️ **Security Note**: Always change default passwords!

## Finding Your Camera's RTSP URL

### Method 1: Camera Web Interface
1. Find camera IP (check router)
2. Open browser: `http://[camera-ip]`
3. Login with credentials
4. Look for: Network → RTSP / Stream Settings
5. Note the stream path and port

### Method 2: Mobile App
1. Open camera manufacturer's app
2. Go to camera settings
3. Look for "RTSP" or "Stream URL"
4. Some apps show the URL directly

### Method 3: ONVIF Device Manager
1. Download ONVIF Device Manager (free tool)
2. Scan your network
3. Find your camera
4. View RTSP stream URLs

### Method 4: Try Common Patterns
1. Start with: `rtsp://admin:password@[ip]:554/`
2. Add common paths:
   - `/stream1`
   - `/live`
   - `/h264`
   - `/video`
3. Test each in VLC

## Testing RTSP URL

### Using VLC Media Player
1. Open VLC
2. Media → Open Network Stream (Ctrl+N)
3. Enter RTSP URL
4. Click Play
5. ✅ If video shows: URL is correct!

### Using FFmpeg
```cmd
ffplay "rtsp://admin:password@192.168.1.100:554/stream1"
```

### Using curl
```cmd
curl -v "rtsp://admin:password@192.168.1.100:554/stream1"
```

## Example Configurations

### Home Network Setup
```
Camera IP: 192.168.1.100
Username: admin
Password: mycamera123
Port: 554
Path: /stream1

Full URL:
rtsp://admin:mycamera123@192.168.1.100:554/stream1
```

### Multiple Cameras
```
Front Door:  rtsp://admin:pass@192.168.1.100:554/stream1
Back Yard:   rtsp://admin:pass@192.168.1.101:554/stream1
Garage:      rtsp://admin:pass@192.168.1.102:554/stream1
Driveway:    rtsp://admin:pass@192.168.1.103:554/stream1
```

## Troubleshooting

### URL Not Working?
1. **Ping the camera**: `ping 192.168.1.100`
2. **Access web interface**: `http://192.168.1.100`
3. **Check RTSP is enabled** in camera settings
4. **Verify port 554 is open**
5. **Try with VLC first**

### Special Characters in Password
If password has special characters:
```
@ → %40
: → %3A
/ → %2F
? → %3F
# → %23
```

Example:
```
Password: pass@123
URL: rtsp://admin:pass%40123@192.168.1.100:554/stream1
```

## Stream Quality Options

Most cameras offer multiple streams:

### Main Stream (High Quality)
- Higher resolution (1080p, 4K)
- Higher bitrate
- More bandwidth
- Use for recording

### Sub Stream (Low Quality)
- Lower resolution (720p, 480p)
- Lower bitrate
- Less bandwidth
- Use for live viewing

Example:
```
Main: rtsp://admin:pass@192.168.1.100:554/Streaming/Channels/101
Sub:  rtsp://admin:pass@192.168.1.100:554/Streaming/Channels/102
```

## Quick Start Checklist

- [ ] Find camera IP address
- [ ] Verify camera credentials
- [ ] Check RTSP is enabled
- [ ] Identify stream path
- [ ] Build complete URL
- [ ] Test in VLC
- [ ] Add to security system
- [ ] Test connection

## Need Help?

1. **Check camera manual** (usually has RTSP info)
2. **Search online**: "[Camera Model] RTSP URL"
3. **Try manufacturer support**
4. **Use ONVIF Device Manager**
5. **Check camera forums**

---

**Remember**: Test your RTSP URL in VLC before adding it to the system!

**Format**: `rtsp://username:password@ip:port/path`
