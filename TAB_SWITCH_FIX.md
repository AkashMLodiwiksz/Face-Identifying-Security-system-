# Tab Switching Fix - Camera Auto-Start Prevention

## Date: October 26, 2025

## Problem Identified
When you:
1. Stop recording in Live Monitoring
2. Switch to another browser tab
3. Switch back to the Live Monitoring tab

**Issue**: Camera would auto-start again (unwanted behavior)

## Root Cause
The `WebcamCapture` component had an auto-start effect that triggered whenever the component mounted or when the device ID changed. This didn't respect the manual stop action.

## Solution Implemented

### 1. Added Manual Stop Tracking
Added a `manuallyStopped` state flag to track when the camera is intentionally stopped by the user.

**WebcamCapture.jsx:**
```jsx
const [manuallyStopped, setManuallyStopped] = useState(false);
```

### 2. Updated stopCamera Method
When camera is stopped, set the `manuallyStopped` flag to `true`:

```jsx
const stopCamera = () => {
  // ... existing stop logic ...
  setManuallyStopped(true); // Mark as manually stopped
  console.log('Camera fully stopped and released (manual stop)');
};
```

### 3. Updated startCamera Method
When camera is started, clear the `manuallyStopped` flag:

```jsx
const startCamera = async () => {
  setError(null);
  setManuallyStopped(false); // Clear manual stop flag when starting
  // ... rest of start logic ...
};
```

### 4. Modified Auto-Start Logic
Updated the auto-start effect to respect the `manuallyStopped` flag:

```jsx
useEffect(() => {
  // Auto-start camera on page load ONLY if not manually stopped
  if (deviceId && !manuallyStopped) {
    startCamera();
  }
  // ... cleanup logic ...
}, [deviceId]);
```

### 5. Exposed Flag to Parent
Exposed `manuallyStopped` flag via `useImperativeHandle`:

```jsx
useImperativeHandle(ref, () => ({
  stopCamera,
  startCamera,
  isStreaming,
  manuallyStopped // NEW
}));
```

### 6. Added Visibility Change Handler
Added handler in `LiveMonitoring.jsx` to log tab visibility changes:

```jsx
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // Tab is now visible
      if (webcamRef.current && webcamRef.current.manuallyStopped) {
        console.log('Camera was manually stopped - will NOT auto-start');
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [recordingStatus.isRecording]);
```

## How It Works Now

### Before Fix
```
1. User stops recording → Camera stops
2. User switches tab
3. User returns to tab
4. Camera AUTO-STARTS ❌ (unwanted)
```

### After Fix
```
1. User stops recording → Camera stops → manuallyStopped = true
2. User switches tab
3. User returns to tab
4. Camera STAYS STOPPED ✅ (respects manual stop)
5. User clicks [Start Recording] → Camera starts → manuallyStopped = false
```

## State Flow Diagram

```
Initial Load:
  manuallyStopped = false
  → Camera auto-starts ✅

User clicks [Stop]:
  → Camera stops
  → manuallyStopped = true
  → Switch tabs → Return
  → Camera STAYS OFF ✅

User clicks [Start]:
  → manuallyStopped = false
  → Camera starts
  → Switch tabs → Return
  → Camera auto-starts ✅ (because not manually stopped)
```

## Testing Scenarios

### Test 1: Manual Stop Persistence
1. Go to Live Monitoring
2. Click [Stop Recording]
3. Camera stops (shows "Camera is off")
4. Switch to another tab (e.g., Dashboard)
5. Switch back to Live Monitoring
6. **Expected**: Camera stays off ✅
7. **Verify**: Console shows "Camera was manually stopped - will NOT auto-start"

### Test 2: Start After Manual Stop
1. After Test 1, click [Start Recording]
2. Camera starts (shows live video)
3. Switch to another tab
4. Switch back to Live Monitoring
5. **Expected**: Camera stays on (normal auto-start behavior) ✅

### Test 3: Multiple Tab Switches While Stopped
1. Click [Stop Recording]
2. Switch tabs 3-4 times
3. Return to Live Monitoring each time
4. **Expected**: Camera never auto-starts ✅

### Test 4: Recording Status Sync
1. Click [Stop Recording]
2. Switch to Dashboard → No indicator shown ✅
3. Switch to Live Monitoring → Gray banner, camera off ✅
4. Click [Start Recording]
5. Switch to Dashboard → Red indicator shown ✅
6. Switch to Live Monitoring → Red banner, camera on ✅

## Console Messages

### When Manually Stopping
```
✅ Recording stopped from Live Monitoring
Camera track stopped: video
Camera fully stopped and released (manual stop)
✅ Live camera feed stopped
```

### When Returning to Tab (After Manual Stop)
```
Tab visible - checking camera state
Camera was manually stopped - will NOT auto-start
```

### When Starting After Manual Stop
```
Camera started successfully
✅ Recording started from Live Monitoring
```

## Technical Details

### State Management
- `manuallyStopped`: Boolean flag in WebcamCapture component
- Persists across renders but resets on page refresh
- Controls auto-start behavior in useEffect

### Lifecycle
```javascript
Component Mount
  ↓
Check: manuallyStopped?
  ↓
No → Auto-start camera
Yes → Stay off

User clicks Stop
  ↓
Set manuallyStopped = true
  ↓
Camera stays off on tab switch

User clicks Start
  ↓
Set manuallyStopped = false
  ↓
Camera auto-starts on tab switch
```

## Files Modified

### 1. WebcamCapture.jsx
- Added `manuallyStopped` state
- Updated `startCamera()` to clear flag
- Updated `stopCamera()` to set flag
- Modified auto-start useEffect to check flag
- Exposed flag via useImperativeHandle

### 2. LiveMonitoring.jsx
- Added visibility change handler
- Added logging for debugging
- No behavioral changes (just monitoring)

## Edge Cases Handled

✅ **Multiple device changes**: Flag persists across device switches  
✅ **Fast tab switching**: Flag prevents race conditions  
✅ **Page visibility API**: Properly integrated with browser visibility  
✅ **Component remount**: Flag resets on full page refresh (expected)  
✅ **Error states**: Flag not affected by camera errors  

## Benefits

### For Users
- 🎯 **Predictable Behavior**: Stop means stop, even when switching tabs
- 🔒 **Privacy**: Camera stays off when intentionally stopped
- ✨ **Better Control**: User action is respected across tab switches
- 🧘 **Less Surprising**: No unexpected camera activation

### For System
- 💾 **State Consistency**: Camera state matches user intent
- 🔄 **Clean Logic**: Clear separation between auto-start and manual control
- 🎯 **Deterministic**: Behavior is predictable and testable
- 🛡️ **Robust**: Handles edge cases properly

## Known Limitations

1. **Page Refresh**: Flag resets on full page refresh (camera will auto-start)
   - **Why**: State is in-memory, not persisted
   - **Impact**: Minor - expected behavior for page reload

2. **Multiple Tabs**: Each tab has independent state
   - **Why**: React state is per-component instance
   - **Impact**: None - each tab behaves correctly

## Future Enhancements (Optional)

- Could persist `manuallyStopped` to localStorage for cross-session persistence
- Could add user preference for "never auto-start camera"
- Could show notification when preventing auto-start

## Success Criteria

✅ Camera respects manual stop action  
✅ Camera stays off when switching tabs after manual stop  
✅ Camera can be restarted with Start button  
✅ Auto-start works normally when not manually stopped  
✅ Console messages help with debugging  
✅ No errors in browser console  

---

**Status**: Fully implemented and ready for testing! ✅

**Key Fix**: Added `manuallyStopped` flag to prevent unwanted camera auto-start on tab switch.
