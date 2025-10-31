# 🎥 CCTV Camera Setup Guide - IP: 192.168.137.189

## ✅ Your Camera Configuration

**Camera IP Address:** `192.168.137.189`  
**Type:** Dual WiFi CCTV Camera with PTZ  
**Features:** Night Vision, Full Color Mode, Pan-Tilt-Zoom

---

## 🚀 Quick Setup Steps

### 1. Add Camera to System

1. **Login** to your security system: http://localhost:5173
2. Go to **"Cameras"** page
3. Click **"Add Camera"** button
4. Fill in the form:

```
Camera Name: Main CCTV Camera
Location: Your Location (e.g., "Front Entrance")
RTSP URL: rtsp://admin:admin@192.168.137.189:554/stream1
Camera Type: CCTV
Resolution: 1920x1080
FPS: 25
Enable PTZ: ✓ (Check this box)
```

5. Click **"Add Camera"**
6. Click **"Test"** to verify connection

### 2. Add Second Camera (Dual Camera)

For your dual camera setup, add the second stream:

```
Camera Name: Main CCTV Camera (Stream 2)
Location: Your Location (same as above)
RTSP URL: rtsp://admin:admin@192.168.137.189:554/stream2
Camera Type: CCTV
Resolution: 1280x720
FPS: 25
Enable PTZ: ✓
```

---

## 📡 RTSP URL Formats

### Common Stream Paths for Your Camera:

Try these RTSP URLs (replace username/password if different):

```
Main Stream (High Quality):
rtsp://admin:admin@192.168.137.189:554/stream1
rtsp://admin:admin@192.168.137.189:554/ch0
rtsp://admin:admin@192.168.137.189:554/live
rtsp://admin:admin@192.168.137.189:554/h264

Sub Stream (Lower Quality):
rtsp://admin:admin@192.168.137.189:554/stream2
rtsp://admin:admin@192.168.137.189:554/ch1
```

### Test RTSP URL with VLC

1. Open **VLC Media Player**
2. Press `Ctrl+N` (Media → Open Network Stream)
3. Enter: `rtsp://admin:admin@192.168.137.189:554/stream1`
4. Click **Play**
5. If video shows → URL is correct! ✅

---

## 🎮 PTZ Controls

Once your camera is added and showing in **Live Monitoring** page:

### Directional Controls
- **⬆️ Up** - Tilt camera up
- **⬇️ Down** - Tilt camera down
- **⬅️ Left** - Pan camera left
- **➡️ Right** - Pan camera right
- **🏠 Home** - Reset to default position

### Zoom Controls
- **🔍 Zoom In** - Zoom into scene
- **🔍 Zoom Out** - Zoom out from scene

### How to Use PTZ
1. Go to **Live Monitoring** page
2. Your CCTV camera will show with control panel
3. Click and hold directional arrows to move camera
4. Release to stop movement
5. Click Home button to reset position

---

## 🌙 Night Vision & Full Color Modes

Your camera supports three vision modes:

### 1. **Auto Mode** (Recommended) 🌅
- Automatically switches between color and night vision
- Uses ambient light sensor
- Color during day, IR at night

### 2. **Night Vision Mode** (IR) 🌙
- Forces infrared night vision
- Black & white image
- Works in complete darkness
- Uses IR LEDs

### 3. **Full Color Mode** ☀️
- Forces full color at all times
- Requires external lighting at night
- Best image quality
- No IR LEDs used

### Change Vision Mode
1. Go to **Live Monitoring** page
2. Find **"Vision Mode"** section in control panel
3. Click:
   - **Auto** - For automatic switching
   - **Night** - For night vision (IR)
   - **Color** - For full color mode

---

## 📺 Viewing Live Feed

### Grid View (Multiple Cameras)
1. Go to **Live Monitoring** page
2. Click **Grid View** button (top right)
3. All cameras shown in grid layout
4. Click **"Start Live Feed"** on your CCTV camera card

### Single View (Full Screen)
1. Go to **Live Monitoring** page
2. Click **Single View** button (top right)
3. Select your camera from dropdown
4. Click **"Start Live Feed"**
5. Full screen with all controls visible

---

## 🔧 Camera Settings

### Access Camera Web Interface

1. Open browser
2. Go to: `http://192.168.137.189`
3. Login with credentials (usually `admin` / `admin`)
4. Navigate to settings:
   - **Network** → RTSP settings
   - **Image** → Resolution, FPS
   - **PTZ** → Movement settings
   - **Video** → Night vision mode

### Important Settings to Check

**Network Settings:**
- RTSP Port: 554 (default)
- RTSP Authentication: Enable
- Multicast: Disable (for unicast streaming)

**Video Settings:**
- Main Stream: 1920x1080, 25fps
- Sub Stream: 1280x720, 15fps
- Encoding: H.264

**PTZ Settings:**
- PTZ Protocol: Enable
- Speed: Medium
- Auto Return: Enable (returns to home after idle)

---

## 🎯 Features Now Available

