import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Maximize2, 
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Moon,
  Sun,
  Sunrise,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  RefreshCw,
  Wifi,
  Camera
} from 'lucide-react';

const RTSPCameraFeed = ({ camera, onStreamChange, onCapture }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [nightVisionMode, setNightVisionMode] = useState('auto'); // 'auto', 'ir', 'color'
  const [isPTZActive, setIsPTZActive] = useState(false);
  const [snapshotError, setSnapshotError] = useState(false);
  const [streamMode, setStreamMode] = useState('auto'); // 'auto', 'vlc-plugin', 'http-stream'
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Construct RTSP URL
  const rtspUrl = camera.rtsp_url || `rtsp://admin:admin@${camera.ip || '192.168.137.189'}:554/stream1`;
  
  // Get username for API calls
  const username = localStorage.getItem('username') || sessionStorage.getItem('username');
  
  // Use backend proxy for streaming (avoids CORS issues)
  const streamUrl = `http://localhost:5000/api/cameras/${camera.id}/stream?username=${username}`;
  const snapshotUrl = `http://localhost:5000/api/cameras/${camera.id}/snapshot?username=${username}`;
  
  // Try multiple snapshot URL patterns (fallback if proxy fails)
  const cameraIp = camera.ip || '192.168.137.189';
  const snapshotUrls = [
    snapshotUrl, // Backend proxy first
    `http://${cameraIp}/cgi-bin/snapshot.cgi`,
    `http://admin:admin@${cameraIp}/snapshot.jpg`,
    `http://${cameraIp}/tmpfs/auto.jpg`,
    `http://${cameraIp}/jpg/image.jpg`,
    `http://${cameraIp}/snapshot.cgi`,
    `http://${cameraIp}/cgi-bin/api.cgi?cmd=Snap&channel=0&rs=abc&user=admin&password=admin`
  ];

  useEffect(() => {
    // Always auto-connect when component mounts (camera should try to connect)
    handleConnect();
  }, [camera.id]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Try to update camera status to online
      const username = localStorage.getItem('username') || sessionStorage.getItem('username');
      
      // Update camera status to online
      await fetch(`http://localhost:5000/api/cameras/${camera.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'online',
          username: username
        })
      });
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(true);
      setIsConnecting(false);
      
      console.log(`Camera ${camera.name} connected and set to online`);
      
      if (onStreamChange) {
        onStreamChange(true);
      }
    } catch (err) {
      console.error('Failed to connect to camera:', err);
      setError('Failed to connect to camera stream');
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    if (onStreamChange) {
      onStreamChange(false);
    }
  };
  
  const openInVLC = () => {
    // Open RTSP stream in VLC
    window.open(`vlc://${rtspUrl}`, '_blank');
    
    // Alternative: Create a .m3u playlist file
    const playlistContent = `#EXTM3U\n#EXTINF:-1,${camera.name}\n${rtspUrl}`;
    const blob = new Blob([playlistContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${camera.name.replace(/\s+/g, '_')}.m3u`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // PTZ Controls
  const handlePTZControl = async (direction) => {
    setIsPTZActive(true);
    console.log(`PTZ Control: ${direction} for camera ${camera.name}`);
    
    try {
      // Send PTZ command to backend
      const response = await fetch(`http://localhost:5000/api/cameras/${camera.id}/ptz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          direction,
          username: localStorage.getItem('username') || sessionStorage.getItem('username')
        })
      });

      if (response.ok) {
        console.log(`PTZ ${direction} command sent successfully`);
      }
    } catch (error) {
      console.error('PTZ control error:', error);
    }

    setTimeout(() => setIsPTZActive(false), 500);
  };

  const handlePTZStop = async () => {
    try {
      await fetch(`http://localhost:5000/api/cameras/${camera.id}/ptz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          direction: 'stop',
          username: localStorage.getItem('username') || sessionStorage.getItem('username')
        })
      });
    } catch (error) {
      console.error('PTZ stop error:', error);
    }
  };

  const handleZoom = async (direction) => {
    try {
      await fetch(`http://localhost:5000/api/cameras/${camera.id}/ptz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          direction: direction === 'in' ? 'zoom_in' : 'zoom_out',
          username: localStorage.getItem('username') || sessionStorage.getItem('username')
        })
      });
    } catch (error) {
      console.error('Zoom control error:', error);
    }
  };

  const handleNightVisionChange = async (mode) => {
    setNightVisionMode(mode);
    
    try {
      await fetch(`http://localhost:5000/api/cameras/${camera.id}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          setting: 'night_vision',
          value: mode,
          username: localStorage.getItem('username') || sessionStorage.getItem('username')
        })
      });
      
      console.log(`Night vision mode set to: ${mode}`);
    } catch (error) {
      console.error('Night vision setting error:', error);
    }
  };

  // Capture frame from CCTV camera
  const handleCapture = () => {
    const img = document.querySelector(`img[alt="Live Camera Feed"]`);
    if (img) {
      // Create canvas and capture current frame
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Convert to blob and pass to parent
      canvas.toBlob((blob) => {
        if (blob && onCapture) {
          const file = new File([blob], `capture_${camera.name}_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
        }
      }, 'image/jpeg', 0.95);
      
      console.log(`Captured frame from ${camera.name}`);
    }
  };

  return (
    <div ref={containerRef} className="relative bg-gray-900 rounded-lg overflow-hidden isolate">
      {/* Video Feed - Extra tall container for maximum vertical stretch */}
      <div className="w-full bg-black flex items-center justify-center relative isolate overflow-hidden" style={{ height: '500px' }}>
        {isConnecting ? (
          <div className="flex flex-col items-center space-y-4 p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 text-sm">Connecting...</p>
          </div>
        ) : isConnected ? (
          <>
            {/* MJPEG Stream from Backend (OpenCV transcoded) */}
            <div className="w-full h-full relative bg-black">
              {/* MJPEG Stream Image - Fill to stretch maximum vertically */}
              <img
                src={`http://localhost:5000/api/cameras/${camera.id}/mjpeg-stream?username=${username}`}
                alt="Live Camera Feed"
                className="w-full h-full"
                style={{ 
                  objectFit: 'fill',
                  width: '100%',
                  height: '100%',
                  transform: 'scaleY(1.2)'
                }}
                onLoad={() => {
                  console.log('MJPEG stream loaded successfully');
                  setSnapshotError(false);
                }}
                onError={(e) => {
                  console.log('MJPEG stream failed, showing fallback');
                  setSnapshotError(true);
                  e.target.style.display = 'none';
                  const fallback = document.querySelector('.fallback-display');
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
              
              {/* Fallback display if stream unavailable */}
              <div className="fallback-display w-full h-full flex flex-col items-center justify-center p-6 absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" style={{display: 'none'}}>
                <div className="text-center max-w-2xl">
                  {/* Animated Camera Icon */}
                  <div className="relative inline-block mb-6">
                    <Video className="w-20 h-20 text-blue-500 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-ping"></div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">CCTV Camera Ready</h3>
                  <p className="text-gray-400 text-sm mb-6">{camera.name}</p>
                  
                  <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <Wifi className="w-5 h-5 text-green-500" />
                      <span className="text-green-400 font-semibold">Network Connected</span>
                    </div>
                    
                    <div className="bg-gray-900 rounded-lg p-4 mb-4">
                      <p className="text-blue-400 text-sm font-semibold mb-2">RTSP Stream URL:</p>
                      <p className="text-gray-300 text-xs font-mono break-all bg-black bg-opacity-30 p-3 rounded">
                        {rtspUrl}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-900 bg-opacity-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs">Camera IP</p>
                        <p className="text-white font-semibold">192.168.137.189</p>
                      </div>
                      <div className="bg-gray-900 bg-opacity-50 p-3 rounded-lg">
                        <p className="text-gray-500 text-xs">RTSP Port</p>
                        <p className="text-white font-semibold">554</p>
                      </div>
                    </div>
                    
                    {/* Open in VLC Button */}
                    <button
                      onClick={openInVLC}
                      className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center space-x-2"
                    >
                      <Video className="w-5 h-5" />
                      <span>Open Stream in VLC Player</span>
                    </button>
                    
                    <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg">
                      <p className="text-blue-300 text-xs mb-2 font-semibold">📺 To enable in-browser viewing:</p>
                      <ol className="text-blue-200 text-xs space-y-1 list-decimal list-inside">
                        <li>Download FFmpeg from <span className="font-mono bg-black bg-opacity-30 px-1 rounded">ffmpeg.org</span></li>
                        <li>Add FFmpeg to system PATH</li>
                        <li>Restart the backend server</li>
                        <li>Refresh this page to see live stream</li>
                      </ol>
                      <p className="text-yellow-300 text-xs mt-2">⚡ FFmpeg will transcode RTSP → MJPEG for browser viewing</p>
                    </div>
                    
                    <div className="mt-3 p-3 bg-green-900 bg-opacity-20 border border-green-700 rounded-lg">
                      <p className="text-green-300 text-xs mb-2 font-semibold">✅ Quick Alternative:</p>
                      <p className="text-green-200 text-xs">Click "Open Stream in VLC Player" button above to watch immediately</p>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gradient-to-r from-yellow-900 to-orange-900 bg-opacity-20 border border-yellow-600 rounded-lg">
                      <p className="text-yellow-300 text-sm text-center flex items-center justify-center">
                        <span className="mr-2">💡</span>
                        <span>Camera feed unavailable. Please ensure the camera is powered on and accessible on the network.</span>
                      </p>
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg">
                      <p className="text-blue-300 text-xs text-center">
                        <strong>Alternative:</strong> Use VLC Media Player to view the RTSP stream directly
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay Controls */}
            <div className="absolute top-4 right-4 flex space-x-2 z-10">
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-black bg-opacity-70 hover:bg-opacity-90 rounded-lg text-white transition-all shadow-lg"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Connection Status */}
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center space-x-2 bg-green-500 bg-opacity-95 px-3 py-1.5 rounded-full shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span className="text-white text-sm font-semibold">LIVE</span>
              </div>
            </div>
          </>
        ) : error ? (
          <div className="flex flex-col items-center space-y-4">
            <VideoOff className="w-16 h-16 text-red-500" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Video className="w-16 h-16 text-gray-500" />
            <p className="text-gray-400">Camera Ready</p>
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Video className="w-5 h-5" />
              <span>Start Live Feed</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Panel */}
      {isConnected && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* PTZ Controls */}
            {camera.is_ptz && (
              <div className="space-y-3">
                <h3 className="text-white font-semibold text-sm flex items-center">
                  <Move className="w-4 h-4 mr-2" />
                  PTZ Controls
                </h3>
                <div className="flex flex-col items-center space-y-2">
                  {/* Up */}
                  <button
                    onMouseDown={() => handlePTZControl('up')}
                    onMouseUp={handlePTZStop}
                    onMouseLeave={handlePTZStop}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all active:bg-blue-500"
                  >
                    <ChevronUp className="w-6 h-6" />
                  </button>
                  
                  {/* Left, Home, Right */}
                  <div className="flex space-x-2">
                    <button
                      onMouseDown={() => handlePTZControl('left')}
                      onMouseUp={handlePTZStop}
                      onMouseLeave={handlePTZStop}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all active:bg-blue-500"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handlePTZControl('home')}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all"
                      title="Reset to Home Position"
                    >
                      <Home className="w-6 h-6" />
                    </button>
                    <button
                      onMouseDown={() => handlePTZControl('right')}
                      onMouseUp={handlePTZStop}
                      onMouseLeave={handlePTZStop}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all active:bg-blue-500"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Down */}
                  <button
                    onMouseDown={() => handlePTZControl('down')}
                    onMouseUp={handlePTZStop}
                    onMouseLeave={handlePTZStop}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all active:bg-blue-500"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}

            {/* Zoom Controls */}
            {camera.is_ptz && (
              <div className="space-y-2">
                <h3 className="text-white font-semibold text-xs flex items-center">
                  <ZoomIn className="w-3 h-3 mr-1" />
                  Zoom
                </h3>
                <div className="flex space-x-2">
                  <button
                    onMouseDown={() => handleZoom('in')}
                    onMouseUp={handlePTZStop}
                    className="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all flex items-center justify-center space-x-1 text-xs"
                  >
                    <ZoomIn className="w-4 h-4" />
                    <span>In</span>
                  </button>
                  <button
                    onMouseDown={() => handleZoom('out')}
                    onMouseUp={handlePTZStop}
                    className="flex-1 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-all flex items-center justify-center space-x-1 text-xs"
                  >
                    <ZoomOut className="w-4 h-4" />
                    <span>Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Night Vision / Full Color Mode */}
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-xs flex items-center">
                <Moon className="w-3 h-3 mr-1" />
                Vision Mode
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleNightVisionChange('auto')}
                  className={`p-2 rounded-lg transition-all flex flex-col items-center space-y-1 ${
                    nightVisionMode === 'auto'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Sunrise className="w-4 h-4" />
                  <span className="text-xs">Auto</span>
                </button>
                <button
                  onClick={() => handleNightVisionChange('ir')}
                  className={`p-2 rounded-lg transition-all flex flex-col items-center space-y-1 ${
                    nightVisionMode === 'ir'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-xs">Night</span>
                </button>
                <button
                  onClick={() => handleNightVisionChange('color')}
                  className={`p-2 rounded-lg transition-all flex flex-col items-center space-y-1 ${
                    nightVisionMode === 'color'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-xs">Color</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stream Actions - More Compact */}
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-700">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>{camera.resolution}</span>
              <span>•</span>
              <span>{camera.fps}fps</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCapture}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors flex items-center space-x-1"
              >
                <Camera className="w-3 h-3" />
                <span>Capture</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors flex items-center space-x-1"
              >
                <VideoOff className="w-3 h-3" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RTSPCameraFeed;
