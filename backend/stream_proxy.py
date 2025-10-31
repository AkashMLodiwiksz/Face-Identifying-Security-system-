"""
RTSP to HTTP Stream Proxy using FFmpeg
Converts RTSP camera streams to MJPEG HTTP streams for browser viewing
"""

import subprocess
import threading
from flask import Response, stream_with_context
import requests

class StreamProxy:
    def __init__(self):
        self.active_streams = {}
    
    def get_mjpeg_stream(self, rtsp_url, camera_id):
        """
        Convert RTSP stream to MJPEG using FFmpeg
        Returns a generator that yields MJPEG frames
        """
        # FFmpeg command to convert RTSP to MJPEG
        ffmpeg_cmd = [
            'ffmpeg',
            '-rtsp_transport', 'tcp',
            '-i', rtsp_url,
            '-f', 'mjpeg',
            '-q:v', '5',
            '-r', '15',  # 15 fps
            '-s', '1280x720',  # Resize to 720p
            '-'
        ]
        
        try:
            process = subprocess.Popen(
                ffmpeg_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=10**8
            )
            
            self.active_streams[camera_id] = process
            
            while True:
                # Read frame header
                header = process.stdout.read(2)
                if not header or len(header) != 2:
                    break
                
                # Check for JPEG marker
                if header == b'\xff\xd8':
                    # Read until end of JPEG
                    frame = header
                    while True:
                        byte = process.stdout.read(1)
                        if not byte:
                            break
                        frame += byte
                        if len(frame) >= 2 and frame[-2:] == b'\xff\xd9':
                            break
                    
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        
        except Exception as e:
            print(f"Stream error: {e}")
        finally:
            if camera_id in self.active_streams:
                self.active_streams[camera_id].terminate()
                del self.active_streams[camera_id]
    
    def stop_stream(self, camera_id):
        """Stop a specific stream"""
        if camera_id in self.active_streams:
            self.active_streams[camera_id].terminate()
            del self.active_streams[camera_id]
            return True
        return False

stream_proxy = StreamProxy()
