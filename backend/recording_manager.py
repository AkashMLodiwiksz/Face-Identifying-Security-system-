import subprocess
import threading
import time
import os
import re
import shutil
from datetime import datetime

# Absolute path to ffmpeg – winget installed it here.
# Falls back to bare 'ffmpeg' so it still works if the user moves it to PATH.
_FFMPEG_PATH = r'C:\Users\Akash Menaka\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe'
if not os.path.isfile(_FFMPEG_PATH):
    _found = shutil.which('ffmpeg')
    _FFMPEG_PATH = _found if _found else 'ffmpeg'

class RecordingManager:
    """Manages one recording thread per camera.

    Previously the system recorded only a single "master" camera.  The
    new implementation maintains a dictionary of active sessions so multiple
    cameras can be recorded simultaneously.  Each session runs in its own
    thread and controls its own ffmpeg subprocess.

    Public API:
      start_recording(camera_id, rtsp_url, username, camera_name, duration)
      stop_recording(camera_id)
      stop_all()
      update_duration(camera_id, duration)
      is_recording(camera_id) -> bool
    """

    def __init__(self):
        # map camera_id -> session dict {thread, process, stop_flag, duration}
        self.sessions = {}
        self._ffmpeg_checked = False

    @staticmethod
    def _get_dshow_device(index=0):
        """Return the name of the Nth DirectShow video device, or None."""
        try:
            result = subprocess.run(
                [_FFMPEG_PATH, '-list_devices', 'true', '-f', 'dshow', '-i', 'dummy'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10
            )
            output = result.stderr.decode(errors='replace')
            # Match lines like:  [dshow ...] "Device Name" (video)
            devices = re.findall(r'\[dshow[^\]]*\]\s+"([^"]+)"\s+\(video\)', output)
            if devices and index < len(devices):
                return devices[index]
            elif devices:
                return devices[0]
        except Exception as e:
            print(f"[RECORDER] Could not enumerate DirectShow devices: {e}")
        return None

    def _record_loop(self, camera_id, rtsp_url, username, camera_name, duration=240):
        """Recording loop for a single camera session.

        The session dictionary for this camera contains:
            stop_flag: bool
            segment_duration: int
            process: subprocess.Popen or None
        """
        session = self.sessions[camera_id]
        session['segment_duration'] = duration
        base_dir = None
        try:
            from app import get_recordings_dir
            base_dir = get_recordings_dir(username, camera_id, camera_name)
            if not os.path.exists(base_dir):
                os.makedirs(base_dir)
        except Exception:
            base_dir = '.'

        # verify ffmpeg exists once
        if not self._ffmpeg_checked:
            self._ffmpeg_checked = True
            try:
                subprocess.run([_FFMPEG_PATH, '-version'], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            except Exception as e:
                print(f"[RECORDER] ERROR: ffmpeg executable not found ({e}); recording disabled")
                # disable all sessions
                for sess in self.sessions.values():
                    sess['stop_flag'] = True
                return

        # Build the ffmpeg input args depending on the camera URL
        is_webcam = (not rtsp_url) or rtsp_url.startswith('webcam://') or rtsp_url.lower() in ('0', '1', '2')
        if is_webcam:
            # Extract device index from url like "webcam://0" or default to 0
            dev_index = 0
            if rtsp_url and rtsp_url.startswith('webcam://'):
                try:
                    dev_index = int(rtsp_url.replace('webcam://', '').strip() or '0')
                except ValueError:
                    dev_index = 0
            elif rtsp_url and rtsp_url.strip().isdigit():
                dev_index = int(rtsp_url.strip())

            if os.name == 'nt':
                # Windows: discover DirectShow video device names
                device_name = self._get_dshow_device(dev_index)
                if device_name:
                    input_args = ['-f', 'dshow', '-rtbufsize', '100M', '-i', f'video={device_name}']
                    print(f"[RECORDER] Using DirectShow webcam: '{device_name}' (index {dev_index})")
                else:
                    print(f"[RECORDER] ERROR: No DirectShow video device found at index {dev_index}; recording disabled")
                    self.stop_flag = True
                    return
            else:
                # Linux/Mac
                input_args = ['-f', 'v4l2', '-i', f'/dev/video{dev_index}']
                print(f"[RECORDER] Using v4l2 webcam /dev/video{dev_index}")

            encode_args = ['-vcodec', 'libx264', '-preset', 'ultrafast', '-acodec', 'aac']
        else:
            # RTSP or other network stream
            input_args = ['-rtsp_transport', 'tcp', '-i', rtsp_url]
            encode_args = ['-vcodec', 'copy', '-acodec', 'aac']
            print(f"[RECORDER] Using RTSP stream: {rtsp_url}")

        segment = 0
        consecutive_failures = 0
        while not session['stop_flag']:
            segment += 1
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            outfile = os.path.join(base_dir, f"recording_{timestamp}.mp4")

            # always use the current segment duration attribute
            dur = getattr(self, 'segment_duration', duration)
            cmd = [_FFMPEG_PATH] + input_args + ['-t', str(dur)] + encode_args + ['-y', outfile]
            print(f"[RECORDER] Starting segment {segment} for camera {camera_id}: {outfile}")
            try:
                self.process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                stdout, stderr = self.process.communicate()
                if self.process.returncode != 0:
                    consecutive_failures += 1
                    err_text = stderr.decode(errors='replace')
                    # Only print first 500 chars to avoid log spam
                    print(f"[RECORDER] FFmpeg error (segment {segment}): {err_text[:500]}")
                    if consecutive_failures >= 3:
                        wait = min(consecutive_failures * 5, 30)
                        print(f"[RECORDER] {consecutive_failures} consecutive failures, waiting {wait}s before retry...")
                        time.sleep(wait)
                else:
                    consecutive_failures = 0
                    print(f"[RECORDER] Finished segment {segment}")
            except Exception as ex:
                consecutive_failures += 1
                print(f"[RECORDER] Exception during ffmpeg: {ex}")
                if consecutive_failures >= 3:
                    time.sleep(min(consecutive_failures * 5, 30))
            self.process = None
            # small delay before next segment to avoid hammering
            time.sleep(0.5)

        print(f"[RECORDER] Exiting record loop for camera {camera_id}")
        session['process'] = None

    def start_recording(self, camera_id, rtsp_url, username, camera_name='', duration=10):
        """Start recording for a given camera_id if not already running.

        If a session for that camera already exists, updates duration and
        returns True.  Multiple cameras can be recorded in parallel.
        """
        # existing session?
        if camera_id in self.sessions:
            sess = self.sessions[camera_id]
            sess['segment_duration'] = duration
            print(f"[RECORDER] updating existing session duration for camera {camera_id} to {duration}")
            return True

        # create new session
        sess = {'thread': None, 'process': None, 'stop_flag': False, 'segment_duration': duration}
        self.sessions[camera_id] = sess

        t = threading.Thread(
            target=self._record_loop,
            args=(camera_id, rtsp_url, username, camera_name, duration),
            daemon=True
        )
        sess['thread'] = t
        t.start()
        print(f"[RECORDER] Recording thread started for camera {camera_id}")
        return True

    def update_duration(self, duration, camera_id=None):
        """Adjust the segment duration for a camera or all cameras."""
        if camera_id is not None and camera_id in self.sessions:
            self.sessions[camera_id]['segment_duration'] = duration
            print(f"[RECORDER] updating segment duration to {duration} for camera {camera_id}")
        else:
            for cid, sess in self.sessions.items():
                sess['segment_duration'] = duration
            print(f"[RECORDER] updating segment duration to {duration} for all cameras")

    def stop_recording(self, camera_id):
        """Stop recording a specific camera session."""
        sess = self.sessions.get(camera_id)
        if not sess:
            return
        print(f"[RECORDER] stop_recording called for camera {camera_id}")
        sess['stop_flag'] = True
        if sess.get('process') and sess['process'].poll() is None:
            try:
                sess['process'].terminate()
                sess['process'].wait(timeout=5)
            except Exception:
                sess['process'].kill()
        if sess.get('thread'):
            sess['thread'].join(timeout=5)
        del self.sessions[camera_id]

    def stop_all(self):
        """Stop all active recording sessions."""
        print("[RECORDER] stop_all called")
        for cid in list(self.sessions.keys()):
            self.stop_recording(cid)

    def is_recording(self, camera_id=None):
        """Return True if a specific camera (or any camera) is recording."""
        if camera_id:
            sess = self.sessions.get(camera_id)
            return bool(sess and sess.get('thread') and sess['thread'].is_alive())
        return any(sess.get('thread') and sess['thread'].is_alive() for sess in self.sessions.values())

# singleton
recording_manager = RecordingManager()
