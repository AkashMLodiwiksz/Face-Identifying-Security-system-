import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Video, Trash2, Download, Play, AlertTriangle, HardDrive, Pause, SkipForward, SkipBack, Maximize2 } from 'lucide-react';
import api from '../services/api';

import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

const Recordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [recordingsByCamera, setRecordingsByCamera] = useState({});
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('all'); // 'all' or camera_id
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [segmentDuration, setSegmentDuration] = useState(10); // seconds from settings, default 10
  const videoRef = useRef(null);

  // Modal states
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, filename: null, cameraId: null });
  const [formatModal, setFormatModal] = useState({ isOpen: false, step: 1 });
  const [toast, setToast] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    fetchRecordings();
    // poll every 5 seconds while component is mounted
    const timer = setInterval(fetchRecordings, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const username = localStorage.getItem('username');
      
      if (!username) {
        console.error('Username not found');
        return;
      }
      
      const response = await api.get(`/recordings?username=${username}`);
      setRecordings(response.data.recordings);
      setRecordingsByCamera(response.data.recordingsByCamera || {});
      setCameras(response.data.cameras || []);
      setTotalSize(response.data.totalSizeMB);
      // always set (default or from backend)
      const sd = parseInt(response.data.segmentDuration,10);
      setSegmentDuration(isNaN(sd) || sd <= 0 ? 10 : sd);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecording = async (filename, cameraId) => {
    try {
      console.log('Deleting recording:', filename, 'from camera:', cameraId);
      
      const username = localStorage.getItem('username');
      
      if (!username) {
        console.error('Username not found');
        return;
      }
      
      const response = await api.delete(`/recordings/${filename}`, {
        data: { username, camera_id: cameraId }
      });
      console.log('Delete response:', response.data);
      
      // Close modal
      setDeleteModal({ isOpen: false, filename: null, cameraId: null });
      
      // Show success toast
      setToast({
        isOpen: true,
        type: 'success',
        title: 'Deleted Successfully',
        message: `Recording "${filename}" has been deleted.`
      });
      
      // Refresh recordings list
      fetchRecordings();
      
    } catch (error) {
      console.error('Error deleting recording:', error);
      
      // Close modal
      setDeleteModal({ isOpen: false, filename: null, cameraId: null });
      
      // Show error toast
      if (error.response && error.response.status === 403) {
        setToast({
          isOpen: true,
          type: 'error',
          title: 'Cannot Delete',
          message: 'File is currently in use. Try stopping the recording first.'
        });
      } else {
        setToast({
          isOpen: true,
          type: 'error',
          title: 'Delete Failed',
          message: `Failed to delete recording: ${error.message}`
        });
      }
    }
  };

  const refreshRecordings = () => {
    fetchRecordings();
    setToast({
      isOpen: true,
      type: 'success',
      title: 'Refreshed',
      message: 'Recordings list has been refreshed'
    });
  };

  const openRecordingsFolder = async () => {
    try {
      console.log('📂 Opening recordings folder...');
      const username = localStorage.getItem('username');
      
      if (!username) {
        console.error('Username not found');
        return;
      }
      
      const response = await api.post('/recordings/open-folder', { username });
      console.log('✅ Folder opened:', response.data);
      
      setToast({
        isOpen: true,
        type: 'success',
        title: 'Folder Opened',
        message: `Windows Explorer opened to ${username}'s recordings folder`
      });
    } catch (error) {
      console.error('❌ Error opening folder:', error);
      setToast({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to open folder. Please navigate manually to your recordings folder'
      });
    }
  };

  const formatAllRecordings = async () => {
    try {
      console.log('Formatting all recordings...');
      
      const username = localStorage.getItem('username');
      
      if (!username) {
        console.error('Username not found');
        return;
      }
      
      
      console.log('Calling API to delete all recordings...');
      const response = await api.delete('/recordings/format', {
        data: { username }
      });
      console.log('Format response:', response.data);
      
      // Close modal first
      setFormatModal({ isOpen: false, step: 1 });
      
      // Show toast based on result
      if (response.data.failed && response.data.failed > 0) {
        setToast({
          isOpen: true,
          type: 'warning',
          title: 'Partially Completed',
          message: `Deleted: ${response.data.deleted} files\nFailed: ${response.data.failed} files (may be in use)`
        });
      } else {
        setToast({
          isOpen: true,
          type: 'success',
          title: 'All Recordings Deleted',
          message: `Successfully deleted ${response.data.deleted} recording(s)`
        });
      }
      
      // Refresh list
      await fetchRecordings();
      
      
    } catch (error) {
      console.error('Error formatting recordings:', error);
      
      // Close modal
      setFormatModal({ isOpen: false, step: 1 });
      
      setToast({
        isOpen: true,
        type: 'error',
        title: 'Format Failed',
        message: `Failed to delete recordings: ${error.message}`
      });
    }
  };

  // Group recordings by session (continuous segments)
  const getVideoSessions = () => {
    if (!recordings || recordings.length === 0) return [];
    
    // Sort recordings by timestamp
    const sorted = [...recordings].sort((a, b) => 
      new Date(a.created) - new Date(b.created)
    );
    
    const sessions = [];
    let currentSession = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const prevTime = new Date(sorted[i - 1].created).getTime();
      const currTime = new Date(sorted[i].created).getTime();
      const timeDiff = (currTime - prevTime) / 1000; // seconds
      
      // If videos are within 3 minutes of each other, they're part of same session
      if (timeDiff <= 180) {
        currentSession.push(sorted[i]);
      } else {
        sessions.push(currentSession);
        currentSession = [sorted[i]];
      }
    }
    
    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }
    
    return sessions;
  };

  const playVideo = (recording) => {
    // Find which session this recording belongs to
    const sessions = getVideoSessions();
    let sessionIndex = -1;
    let segmentIndex = -1;
    
    for (let i = 0; i < sessions.length; i++) {
      const index = sessions[i].findIndex(r => r.filename === recording.filename);
      if (index !== -1) {
        sessionIndex = i;
        segmentIndex = index;
        break;
      }
    }
    
    if (sessionIndex !== -1) {
      setSelectedVideo(sessions[sessionIndex]);
      setCurrentSegmentIndex(segmentIndex);
      setIsPlaying(true);
    }
  };

  // Handle video ended - auto-play next segment
  const handleVideoEnded = () => {
    if (selectedVideo && currentSegmentIndex < selectedVideo.length - 1) {
      console.log('Auto-playing next segment...');
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      console.log('Reached end of session');
    }
  };

  // Play/Pause control
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Skip to next segment
  const skipNext = () => {
    if (selectedVideo && currentSegmentIndex < selectedVideo.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setIsPlaying(true);
    }
  };

  // Skip to previous segment
  const skipPrevious = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
      setIsPlaying(true);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (isPlaying) {
        videoRef.current.play();
      }
    }
  };

  // Handle seek
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Video Recordings</h1>
            {/* description text removed per user request */}
          </div>
          <button
            onClick={refreshRecordings}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Recordings</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {recordings.length}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {totalSize} MB
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <HardDrive className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                <button
                  onClick={openRecordingsFolder}
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-1 cursor-pointer hover:underline transition-colors text-left"
                  title="Click to open folder in Windows Explorer"
                >
                  {`C:\\Users\\user\\Videos\\recordings\\${localStorage.getItem('username') || ''}`}
                </button>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <HardDrive className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Video Player with Continuous Playback */}
        {selectedVideo && Array.isArray(selectedVideo) && selectedVideo[currentSegmentIndex] && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Now Playing: Segment {currentSegmentIndex + 1} of {selectedVideo.length}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedVideo[currentSegmentIndex].filename}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedVideo(null);
                  setIsPlaying(false);
                  setCurrentSegmentIndex(0);
                }}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>

            {/* Video Element */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full"
                src={`http://localhost:5000/api/recordings/${selectedVideo[currentSegmentIndex].filename}?username=${localStorage.getItem('username')}&camera_id=${selectedVideo[currentSegmentIndex].camera_id}`}
                onEnded={handleVideoEnded}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                autoPlay={isPlaying}
              >
                Your browser does not support video playback.
              </video>

              {/* Custom Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
                {/* Progress Bar */}
                <div className="mb-3">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-white mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Previous Segment */}
                    <button
                      onClick={skipPrevious}
                      disabled={currentSegmentIndex === 0}
                      className={`p-2 rounded-lg transition-colors ${
                        currentSegmentIndex === 0
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-white hover:bg-white/20'
                      }`}
                      title="Previous segment"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>

                    {/* Play/Pause */}
                    <button
                      onClick={togglePlayPause}
                      className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white" />
                      )}
                    </button>

                    {/* Next Segment */}
                    <button
                      onClick={skipNext}
                      disabled={currentSegmentIndex === selectedVideo.length - 1}
                      className={`p-2 rounded-lg transition-colors ${
                        currentSegmentIndex === selectedVideo.length - 1
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-white hover:bg-white/20'
                      }`}
                      title="Next segment"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>

                    {/* Segment Info */}
                    <span className="text-white text-sm ml-2">
                      Segment {currentSegmentIndex + 1}/{selectedVideo.length}
                    </span>
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Video className="w-4 h-4" />
                <span>Recorded: {selectedVideo[currentSegmentIndex].created}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <HardDrive className="w-4 h-4" />
                <span>Size: {selectedVideo[currentSegmentIndex].sizeMB} MB</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Play className="w-4 h-4" />
                <span>Auto-plays next segment</span>
              </div>
            </div>

            {/* Session Timeline */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Recording Session Timeline:
              </p>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {selectedVideo.map((segment, index) => (
                  <button
                    key={segment.filename}
                    onClick={() => {
                      setCurrentSegmentIndex(index);
                      setIsPlaying(true);
                    }}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      index === currentSegmentIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div>Segment {index + 1}</div>
                    <div className="text-xs opacity-75">
                      {new Date(segment.created).toLocaleTimeString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Camera Filter Tabs */}
        {cameras.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCamera('all')}
                className={`btn ${selectedCamera==='all'? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'} whitespace-nowrap`}
              >
                All Cameras ({recordings.length})
              </button>
              {cameras.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => setSelectedCamera(camera.id)}
                  className={`btn ${selectedCamera===camera.id? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'} whitespace-nowrap`}
                >
                  {camera.name} ({recordingsByCamera[camera.id]?.count || 0})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recordings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading recordings...</p>
          </div>
        ) : (selectedCamera === 'all' ? recordings : (recordingsByCamera[selectedCamera]?.recordings || [])).length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-2/12 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Camera
                  </th>
                  <th className="w-3/12 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="w-2/12 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Start
                  </th>
                  <th className="w-2/12 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    End
                  </th>
                  <th className="w-1/12 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(selectedCamera === 'all' ? recordings : (recordingsByCamera[selectedCamera]?.recordings || [])).map((recording) => (
                  <tr key={`${recording.camera_id}-${recording.filename}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${recording.camera_id ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {recording.camera_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Video className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {recording.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {recording.created}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {segmentDuration ? (() => {
                        const d = new Date(new Date(recording.created).getTime() + segmentDuration * 1000);
                        const pad = n => String(n).padStart(2, '0');
                        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                      })() : '...'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {recording.sizeMB} MB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => playVideo(recording)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                        title="Play Video"
                      >
                        <Play className="w-5 h-5 inline" />
                      </button>
                      <a
                        href={`http://localhost:5000/api/recordings/${recording.filename}?username=${localStorage.getItem('username')}&camera_id=${recording.camera_id}`}
                        download
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-4"
                        title="Download Video"
                      >
                        <Download className="w-5 h-5 inline" />
                      </a>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, filename: recording.filename, cameraId: recording.camera_id })}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Video"
                      >
                        <Trash2 className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              No Recordings Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start recording on the Live Monitoring page to save video segments
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, filename: null, cameraId: null })}
        onConfirm={() => deleteRecording(deleteModal.filename, deleteModal.cameraId)}
        title="Delete Recording"
        message={`Are you sure you want to delete this recording?\n\n"${deleteModal.filename}"\n\nThis action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Format Confirmation Modal - Step 1 */}
      <ConfirmModal
        isOpen={formatModal.isOpen && formatModal.step === 1}
        onClose={() => setFormatModal({ isOpen: false, step: 1 })}
        onConfirm={() => setFormatModal({ isOpen: true, step: 2 })}
        title="⚠️ Delete ALL Recordings?"
        message="WARNING: This will permanently delete ALL video recordings!\n\nAre you absolutely sure you want to continue?"
        confirmText="Yes, Continue"
        cancelText="Cancel"
        type="danger"
      />

      {/* Format Confirmation Modal - Step 2 (Final) */}
      <ConfirmModal
        isOpen={formatModal.isOpen && formatModal.step === 2}
        onClose={() => setFormatModal({ isOpen: false, step: 1 })}
        onConfirm={formatAllRecordings}
        title="⚠️ FINAL WARNING"
        message="This action CANNOT be undone!\n\nAll video recordings will be permanently deleted.\n\nAre you 100% sure?"
        confirmText="Yes, Delete Everything"
        cancelText="Cancel"
        type="danger"
      />

      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        duration={5000}
      />
    </Layout>
  );
};

export default Recordings;