✅ **Live Camera Feed** - View real-time stream  
✅ **PTZ Controls** - Pan, Tilt, Zoom remotely  
✅ **Night Vision** - Auto/Manual IR switching  
✅ **Full Color Mode** - Force color in low light  
✅ **Dual Stream** - Add both camera streams  
✅ **Grid View** - See all cameras at once  
✅ **Single View** - Focus on one camera  
✅ **Fullscreen Mode** - Maximize camera view  
✅ **Connection Status** - Live indicator  

---

## 🐛 Troubleshooting

### Camera Not Connecting?

**Check 1: Network Connection**
```cmd
ping 192.168.137.189
```
Should show replies. If "Request timed out":
- Check camera power
- Check ethernet cable
- Verify both devices on same network

**Check 2: RTSP Port**
```cmd
telnet 192.168.137.189 554
```
If connection fails:
- Port 554 might be blocked
- RTSP might be disabled in camera
- Check firewall settings

**Check 3: Credentials**
- Default username: `admin`
- Default password: `admin` or `12345` or blank
- Check camera manual for defaults
- Try accessing web interface to verify

### PTZ Not Working?

1. Verify PTZ is checked when adding camera
2. Check camera supports PTZ (should be in specs)
3. Enable PTZ in camera's web interface
4. Check PTZ protocol is correct in camera settings

### Night Vision Not Switching?

1. Check camera's IR sensor is working
2. Cover camera lens to trigger night mode
3. In camera settings, ensure IR is set to "Auto"
4. Check IR LEDs are functioning (red glow visible)

### Video Quality Poor?

1. Use Main Stream (stream1) for better quality
2. Increase bitrate in camera settings
3. Check resolution is set to 1920x1080
4. Ensure good network bandwidth
5. Reduce FPS if bandwidth limited

---

## 📊 Optimal Settings

### For Best Quality
```
Stream: Main (stream1)
Resolution: 1920x1080
FPS: 25
Bitrate: 4096 kbps
Encoding: H.264
```

### For Network Efficiency
```
Stream: Sub (stream2)
Resolution: 1280x720
FPS: 15
Bitrate: 1024 kbps
Encoding: H.264
```

---

## 🎥 Common Camera Commands

### Test Stream with FFmpeg
```cmd
ffplay rtsp://admin:admin@192.168.137.189:554/stream1
```

### Test Stream with cURL
```cmd
curl -v rtsp://admin:admin@192.168.137.189:554/stream1
```

### Check Camera Info
```cmd
curl http://192.168.137.189/cgi-bin/magicBox.cgi?action=getSystemInfo
```

---

## ✨ Usage Workflow

### Daily Monitoring
1. Open system: http://localhost:5173
2. Login with your credentials
3. Go to **Live Monitoring**
4. Click **Grid View** to see all cameras
5. Camera feeds auto-start
6. Use PTZ controls as needed
7. Switch vision mode based on lighting

### Night Time
1. System auto-switches to night vision
2. Or manually select **Night Mode**
3. IR LEDs activate automatically
4. Black & white view with IR illumination

### Day Time / Well-Lit Area
1. System uses color mode
2. Or manually select **Auto** or **Color**
3. Full color video feed
4. Best image quality

---

## 📱 Camera Specifications

**Your Camera IP:** 192.168.137.189  
**Type:** Dual WiFi CCTV Camera  
**Features:**
- ✅ PTZ (Pan-Tilt-Zoom)
- ✅ Night Vision (IR)
- ✅ Full Color Mode
- ✅ Dual Stream Support
- ✅ 1080p Resolution
- ✅ RTSP Streaming

**Streams:**
- Main: 1920x1080 @ 25fps
- Sub: 1280x720 @ 15fps

---

## 🚀 Next Steps

1. **Add your camera** using the steps above
2. **Test RTSP URL** with VLC first
3. **Go to Live Monitoring** to view feed
4. **Test PTZ controls** - Pan/Tilt/Zoom
5. **Try vision modes** - Auto/Night/Color
6. **Add second stream** if needed

---

## 💡 Pro Tips

1. **Use Main Stream** for recording, Sub Stream for live viewing
2. **Set Night Vision to Auto** for hands-free operation
3. **Create PTZ Presets** in camera settings for quick positions
4. **Enable Motion Detection** in camera for alerts
5. **Schedule Recording** during specific hours
6. **Use Sub Stream** when viewing multiple cameras to save bandwidth

---

## 📞 Need Help?

**Camera not in the list?**
- IP may have changed
- Try IP scanner tool
- Check router's connected devices
- Reset camera to factory defaults

**Stream not loading?**
- Test with VLC first
- Verify credentials
- Check RTSP URL format
- Ensure port 554 is open

**PTZ not responding?**
- Enable PTZ in camera settings
- Check PTZ checkbox when adding camera
- Verify camera actually supports PTZ

---

**Your camera at `192.168.137.189` is ready to use!** 

Start by adding it to the Cameras page, then view it in Live Monitoring with full PTZ and night vision controls! 🎥✨
