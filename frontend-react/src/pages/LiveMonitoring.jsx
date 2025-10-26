import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import WebcamCapture from '../components/WebcamCapture';
import { Video, VideoOff, AlertTriangle, Calendar, Clock, Image as ImageIcon, Square, Play } from 'lucide-react';
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
  
  const [recordingStatus, setRecordingStatus] = useState({
    isRecording: false,
    recordingTime: 0
  });

  // Create ref for WebcamCapture component
  const webcamRef = useRef(null);

  // Register laptop camera when component mounts
  useEffect(() => {
    registerLaptopCamera();
    fetchDetections();
    fetchSavedCaptures();
  }, []);

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
      // Start camera first if not running
      if (webcamRef.current && !webcamRef.current.isStreaming) {
        await webcamRef.current.startCamera();
      }
      
      await backgroundRecordingService.resumeRecording();
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

  const registerLaptopCamera = async () => {
    try {
      const response = await api.post('/cameras/laptop');
      if (response.data.success) {
        setCameraId(response.data.cameraId);
        console.log('Laptop camera registered:', response.data.cameraId);
      }
    } catch (error) {
      console.error('Error registering laptop camera:', error);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Live Monitoring</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-time face detection and recognition system
          </p>
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

        {/* Live Webcam Feed */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Live Camera Feed
              </h2>
              <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                {isCameraStreaming ? (
                  <>
                    <span className="relative flex h-3 w-3 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live
                  </>
                ) : (
                  <>
                    <span className="relative flex h-3 w-3 mr-2 bg-gray-400 rounded-full"></span>
                    Offline
                  </>
                )}
              </span>
            </div>
            <WebcamCapture 
              ref={webcamRef}
              onCapture={handleCapture} 
              onStreamingChange={handleStreamingChange}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Detections</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {detections.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Video className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
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

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {isCameraStreaming && isDetectionEnabled ? 'ACTIVE' : 'STOPPED'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                isCameraStreaming && isDetectionEnabled
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-red-100 dark:bg-red-900'
              }`}>
                {isCameraStreaming && isDetectionEnabled ? (
                  <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <VideoOff className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>

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
