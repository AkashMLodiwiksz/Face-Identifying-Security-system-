"""
Simple RTSP to MJPEG proxy without FFmpeg
Uses OpenCV to read RTSP stream and convert to MJPEG
"""
import cv2
import time
from threading import Thread

class SimpleStreamProxy:
    def __init__(self):
        self.active_streams = {}
        
    def generate_frames(self, rtsp_url):
        """Generate MJPEG frames from RTSP stream using OpenCV"""
        cap = cv2.VideoCapture(rtsp_url)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
        
        while True:
            success, frame = cap.read()
            if not success:
                break
            
            # Resize frame for better performance
            frame = cv2.resize(frame, (1280, 720))
            
            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            time.sleep(0.03)  # ~30 fps
        
        cap.release()

simple_proxy = SimpleStreamProxy()
