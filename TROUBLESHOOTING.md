# 🔍 Troubleshooting Guide - Background Recording Not Working

## Step-by-Step Diagnosis

### Step 1: Check Servers Running
**Backend:** http://localhost:5000  
**Frontend:** http://localhost:5174 (NOTE: Changed from 5173!)

Open browser console (F12) and check for errors.

---

### Step 2: Common Issues & Solutions

#### Issue 1: Frontend on Different Port
**Problem:** Frontend is on port 5174, not 5173  
**Solution:** Open http://localhost:5174 instead of 5173

#### Issue 2: Import Error
**Symptom:** Console shows "Cannot find module" error  
**Solution:** 
```bash
cd frontend-react
npm install
```

#### Issue 3: Camera Permission Denied
**Symptom:** No camera popup or recording doesn't start  
**Solution:**
1. Click lock icon in address bar
2. Camera → Allow
3. Refresh page

#### Issue 4: CORS Error
**Symptom:** Console shows "CORS policy blocked"  
**Solution:** Backend should already have CORS enabled, but verify backend is on port 5000

---

### Step 3: Test Manually

Open browser console (F12) and run:

```javascript
// Test 1: Check if service exists
import('http://localhost:5174/src/services/backgroundRecording.js')
  .then(module => {
    console.log('✅ Service loaded:', module.default);
  })
  .catch(err => {
    console.error('❌ Service load failed:', err);
  });

// Test 2: Check camera access
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ Camera access OK');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => {
    console.error('❌ Camera access denied:', err);
  });

// Test 3: Check backend connection
fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Backend connected:', data);
  })
  .catch(err => {
    console.error('❌ Backend connection failed:', err);
  });
```

---

### Step 4: Check Browser Console Logs

After login, you should see:
```
🎬 Starting background recording service...
✅ Camera access granted for background recording
✅ Camera registered with backend
🔴 Background recording started - Auto-saves every 5 minutes
```

If you see errors instead, note the error message.

---

### Step 5: Common Error Messages

#### "Failed to execute 'getUserMedia'"
**Cause:** Camera in use or permission denied  
**Fix:** 
- Close other apps using camera (Zoom, Teams, etc.)
- Allow camera permission

#### "Network Error"
**Cause:** Backend not running  
**Fix:** Verify http://localhost:5000 is accessible

#### "Cannot find module"
**Cause:** Missing dependencies  
**Fix:** Run `npm install` in frontend-react folder

#### "CORS policy"
**Cause:** Backend CORS not configured (unlikely)  
**Fix:** Already configured, but restart backend

---

### Step 6: Complete Fresh Start

If nothing works, try complete restart:

```bash
# 1. Stop all servers (Ctrl+C)

# 2. Close all browser tabs

# 3. Restart servers
npm run dev

# 4. Open NEW browser window
# 5. Go to http://localhost:5174 (note the port!)
# 6. Login: username=1, password=1
# 7. Allow camera permission
# 8. Check Dashboard for red banner
```

---

## 📊 Quick Diagnosis Checklist

Check each item:

- [ ] Backend running on port 5000
- [ ] Frontend running (check what port - likely 5174)
- [ ] Browser at correct port (http://localhost:5174)
- [ ] Can see login page
- [ ] Can login successfully
- [ ] Redirected to Dashboard after login
- [ ] Camera permission popup appeared
- [ ] Clicked "Allow" on camera permission
- [ ] Red banner visible on Dashboard
- [ ] Timer counting up
- [ ] Console shows success messages
- [ ] No red errors in console

---

## 🆘 Still Not Working?

**Tell me:**
1. What port is your frontend on? (check terminal output)
2. Can you login?
3. Do you see camera permission popup?
4. What errors show in browser console (F12)?
5. Does Dashboard page load?
6. Is red banner visible?

**Share the errors from:**
- Browser console (F12 → Console tab)
- Terminal output (any red errors)

---

## 🎯 Expected vs Actual

### Expected Behavior
```
1. Open http://localhost:5174
2. Login (1 / 1)
3. Camera popup → Allow
4. Dashboard loads
5. Red banner: "Background Recording Active"
6. Timer: 0:01, 0:02, 0:03...
```

### What's Actually Happening?
**Tell me at which step it fails!**
