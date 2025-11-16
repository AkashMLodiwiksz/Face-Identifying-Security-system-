"""
Server-Side Recording Manager
Handles recording from multiple cameras simultaneously using FFmpeg
"""
import subprocess
import threading
import time
import os
from datetime import datetime

class RecordingManager:
    def __init__(self):
        self.active_recordings = {}  # {camera_id: process}
        self.recording_threads = {}  # {camera_id: thread}
        self.device_recordings = {}  # {device_index: [camera_ids]} - track which cameras are recording from same device
        self.master_camera = {}  # {device_index: camera_id} - the actual camera doing the recording
        
    def start_recording(self, camera_id, camera_name, username, device_index=0, duration=60, rtsp_url=None):
        """
        Start recording from a camera
        
        Args:
            camera_id: Database camera ID
            camera_name: Camera name
            username: Username for folder organization
            device_index: Webcam device index (0, 1, 2, etc.)
            duration: Recording duration in seconds
            rtsp_url: RTSP URL for IP cameras (if None, assumes webcam)
        """
        if camera_id in self.active_recordings:
            print(f"[WARNING] Camera {camera_id} is already recording")
            return False
        
        # Check if this is an RTSP camera
        is_rtsp = rtsp_url and rtsp_url.startswith('rtsp://')
        
        if not is_rtsp:
            # Webcam camera - use master-slave system
            # Track this camera for the device
            if device_index not in self.device_recordings:
                self.device_recordings[device_index] = []
            self.device_recordings[device_index].append(camera_id)
            
            # Check if another camera is already recording from this device
            if device_index in self.master_camera and self.master_camera[device_index] != camera_id:
                # Another camera is already recording from this device
                # Mark this camera as active but it will get duplicated recordings
                self.active_recordings[camera_id] = "slave"  # Marker that it's a slave camera
                print(f"[INFO] Camera {camera_id} ({camera_name}) will receive duplicated recordings from device {device_index}")
                return True
            
            # This camera becomes the master recorder for this device
            self.master_camera[device_index] = camera_id
        
        # Create output directory
        from app import get_recordings_dir
        output_dir = get_recordings_dir(username, camera_id, camera_name)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:19]
        output_file = os.path.join(output_dir, f'recording_{timestamp}.mp4')
        
        # Start recording in a separate thread
        if is_rtsp:
            thread = threading.Thread(
                target=self._record_rtsp_loop,
                args=(camera_id, rtsp_url, output_file, duration, camera_name),
                daemon=True
            )
        else:
            thread = threading.Thread(
                target=self._record_loop,
                args=(camera_id, device_index, output_file, duration, camera_name, username),
                daemon=True
            )
        thread.start()
        
        self.recording_threads[camera_id] = thread
        self.active_recordings[camera_id] = None  # Will be set to process in loop
        cam_type = 'RTSP' if is_rtsp else 'MASTER'
        print(f"[SUCCESS] Started {cam_type} recording camera {camera_id} ({camera_name}) to {output_file}")
        return True
    
    def _record_loop(self, camera_id, device_index, output_file, duration, camera_name, username):
        """Record video in segments and duplicate to other cameras using same device"""
        try:
            # List available video devices first
            list_cmd = ['ffmpeg', '-list_devices', 'true', '-f', 'dshow', '-i', 'dummy']
            
            print(f"[INFO] Detecting video devices for camera {camera_id} (device_index={device_index})...")
            result = subprocess.run(list_cmd, capture_output=True, text=True)
            print(f"[DEBUG] Available devices:\n{result.stderr}")
            
            # Parse available devices from FFmpeg output
            import re
            device_lines = result.stderr.split('\n')
            video_devices = []
            for line in device_lines:
                # Look for lines with (video) indicator
                if '(video)' in line.lower():
                    match = re.search(r'"([^"]+)"', line)
                    if match:
                        device_name = match.group(1)
                        video_devices.append(device_name)
            
            print(f"[INFO] Detected video devices: {video_devices}")
            
            # Use device_index to select the correct device
            # If only 1 physical device but 2 database entries, both will use index 0
            selected_device = None
            if video_devices:
                actual_index = device_index if device_index < len(video_devices) else 0
                selected_device = video_devices[actual_index]
                print(f"[INFO] Selected device at index {actual_index}: {selected_device}")
            
            # Build device patterns to try
            device_patterns = []
            if selected_device:
                device_patterns.append(f'video={selected_device}')
            
            # Fallback patterns
            device_patterns.extend([
                'video=Integrated Camera',
                'video=USB Video Device', 
                'video=Integrated Webcam',
                'video=HD WebCam',
                'video=Laptop Camera',
                'video=Webcam',
            ])
            
            process = None
            for device_name in device_patterns:
                try:
                    cmd = [
                        'ffmpeg',
                        '-f', 'dshow',
                        '-i', device_name,
                        '-t', str(duration),  # Duration
                        '-vcodec', 'libx264',
                        '-preset', 'ultrafast',
                        '-pix_fmt', 'yuv420p',
                        '-y',  # Overwrite output file
                        output_file
                    ]
                    
                    print(f"[INFO] Trying device: {device_name}")
                    process = subprocess.Popen(
                        cmd,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                    
                    # Wait a bit to see if it starts successfully
                    time.sleep(2)
                    if process.poll() is None:  # Still running = success
                        print(f"[SUCCESS] Recording started with device: {device_name}")
                        break
                    else:
                        print(f"[WARNING] Device {device_name} failed quickly")
                        process = None
                except Exception as e:
                    print(f"[WARNING] Failed with device {device_name}: {e}")
                    continue
            
            if process is None:
                raise Exception("Could not find working webcam device")
            
            self.active_recordings[camera_id] = process
            
            # Wait for recording to complete
            stdout, stderr = process.communicate()
            
            if process.returncode == 0:
                print(f"[SUCCESS] Completed recording for camera {camera_id}")
                # Duplicate recording to other cameras using same device
                self._duplicate_recording(camera_id, device_index, output_file, username)
            else:
                print(f"[ERROR] FFmpeg error for camera {camera_id}:")
                print(stderr.decode() if stderr else "No error output")
            
        except Exception as e:
            print(f"[ERROR] Recording failed for camera {camera_id}: {e}")
            import traceback
            traceback.print_exc()
        finally:
            if camera_id in self.active_recordings:
                del self.active_recordings[camera_id]
            if camera_id in self.recording_threads:
                del self.recording_threads[camera_id]
    
    def _record_rtsp_loop(self, camera_id, rtsp_url, output_file, duration, camera_name):
        """Record video from RTSP IP camera"""
        try:
            print(f"[INFO] Starting RTSP recording for camera {camera_id} from {rtsp_url}")
            
            cmd = [
                'ffmpeg',
                '-rtsp_transport', 'tcp',  # Use TCP for more reliable streaming
                '-i', rtsp_url,
                '-t', str(duration),
                '-vcodec', 'copy',  # Copy video codec (no re-encoding for speed)
                '-acodec', 'aac',  # Audio codec
                '-y',  # Overwrite output file
                output_file
            ]
            
            print(f"[INFO] FFmpeg command: {' '.join(cmd)}")
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            self.active_recordings[camera_id] = process
            
            # Wait for recording to complete
            stdout, stderr = process.communicate()
            
            if process.returncode == 0:
                print(f"[SUCCESS] Completed RTSP recording for camera {camera_id}")
            else:
                print(f"[ERROR] FFmpeg error for camera {camera_id}:")
                print(stderr.decode() if stderr else "No error output")
            
        except Exception as e:
            print(f"[ERROR] RTSP recording failed for camera {camera_id}: {e}")
            import traceback
            traceback.print_exc()
        finally:
            if camera_id in self.active_recordings:
                del self.active_recordings[camera_id]
            if camera_id in self.recording_threads:
                del self.recording_threads[camera_id]
    
    def _duplicate_recording(self, source_camera_id, device_index, source_file, username):
        """
        Duplicate recording to other cameras using the same device
        This allows multiple camera database entries to share recordings from one physical webcam
        """
        try:
            if not os.path.exists(source_file):
                print(f"[WARNING] Source file not found for duplication: {source_file}")
                return
            
            # Get all cameras that are supposed to record from this device
            if device_index not in self.device_recordings:
                return
            
            camera_ids = self.device_recordings[device_index]
            
            # Get camera info from database
            from app import db, Camera, get_recordings_dir
            import shutil
            
            for camera_id in camera_ids:
                if camera_id == source_camera_id:
                    continue  # Skip source camera
                
                # Get camera details
                camera = Camera.query.get(camera_id)
                if not camera:
                    continue
                
                # Create destination directory
                dest_dir = get_recordings_dir(username, camera.id, camera.name)
                if not os.path.exists(dest_dir):
                    os.makedirs(dest_dir)
                
                # Generate destination filename
                filename = os.path.basename(source_file)
                dest_file = os.path.join(dest_dir, filename)
                
                # Copy the file
                shutil.copy2(source_file, dest_file)
                print(f"[SUCCESS] Duplicated recording to camera {camera.id} ({camera.name}): {dest_file}")
            
        except Exception as e:
            print(f"[ERROR] Failed to duplicate recording: {e}")
            import traceback
            traceback.print_exc()
    
    def stop_recording(self, camera_id):
        """Stop recording for a specific camera"""
        if camera_id in self.active_recordings:
            try:
                process = self.active_recordings[camera_id]
                
                # If it's a slave camera, just remove from tracking
                if process == "slave":
                    del self.active_recordings[camera_id]
                    print(f"[SUCCESS] Stopped slave camera {camera_id}")
                    return True
                
                # If it's a master camera, terminate the process
                if process:
                    process.terminate()
                    process.wait(timeout=5)
                
                # Clean up device tracking
                for device_index, master_id in list(self.master_camera.items()):
                    if master_id == camera_id:
                        del self.master_camera[device_index]
                        if device_index in self.device_recordings:
                            if camera_id in self.device_recordings[device_index]:
                                self.device_recordings[device_index].remove(camera_id)
                            if not self.device_recordings[device_index]:
                                del self.device_recordings[device_index]
                        break
                
                del self.active_recordings[camera_id]
                print(f"[SUCCESS] Stopped recording for camera {camera_id}")
                return True
            except Exception as e:
                print(f"[ERROR] Failed to stop recording for camera {camera_id}: {e}")
                return False
        return False
    
    def is_recording(self, camera_id):
        """Check if a camera is currently recording"""
        return camera_id in self.active_recordings
    
    def get_active_recordings(self):
        """Get list of cameras currently recording"""
        return list(self.active_recordings.keys())
    
    def stop_all(self):
        """Stop all active recordings"""
        for camera_id in list(self.active_recordings.keys()):
            self.stop_recording(camera_id)

# Global recording manager instance
recording_manager = RecordingManager()
