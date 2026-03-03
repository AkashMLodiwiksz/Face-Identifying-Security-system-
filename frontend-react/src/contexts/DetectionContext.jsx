import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const DetectionContext = createContext(null);

export const useDetection = () => useContext(DetectionContext);

/**
 * BackgroundDetectionProvider
 * 
 * Runs face detection continuously in the background regardless of which page
 * the user is on. Opens a hidden webcam stream, captures frames every 3 seconds,
 * and sends them to the backend for AI face recognition.
 * 
 * Intruders are saved to the DB server-side automatically, so even if the user
 * is on the Dashboard, intruders are captured in real-time.
 */
export const BackgroundDetectionProvider = ({ children }) => {
  const [overlays, setOverlays] = useState([]);       // latest face identifications
  const [objectOverlays, setObjectOverlays] = useState([]); // latest YOLOv8 object detections
  const [isRunning, setIsRunning] = useState(false);   // whether detection loop is active
  const [cameraReady, setCameraReady] = useState(false);
  const [hasCameras, setHasCameras] = useState(false); // whether any cameras exist
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const cameraIdRef = useRef(null);
  const cameraPollRef = useRef(null);
  const detectionDimsRef = useRef({ width: 640, height: 480 });
  const objectDimsRef = useRef({ width: 640, height: 480 });

  // Poll cameras every 10 seconds to detect when cameras are added/removed
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const username = localStorage.getItem('username') || sessionStorage.getItem('username');
        if (!username) return;
        const res = await fetch(`http://localhost:5000/api/cameras?username=${username}`);
        if (res.ok) {
          const data = await res.json();
          const cams = Array.isArray(data) ? data : (data.cameras || []);
          if (cams.length > 0) {
            cameraIdRef.current = cams[0].id;
            setHasCameras(true);
          } else {
            cameraIdRef.current = null;
            setHasCameras(false);
          }
        }
      } catch (err) {
        // silent
      }
    };

    // Fetch immediately, then poll every 10s
    fetchCameras();
    cameraPollRef.current = setInterval(fetchCameras, 10000);
    return () => {
      if (cameraPollRef.current) {
        clearInterval(cameraPollRef.current);
        cameraPollRef.current = null;
      }
    };
  }, []);

  // Start the hidden webcam stream
  const startCamera = useCallback(async () => {
    if (streamRef.current) return; // already running
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } }
      });
      streamRef.current = mediaStream;

      // Create a hidden video element if it doesn't exist
      if (!videoRef.current) {
        const vid = document.createElement('video');
        vid.autoplay = true;
        vid.playsInline = true;
        vid.muted = true;
        vid.style.position = 'absolute';
        vid.style.width = '0';
        vid.style.height = '0';
        vid.style.opacity = '0';
        vid.style.pointerEvents = 'none';
        document.body.appendChild(vid);
        videoRef.current = vid;
      }

      videoRef.current.srcObject = mediaStream;
      await videoRef.current.play();
      setCameraReady(true);
      setIsRunning(true);
      console.log('[BG-DETECT] Background camera started for detection');
    } catch (err) {
      console.error('[BG-DETECT] Could not start background camera:', err);
    }
  }, []);

  // Stop the hidden webcam stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    console.log('[BG-DETECT] Background detection stopped');
  }, []);

  // Capture a frame and send for both face + object detection
  const detectFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

      const camId = cameraIdRef.current || 1;

      // Run face detection + object detection in parallel
      const [faceRes, objRes] = await Promise.allSettled([
        fetch('http://localhost:5000/api/detection/process-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, cameraId: camId })
        }),
        fetch('http://localhost:5000/api/detection/detect-objects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, cameraId: camId })
        }),
      ]);

      // Handle face detection result
      if (faceRes.status === 'fulfilled' && faceRes.value.ok) {
        const data = await faceRes.value.json();
        if (data.success && data.identifications && data.identifications.length > 0) {
          setOverlays(data.identifications);
        } else {
          setOverlays([]);
        }
        detectionDimsRef.current = { width: canvas.width, height: canvas.height };
      }

      // Handle object detection result
      if (objRes.status === 'fulfilled' && objRes.value.ok) {
        const data = await objRes.value.json();
        if (data.success && data.objects && data.objects.length > 0) {
          setObjectOverlays(data.objects);
        } else {
          setObjectOverlays([]);
        }
        objectDimsRef.current = {
          width: data.frame_width || canvas.width,
          height: data.frame_height || canvas.height,
        };
      }
    } catch (err) {
      // silent - backend may be busy
    }
  }, []);

  // Run detection every 3 seconds when camera is ready
  useEffect(() => {
    if (!cameraReady) return;

    // Immediately run once
    detectFrame();

    intervalRef.current = setInterval(detectFrame, 3000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cameraReady, detectFrame]);

  // Auto-start when cameras exist, stop when they don't
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    if (hasCameras) {
      // Small delay to avoid fighting with WebcamCapture for camera access
      const t = setTimeout(() => startCamera(), 2000);
      return () => clearTimeout(t);
    } else {
      // No cameras — stop detection if running
      stopCamera();
      setOverlays([]);
      setObjectOverlays([]);
    }
  }, [hasCameras, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const value = {
    overlays,          // Latest identifications [{top, left, bottom, right, name, confidence}]
    objectOverlays,    // Latest YOLOv8 objects [{label, category, confidence, x, y, w, h}]
    isRunning,         // Whether background detection is active
    startCamera,       // Manually start
    stopCamera,        // Manually stop
    detectionDims: detectionDimsRef,  // {width, height} of the frame used for face detection
    objectDims: objectDimsRef,        // {width, height} of the frame used for object detection
  };

  return (
    <DetectionContext.Provider value={value}>
      {children}
    </DetectionContext.Provider>
  );
};

export default DetectionContext;
