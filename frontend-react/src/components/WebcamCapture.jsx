import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Camera, VideoOff, AlertCircle, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import api from '../services/api';

const WebcamCapture = forwardRef(({ onCapture, onStreamingChange, isActive = true, overlays = [], detectionDims, objectOverlays = [], objectDims, cameraId, username }, ref) => {
  const videoRef = useRef(null);
  const compositeCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const manuallyStoppedRef = useRef(false); // Use ref to persist across renders
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const segmentTimerRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const isStreamingRef = useRef(false);
  const [error, setError] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [manuallyStopped, setManuallyStopped] = useState(false); // Track manual stop
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Store latest overlays and detection dimensions in refs so the draw loop always sees newest data
  const overlaysRef = useRef(overlays);
  useEffect(() => { overlaysRef.current = overlays; }, [overlays]);
  const detectionDimsRef = useRef(detectionDims || { width: 640, height: 480 });
  useEffect(() => { if (detectionDims) detectionDimsRef.current = detectionDims; }, [detectionDims]);
  const objectOverlaysRef = useRef(objectOverlays);
  useEffect(() => { objectOverlaysRef.current = objectOverlays; }, [objectOverlays]);
  const objectDimsRef = useRef(objectDims || { width: 640, height: 480 });
  useEffect(() => { if (objectDims) objectDimsRef.current = objectDims; }, [objectDims]);

  // Single composite canvas: draws video + overlays together.
  // This ensures boxes are always aligned, visible in fullscreen, and burned into recordings.
  useEffect(() => {
    const canvas = compositeCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const drawLoop = () => {
      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      // Draw the live video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw face detection overlays on top, scaling from detection resolution to display resolution
      const currentOverlays = overlaysRef.current || [];
      const dims = detectionDimsRef.current || { width: 640, height: 480 };
      const scaleX = canvas.width / dims.width;
      const scaleY = canvas.height / dims.height;

      currentOverlays.forEach(o => {
        const isAuthorized = !!o.name;
        const color = isAuthorized ? '#22c55e' : '#ef4444'; // green vs red
        const label = isAuthorized ? o.name : 'INTRUDER';

        // Scale coordinates from detection frame to display canvas
        const x = o.left * scaleX;
        const y = o.top * scaleY;
        const w = (o.right - o.left) * scaleX;
        const h = (o.bottom - o.top) * scaleY;

        // Draw box
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Draw label background
        ctx.font = 'bold 16px sans-serif';
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = color;
        ctx.fillRect(x, y - 24, textWidth + 12, 24);

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + 6, y - 6);
      });

      // Draw YOLOv8 object detection overlays
      const YOLO_COLORS = {
        vehicle: '#3b82f6', animal: '#f59e0b', electronics: '#8b5cf6',
        food: '#ef4444', kitchen: '#f97316', sports: '#10b981',
        furniture: '#6366f1', accessory: '#ec4899', infrastructure: '#64748b',
        tool: '#dc2626', item: '#06b6d4', other: '#9ca3af',
      };
      const currentObjOverlays = objectOverlaysRef.current || [];
      const objDims = objectDimsRef.current || { width: 640, height: 480 };
      const objScaleX = canvas.width / objDims.width;
      const objScaleY = canvas.height / objDims.height;

      currentObjOverlays.forEach(obj => {
        const color = YOLO_COLORS[obj.category] || '#9ca3af';
        const ox = obj.x * objScaleX;
        const oy = obj.y * objScaleY;
        const ow = obj.w * objScaleX;
        const oh = obj.h * objScaleY;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(ox, oy, ow, oh);

        const objLabel = `${obj.label} ${Math.round(obj.confidence * 100)}%`;
        ctx.font = 'bold 13px sans-serif';
        const tw = ctx.measureText(objLabel).width;
        const lh = 20;
        const ly = oy > lh + 4 ? oy - lh - 2 : oy + oh + 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        if (ctx.roundRect) { ctx.roundRect(ox, ly, tw + 10, lh, 3); ctx.fill(); }
        else { ctx.fillRect(ox, ly, tw + 10, lh); }
        ctx.fillStyle = '#ffffff';
        ctx.fillText(objLabel, ox + 5, ly + 14);
      });

      animId = requestAnimationFrame(drawLoop);
    };
    drawLoop();
    return () => cancelAnimationFrame(animId);
  }, [isStreaming]); // re-start the loop when streaming starts

  // ---- Browser-based recording from composite canvas (includes overlays) ----
  const uploadSegment = async (blob) => {
    if (!blob || blob.size === 0) return;
    try {
      const formData = new FormData();
      formData.append('video', blob, `recording_${Date.now()}.webm`);
      formData.append('username', username || localStorage.getItem('username') || '');
      formData.append('camera_id', cameraId || '');
      formData.append('duration', '120');
      await fetch('http://localhost:5000/api/recordings/upload', { method: 'POST', body: formData });
      console.log('[REC] Segment uploaded');
    } catch (err) {
      console.error('[REC] Upload error:', err);
    }
  };

  const startBrowserRecording = () => {
    const canvas = compositeCanvasRef.current;
    if (!canvas) return;
    const canvasStream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(canvasStream, { mimeType });
    recordedChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      recordedChunksRef.current = [];
      uploadSegment(blob);
    };

    recorder.start(1000); // collect data every 1s
    mediaRecorderRef.current = recorder;

    // Auto-stop and restart every 120 seconds (segment duration)
    const segmentLoop = () => {
      segmentTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop(); // triggers onstop -> upload
          // Start a new segment after a brief delay
          setTimeout(() => {
            if (isStreamingRef.current && compositeCanvasRef.current) {
              startBrowserRecording();
            }
          }, 200);
        }
      }, 120000); // 120 seconds
    };
    segmentLoop();
    console.log('[REC] Browser recording started (composite canvas with overlays)');
  };

  const stopBrowserRecording = () => {
    if (segmentTimerRef.current) clearTimeout(segmentTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    console.log('[REC] Browser recording stopped');
  };

  // Auto-start/stop browser recording when streaming starts/stops
  useEffect(() => {
    if (isStreaming) {
      // Small delay to let the composite canvas start rendering
      const t = setTimeout(() => startBrowserRecording(), 1000);
      return () => { clearTimeout(t); stopBrowserRecording(); };
    } else {
      stopBrowserRecording();
    }
  }, [isStreaming]);

  // Get available camera devices
  const getDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !deviceId) {
        setDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting devices:', err);
    }
  };

  // Start camera stream
  const startCamera = async () => {
    try {
      setError(null);
      setManuallyStopped(false); // Clear manual stop flag when starting
      manuallyStoppedRef.current = false; // Also clear ref
      
      // Stop existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        // Ensure video plays
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
            .then(() => {
              console.log('Camera started successfully');
              setIsStreaming(true);
              isStreamingRef.current = true;
              
              // Notify parent component that streaming has started
              if (onStreamingChange) {
                onStreamingChange(true);
              }
            })
            .catch(err => {
              console.error('Error playing video:', err);
            });
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      
      let errorMessage = 'Failed to access camera. ';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions in your browser.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use. Please close other apps using the camera.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings.';
      } else {
        errorMessage += err.message || 'Unknown error';
      }
      
      setError(errorMessage);
      setIsStreaming(false);
      isStreamingRef.current = false;
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (stream) {
      // Stop all tracks to release camera
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped:', track.kind);
      });
      setStream(null);
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    isStreamingRef.current = false;
    setManuallyStopped(true); // Mark as manually stopped
    manuallyStoppedRef.current = true; // Also set ref - persists across renders
    
    // Notify parent component that streaming has stopped
    if (onStreamingChange) {
      onStreamingChange(false);
    }
    
    console.log('🛑 Camera fully stopped and released (MANUAL STOP - will not auto-restart)');
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    stopCamera,
    startCamera,
    isStreaming,
    manuallyStopped,
    getCompositeStream: () => {
      // Return a stream from the composite canvas (video + overlays) for recording
      if (compositeCanvasRef.current) {
        return compositeCanvasRef.current.captureStream(30);
      }
      return null;
    }
  }));

  // Capture frame from composite canvas (includes overlays)
  const captureFrame = () => {
    if (compositeCanvasRef.current && isStreaming) {
      const canvas = compositeCanvasRef.current;
      canvas.toBlob((blob) => {
        if (onCapture) {
          onCapture(blob, canvas.toDataURL('image/jpeg'));
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // Initialize devices list
  useEffect(() => {
    getDevices();
  }, []);

  // Handle page visibility change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab hidden - recording continues in background');
      } else {
        console.log('Tab visible again - recording still active');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-start camera when component mounts
  useEffect(() => {
    // Check BOTH state and ref to ensure we respect manual stop
    const isManuallyStoppedNow = manuallyStopped || manuallyStoppedRef.current;
    const shouldAutoStart = deviceId && !isManuallyStoppedNow;
    
    if (shouldAutoStart) {
      console.log('🎬 Auto-starting camera on mount');
      startCamera();
    } else if (isManuallyStoppedNow) {
      console.log('⏸️ Camera manually stopped - SKIPPING auto-start');
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Cleanup: stopped track');
        });
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };
  }, [deviceId]); // Only deviceId in dependencies, NOT manuallyStopped

  // Cleanup on unmount - ensure camera is fully released
  useEffect(() => {
    return () => {
      if (stream) {
        console.log('Component unmounting - releasing camera');
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Listen for fullscreen changes (e.g. Esc key)
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  return (
    <div className="space-y-3">
      {/* Video Feed Container */}
      <div ref={containerRef} className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
        {/* Hidden raw video element - used as source for composite canvas */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute opacity-0 pointer-events-none"
          style={{ width: 0, height: 0 }}
        />
        {/* Composite canvas: shows video + face detection overlays together */}
        {isStreaming && (
          <canvas
            ref={compositeCanvasRef}
            className="w-full h-auto"
          />
        )}

        {/* Fullscreen toggle button */}
        {isStreaming && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-red-900 bg-opacity-80 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="bg-white text-red-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* No Stream Overlay */}
        {!isStreaming && !error && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <VideoOff className="w-12 h-12 mx-auto mb-4" />
              <p>Camera is off</p>
            </div>
          </div>
        )}

        {/* Live indicator */}
        {isStreaming && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center space-x-2 bg-green-500 bg-opacity-95 px-3 py-1.5 rounded-full shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-white text-sm font-semibold">LIVE</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Below Video - Outside the feed */}
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          {/* Camera Selector */}
          {devices.length > 1 && (
            <select
              value={deviceId || ''}
              onChange={(e) => setDeviceId(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg text-xs border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          )}

          {/* Capture Button */}
          {isStreaming && (
            <button
              onClick={captureFrame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-xs ml-auto"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default WebcamCapture;
