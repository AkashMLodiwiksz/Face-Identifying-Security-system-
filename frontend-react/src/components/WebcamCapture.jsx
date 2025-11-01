import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Camera, VideoOff, AlertCircle, RefreshCw } from 'lucide-react';

const WebcamCapture = forwardRef(({ onCapture, onStreamingChange, isActive = true }, ref) => {
  const videoRef = useRef(null);
  const manuallyStoppedRef = useRef(false); // Use ref to persist across renders
  
  const [stream, setStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [manuallyStopped, setManuallyStopped] = useState(false); // Track manual stop

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
    manuallyStopped
  }));

  // Capture frame from video
  const captureFrame = () => {
    if (videoRef.current && isStreaming) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to blob
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

  return (
    <div className="space-y-3">
      {/* Video Feed Container */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
          style={{ transform: 'scaleX(-1)' }}
          onError={(e) => {
            console.error('Video element error:', e);
            setError('Video playback error. Please try restarting the camera.');
          }}
        />

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
