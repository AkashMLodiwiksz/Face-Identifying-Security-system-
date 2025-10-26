# Quick Reference - Recording System

## Recording Controls

### Dashboard
- **Shows**: Small red indicator "🔴 Recording 0:45" (only when active)
- **Purpose**: Quick status view
- **Controls**: None (read-only)

### Live Monitoring
- **Shows**: Full banner with Start/Stop buttons
- **Purpose**: Complete recording control
- **Controls**: Start (green) / Stop (white) buttons

## Current Behavior

### When Recording is Active
- **Dashboard**: 🔴 Small red bar with timer
- **Live Monitoring**: 🔴 Full red banner "Background Recording Active" + Stop button
- **Auto-segments**: New 2-minute segment every 2 minutes

### When Recording is Stopped
- **Dashboard**: ❌ No indicator (clean view)
- **Live Monitoring**: ⚫ Gray banner "Recording Stopped" + Start button
- **No auto-restart**: Stays stopped until you click Start

## How to Control Recording

| I Want To... | Where to Go | What to Click |
|-------------|-------------|---------------|
| **Start Recording** | Live Monitoring | Green "Start Recording" button |
| **Stop Recording** | Live Monitoring | White "Stop Recording" button |
| **Check Status** | Dashboard or Live Monitoring | Just look at indicator |
| **View Videos** | Recordings page | - |

## Visual Guide

### Dashboard (Minimal)
```
When Recording:  🔴 Recording 2:15
When Stopped:    (nothing shown)
```

### Live Monitoring (Full Control)
```
When Recording:  🔴 Background Recording Active  2:15  [Stop]
When Stopped:    ⚫ Recording Stopped                  [Start]
```

## Key Changes from Before

| Before | Now |
|--------|-----|
| Dashboard had buttons | Dashboard has small indicator only |
| Stop → Auto-restarts | Stop → Stays stopped |
| Controls on Dashboard | Controls in Live Monitoring |

## Where Everything Is

| Feature | Location |
|---------|----------|
| 🎮 **Recording Controls** | Live Monitoring page |
| 👀 **Quick Status View** | Dashboard (top, small bar) |
| 📹 **Watch Recordings** | Recordings page |
| 📷 **Camera Status** | Cameras page |
| 📊 **Statistics** | Dashboard page |

## Files Saved
- **Location**: `/backend/recordings/`
- **Format**: `recording_YYYYMMDD_HHMMSS.webm`
- **Duration**: 2 minutes each
- **Size**: ~37 MB per segment
- **Playback**: Continuous in Recordings page

## Quick Actions

### To Start Recording
1. Go to **Live Monitoring** page
2. Click green **"Start Recording"** button
3. See red banner + timer

### To Stop Recording
1. Go to **Live Monitoring** page
2. Click white **"Stop Recording"** button
3. Current segment saves
4. Recording stays stopped

### To Check Status
1. Go to **Dashboard**
2. Look at top of page
3. Red bar = Recording | Nothing = Stopped

---

**Quick Tips**: 
- 🎯 Dashboard = Quick view only
- �️ Live Monitoring = Full control
- 🛑 Stop really means stop (no auto-restart)
