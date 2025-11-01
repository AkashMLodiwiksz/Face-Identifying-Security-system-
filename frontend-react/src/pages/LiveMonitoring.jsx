import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import WebcamCapture from '../components/WebcamCapture';
import RTSPCameraFeed from '../components/RTSPCameraFeed';
import { 
  Video, 
  VideoOff, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Image as ImageIcon, 
  Square, 
  Play,
  Wifi,
  WifiOff,
  Monitor,
  Maximize2,
  Grid3x3,
  Grid2x2,
  Camera
} from 'lucide-react';
import api from '../services/api';
import backgroundRecordingService from '../services/backgroundRecording';

const LiveMonitoring = () => {
  const [isDetectionEnabled, setIsDetectionEnabled] = useState(true);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [detections, setDetections] = useState([]);
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);
  const [cameraId, setCameraId] = useState(null);
  const [savedCaptures, setSavedCaptures] = useState([]);
  const [totalCaptures, setTotalCaptures] = useState(0);
  const [cameras, setCameras] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'single'
  const [selectedCamera, setSelectedCamera] = useState(null);
  
  const [recordingStatus, setRecordingStatus] = useState({
    isRecording: false,
    recordingTime: 0
  });

  // Create ref for WebcamCapture component
  const webcamRef = useRef(null);

  // Get username
  const username = localStorage.getItem('username') || sessionStorage.getItem('username');

  // Fetch all cameras on mount
  useEffect(() => {
    fetchCameras();
    fetchDetections();
    fetchSavedCaptures();
  }, []);

  // Fetch cameras
  const fetchCameras = async () => {
    try {
      if (!username) {
        console.warn('No username found');
        return;
      }

      const response = await api.get(`/cameras?username=${username}`);
      const cameraData = Array.isArray(response.data) ? response.data : [];
      setCameras(cameraData);
      
      // Select first camera by default
      if (cameraData.length > 0 && !selectedCamera) {
        setSelectedCamera(cameraData[0]);
      }

      console.log('Loaded cameras:', cameraData);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      setCameras([]);
    }
  };

  // Refresh camera list periodically to update status
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCameras();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [username]);

  // Check background recording status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = backgroundRecordingService.getStatus();
      setRecordingStatus({
        isRecording: status.isRecording,
        recordingTime: status.recordingTime
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle visibility change - prevent auto-start if manually stopped
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab is now visible
        console.log('Tab visible - checking camera state');
        
        // Only auto-start camera if recording is active AND camera was not manually stopped
        if (webcamRef.current && recordingStatus.isRecording && !webcamRef.current.manuallyStopped) {
          console.log('Recording is active and camera was not manually stopped - camera will auto-start');
        } else if (webcamRef.current && webcamRef.current.manuallyStopped) {
          console.log('Camera was manually stopped - will NOT auto-start');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recordingStatus.isRecording]);

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle start recording
  const handleStartRecording = async () => {
    try {
      // Check if there are any webcam cameras
      const webcamCameras = cameras.filter(cam => 
        cam.camera_type === 'USB' || 
        cam.camera_type === 'Webcam' || 
        cam.name.toLowerCase().includes('laptop')
      );
      
      if (webcamCameras.length === 0) {
        console.warn('⚠️ No webcam cameras available to record');
        return;
      }
      
      // Start or resume recording
      const status = backgroundRecordingService.getStatus();
      if (!status.isInitialized) {
        await backgroundRecordingService.start();
      } else {
        await backgroundRecordingService.resumeRecording();
      }
      
      console.log('✅ Recording started from Live Monitoring');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      // Only stop recording - don't stop camera feed
      await backgroundRecordingService.pauseRecording();
      console.log('✅ Recording stopped from Live Monitoring');
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
    }
  };

  const fetchDetections = async () => {
    try {
      const response = await api.get('/detections');
      setDetections(response.data);
    } catch (error) {
      console.error('Error fetching detections:', error);
    }
  };

  const fetchSavedCaptures = async () => {
    try {
      const response = await api.get('/captures?perPage=50');
      if (response.data.captures) {
        setSavedCaptures(response.data.captures);
        setTotalCaptures(response.data.total);
      }
    } catch (error) {
      console.error('Error fetching saved captures:', error);
    }
  };

  const handleCapture = async (blob, dataUrl) => {
    const frame = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      dataUrl: dataUrl
    };
    setCapturedFrames(prev => [frame, ...prev].slice(0, 10)); // Keep last 10 frames
    console.log('Frame captured:', frame);
    
    // Send frame to backend for face detection
    if (isDetectionEnabled && cameraId) {
      try {
        const response = await api.post('/detection/process-frame', {
          image: dataUrl,
          cameraId: cameraId
        });
        
        if (response.data.success) {
          console.log('Frame processed:', response.data);
          // Refresh detections and captures
          fetchDetections();
          fetchSavedCaptures();
        }
      } catch (error) {
        console.error('Error processing frame:', error);
      }
    }
  };

  const handleStreamingChange = (isStreaming) => {
    setIsCameraStreaming(isStreaming);
    
    if (isStreaming) {
      // Automatically enable detection when camera starts
      setIsDetectionEnabled(true);
      console.log('Camera started - Detection enabled (ACTIVE)');
    } else {
      // Automatically disable detection when camera stops
      setIsDetectionEnabled(false);
      console.log('Camera stopped - Detection disabled (STOPPED)');
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Live Monitoring</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time camera feeds - {cameras.length} camera{cameras.length !== 1 ? 's' : ''} connected
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Grid View"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`p-2 rounded ${viewMode === 'single' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Single View"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Background Recording Status with Manual Controls */}
        <div className={`${recordingStatus.isRecording ? 'bg-red-500' : 'bg-gray-600'} text-white px-6 py-4 rounded-lg mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {recordingStatus.isRecording && (
                <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
              )}
              <Video className="w-5 h-5" />
              <span className="font-semibold">
                {recordingStatus.isRecording ? 'Background Recording Active' : 'Recording Stopped'}
              </span>
              {recordingStatus.isRecording && (
                <span className="text-sm">
                  Recording Time: {formatTime(recordingStatus.recordingTime)}
                </span>
              )}
            </div>
            
            {/* Recording Control Buttons */}
            <div className="flex items-center space-x-3">
              {recordingStatus.isRecording ? (
                <button
                  onClick={handleStopRecording}
                  className="flex items-center space-x-2 bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all font-semibold"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Recording</span>
                </button>
              ) : (
                <button
                  onClick={handleStartRecording}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all font-semibold"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Camera Feeds */}
        {cameras.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              No Cameras Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add cameras from the Camera Management page to start monitoring
            </p>
            <button 
              onClick={() => window.location.href = '/cameras'}
              className="btn-primary"
            >
              Go to Camera Management
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View - All Cameras - More Compact */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {cameras.map((camera, index) => (
              <div key={camera.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden isolate" style={{position: 'relative', zIndex: 1}}>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-4 h-4" />
                      <div>
                        <h3 className="font-semibold text-sm">{camera.name}</h3>
                        <p className="text-xs opacity-80">{camera.location || 'No location'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {camera.status === 'online' ? (
                        <Wifi className="w-4 h-4" />
                      ) : (
                        <WifiOff className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  {camera.camera_type === 'USB' || camera.camera_type === 'Webcam' || camera.name.toLowerCase().includes('laptop') ? (
                    /* Laptop/USB/Webcam Camera - Show WebcamCapture for ALL laptop cameras */
                    <div className="mb-2">
                      <WebcamCapture 
                        ref={index === 0 ? webcamRef : null}
                        onCapture={handleCapture} 
                        onStreamingChange={handleStreamingChange}
                      />
                    </div>
                  ) : (
                    /* CCTV/IP Camera - Show RTSP Stream with Controls */
                    <div className="mb-2">
                      <RTSPCameraFeed 
                        camera={{...camera, ip: '192.168.137.189'}} 
                        onStreamChange={(isStreaming) => {
                          console.log(`Camera ${camera.name} streaming: ${isStreaming}`);
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Camera Info - More Compact */}
                  <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Type</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{camera.camera_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">FPS</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{camera.fps}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">PTZ</p>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {camera.is_ptz ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Single View - Selected Camera */
          <div className="space-y-6">
            {/* Camera Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Camera
              </label>
              <select
                value={selectedCamera?.id || ''}
                onChange={(e) => {
                  const cam = cameras.find(c => c.id === parseInt(e.target.value));
                  setSelectedCamera(cam);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {cameras.map(camera => (
                  <option key={camera.id} value={camera.id}>
                    {camera.name} - {camera.location || 'No location'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Camera Feed */}
            {selectedCamera && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-6 h-6" />
                      <div>
                        <h2 className="text-xl font-bold">{selectedCamera.name}</h2>
                        <p className="text-sm opacity-90">{selectedCamera.location || 'No location set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {selectedCamera.status === 'online' ? (
                        <Wifi className="w-6 h-6" />
                      ) : (
                        <WifiOff className="w-6 h-6 opacity-50" />
                      )}
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${
                        selectedCamera.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                      }`}>
                        {selectedCamera.status || 'offline'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {selectedCamera.camera_type === 'USB' || selectedCamera.camera_type === 'Webcam' || selectedCamera.name.toLowerCase().includes('laptop') ? (
                    /* Laptop/USB/Webcam Camera */
                    <WebcamCapture 
                      ref={webcamRef}
                      onCapture={handleCapture} 
                      onStreamingChange={handleStreamingChange}
                    />
                  ) : (
                    /* CCTV/IP Camera - Show RTSP Stream with Full Controls */
                    <RTSPCameraFeed 
                      camera={{...selectedCamera, ip: '192.168.137.189'}} 
                      onStreamChange={(isStreaming) => {
                        console.log(`Camera ${selectedCamera.name} streaming: ${isStreaming}`);
                      }}
                    />
                  )}
                  
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Camera Type</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedCamera.camera_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Resolution</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedCamera.resolution}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">FPS</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedCamera.fps}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PTZ</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {selectedCamera.is_ptz ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6 relative" style={{zIndex: 10}}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative" style={{zIndex: 10}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Cameras</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {cameras.filter(cam => cam.status === 'online').length} / {cameras.length}
                </p>
                <div className="flex items-center space-x-3 mt-2 text-xs">
                  <span className="text-green-600 dark:text-green-400">
                    ● {cameras.filter(cam => cam.status === 'online').length} Online
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    ● {cameras.filter(cam => cam.status === 'offline').length} Offline
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative" style={{zIndex: 10}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Detections</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {detections.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative" style={{zIndex: 10}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Captured Frames</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {capturedFrames.length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Camera Status List */}
        {cameras.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Camera Status
            </h2>
            <div className="space-y-2">
              {cameras.map((camera) => (
                <div 
                  key={camera.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${camera.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{camera.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{camera.location || 'No location'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      camera.status === 'online' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {camera.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{camera.camera_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Captures Gallery */}
        {savedCaptures.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Saved Captures
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total: {totalCaptures}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {savedCaptures.map((capture) => (
                <div key={capture.id} className="relative group bg-gray-900 rounded-lg overflow-hidden">
                  <img 
                    src={`http://localhost:5000/api/captures/${capture.filename}`}
                    alt={`Capture at ${capture.timestamp}`}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <div className="flex items-center text-xs mb-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {capture.date}
                      </div>
                      <div className="flex items-center text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {capture.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {savedCaptures.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              No Captures Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start the camera and click "Capture Frame" to save captures with timestamps
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LiveMonitoring;
