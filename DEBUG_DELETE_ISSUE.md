# Testing Delete Endpoints

## Steps to Debug:

1. **Open Browser Console (F12)**
   - Go to the Console tab
   - Keep it open while testing

2. **Test Single Delete**
   - Click a delete icon on any recording
   - Check the console for detailed error logs
   - Look for the error details object we added

3. **Check Backend Terminal**
   - Look at the terminal running the Flask app
   - Should see print statements when delete is attempted
   - Look for any Python errors

4. **Test Format All**
   - Click "Format All" button
   - Confirm both steps
   - Check console and backend terminal

5. **Test Force Delete**
   - Click "Force Delete" button  
   - Confirm the warning
   - Check console and backend terminal

## Common Issues:

### Network Error
**Symptoms**: "Failed network error" in toast
**Causes**:
- Backend not running
- CORS issue
- Wrong API URL
- Frontend not connecting to backend

**Solutions**:
1. Verify backend is running on http://localhost:5000
2. Check api.js for correct base URL
3. Look for CORS errors in console (red text about CORS)

### Files Delete But Don't Disappear
**Symptoms**: Toast shows success but files still visible
**Causes**:
- fetchRecordings() not updating state
- React not re-rendering

**Solutions**:
- Click the "Refresh" button manually
- This should now be fixed with the 500ms delay

### Permission Denied
**Symptoms**: "File is in use" error
**Causes**:
- File is currently being recorded to
- File is open in a video player
- Another process has the file locked

**Solutions**:
- Try "Force Delete" button (uses system commands)
- Close any video players
- Stop recording first

## What Changed:

### Backend (`app.py`)
- ✅ Added `import shutil` and `import subprocess` at top
- ✅ Fixed `datetime.utcnow()` → `get_local_time()` in delete function
- ✅ Added `/api/recordings/force-delete-all` endpoint

### Frontend (`Recordings.jsx`)
- ✅ Added better error logging (shows full error object)
- ✅ Added 500ms delay before fetchRecordings()
- ✅ Added "Refresh" button
- ✅ Added "Force Delete" button
- ✅ Enhanced error messages to mention console

## Backend Must Be Restarted!

**IMPORTANT**: After changing `app.py`, you MUST restart the Flask server:

1. Go to terminal running Flask
2. Press `CTRL+C` to stop
3. Run: `py app.py` to restart

OR the changes won't take effect!

## Test the API Directly:

You can test if the API works by opening this in your browser:
```
http://localhost:5000/api/recordings
```

Should show JSON list of recordings.

To test delete, use browser console:
```javascript
fetch('http://localhost:5000/api/recordings/YOUR_FILENAME.webm', {
  method: 'DELETE'
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

Replace `YOUR_FILENAME.webm` with an actual filename from the list.
