import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import backgroundRecordingService from '../services/backgroundRecording';
import { 
  Camera, 
  Users, 
  UserX, 
  Activity, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  Eye,
  Video,
  CheckCircle,
  XCircle,
  Bell
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    cameras: { total: 6, online: 6, offline: 0 },
    authorizedPersons: { total: 24, active: 22, inactive: 2 },
    intrudersDetected: { today: 3, thisWeek: 12, thisMonth: 45 },
    detectionsToday: { total: 156, persons: 89, objects: 52, animals: 15 }
  });

  const [cameras, setCameras] = useState([]);

  const [systemHealth, setSystemHealth] = useState({
    cpu: { percent: 0, cores: 0 },
    memory: { percent: 0, used_gb: 0, total_gb: 0 },
    disk: { percent: 0, used_gb: 0, total_gb: 0 },
    network: { sent_mb: 0, recv_mb: 0 }
  });

  const [recordingStatus, setRecordingStatus] = useState({
    isRecording: false,
    recordingTime: 0
  });

  // Fetch camera data
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/cameras');
        const data = await response.json();
        setCameras(data);
        
        // Update stats based on actual camera data
        const onlineCameras = data.filter(cam => cam.status === 'online').length;
        const offlineCameras = data.length - onlineCameras;
        
        setStats(prev => ({
          ...prev,
          cameras: {
            total: data.length,
            online: onlineCameras,
            offline: offlineCameras
          }
        }));
      } catch (error) {
        console.error('Error fetching cameras:', error);
      }
    };

    fetchCameras();
    // Refresh camera status every 10 seconds
    const interval = setInterval(fetchCameras, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch system health data
  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/system/health');
        const data = await response.json();
        setSystemHealth(data);
      } catch (error) {
        console.error('Error fetching system health:', error);
      }
    };

    // Fetch immediately
    fetchSystemHealth();

    // Then fetch every 3 seconds
    const interval = setInterval(fetchSystemHealth, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-start recording if not already started (for direct dashboard access)
  useEffect(() => {
    const initializeRecording = async () => {
      const status = backgroundRecordingService.getStatus();
      
      // If recording is not initialized, start it
      if (!status.isInitialized) {
        console.log('📍 Dashboard: Recording not started, initializing...');
        try {
          await backgroundRecordingService.start();
          console.log('✅ Dashboard: Background recording started');
        } catch (error) {
          console.error('❌ Dashboard: Failed to start recording:', error);
        }
      } else {
        console.log('✅ Dashboard: Recording already active');
      }
    };

    initializeRecording();
  }, []); // Run once on mount

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

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="p-6 space-y-8">
        {/* Compact Recording Status Indicator - No Controls */}
        {recordingStatus.isRecording && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              <Video className="w-4 h-4" />
              <span className="font-medium">Recording</span>
            </div>
            <span className="font-mono">{formatTime(recordingStatus.recordingTime)}</span>
          </div>
        )}

        {/* Main Stats Grid - Larger Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Active Cameras - Detailed */}
          <div className="card bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Camera className="w-8 h-8" />
              </div>
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
                stats.cameras.total > 0 && stats.cameras.offline === 0
                  ? 'bg-green-500 bg-opacity-30'
                  : stats.cameras.online > 0
                  ? 'bg-yellow-500 bg-opacity-30'
                  : 'bg-red-500 bg-opacity-30'
              }`}>
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  {stats.cameras.total > 0 
                    ? `${Math.round((stats.cameras.online / stats.cameras.total) * 100)}%` 
                    : '0%'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Active Cameras</p>
              <p className="text-4xl font-bold mb-3">{stats.cameras.online}</p>
              <div className="flex items-center justify-between text-xs opacity-90">
                <span className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" /> {stats.cameras.online} Online
                </span>
                <span className="flex items-center">
                  <XCircle className="w-4 h-4 mr-1" /> {stats.cameras.offline} Offline
                </span>
              </div>
            </div>
          </div>

          {/* Authorized Persons - Detailed */}
          <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Users className="w-8 h-8" />
              </div>
              <div className="flex items-center space-x-1 bg-white bg-opacity-30 px-3 py-1 rounded-full">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-semibold">Active</span>
              </div>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Authorized Persons</p>
              <p className="text-4xl font-bold mb-3">{stats.authorizedPersons.total}</p>
              <div className="flex items-center justify-between text-xs opacity-90">
                <span className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" /> {stats.authorizedPersons.active} Active
                </span>
                <span className="flex items-center">
                  <XCircle className="w-4 h-4 mr-1" /> {stats.authorizedPersons.inactive} Inactive
                </span>
              </div>
            </div>
          </div>

          {/* Intruders Detected - Detailed */}
          <div className="card bg-gradient-to-br from-red-500 to-red-700 text-white hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <UserX className="w-8 h-8" />
              </div>
              <div className="flex items-center space-x-1 bg-yellow-500 bg-opacity-40 px-3 py-1 rounded-full">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold">Alert</span>
              </div>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Intruders Detected</p>
              <p className="text-4xl font-bold mb-3">{stats.intrudersDetected.today}</p>
              <div className="flex items-center justify-between text-xs opacity-90">
                <span>This Week: {stats.intrudersDetected.thisWeek}</span>
                <span>This Month: {stats.intrudersDetected.thisMonth}</span>
              </div>
            </div>
          </div>

          {/* Detections Today - Detailed */}
          <div className="card bg-gradient-to-br from-purple-500 to-purple-700 text-white hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Eye className="w-8 h-8" />
              </div>
              <div className="flex items-center space-x-1 bg-white bg-opacity-30 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold">Today</span>
              </div>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Total Detections</p>
              <p className="text-4xl font-bold mb-3">{stats.detectionsToday.total}</p>
              <div className="grid grid-cols-3 gap-2 text-xs opacity-90">
                <span>👤 {stats.detectionsToday.persons}</span>
                <span>📦 {stats.detectionsToday.objects}</span>
                <span>🐾 {stats.detectionsToday.animals}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Alerts */}
          <div className="card bg-white dark:bg-dark-card h-96 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                <Bell className="w-5 h-5 mr-2 text-red-500" />
                Recent Alerts
              </h3>
              <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                3 New
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto scrollbar-thin flex-1 pr-2">
              <div className="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-lg border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-red-800 dark:text-red-300">Unknown Person</span>
                  <span className="text-xs text-gray-500">2 min ago</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Camera 3 - Main Entrance</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Suspicious Activity</span>
                  <span className="text-xs text-gray-500">15 min ago</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Camera 5 - Parking Lot</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20 rounded-lg border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-orange-800 dark:text-orange-300">Loitering Detected</span>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Camera 1 - Back Entrance</p>
              </div>
            </div>
          </div>

          {/* Camera Status */}
          <div className="card bg-white dark:bg-dark-card h-96 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                <Video className="w-5 h-5 mr-2 text-blue-500" />
                Camera Status
              </h3>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                stats.cameras.offline === 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {stats.cameras.offline === 0 ? 'All Online' : `${stats.cameras.offline} Offline`}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto scrollbar-thin flex-1 pr-2">
              {cameras
                .filter(cam => cam.status === 'online')
                .map(cam => (
                  <div key={cam.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                          {cam.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {cam.location}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>{cam.fps} FPS</span>
                      <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              {cameras.filter(cam => cam.status === 'online').length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Camera className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">No cameras online</p>
                </div>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="card bg-white dark:bg-dark-card h-96 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-500" />
                System Health
              </h3>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                systemHealth.cpu.percent < 80 && systemHealth.memory.percent < 80 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {systemHealth.cpu.percent < 80 && systemHealth.memory.percent < 80 ? 'Healthy' : 'High Load'}
              </span>
            </div>
            <div className="space-y-4 overflow-y-auto scrollbar-thin flex-1 pr-2">
              {/* CPU */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    CPU Usage ({systemHealth.cpu.cores} cores)
                  </span>
                  <span className={`text-sm font-bold ${
                    systemHealth.cpu.percent < 60 ? 'text-green-600' :
                    systemHealth.cpu.percent < 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round(systemHealth.cpu.percent)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      systemHealth.cpu.percent < 60 ? 'bg-green-500' :
                      systemHealth.cpu.percent < 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${systemHealth.cpu.percent}%` }}
                  ></div>
                </div>
              </div>

              {/* Memory */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Memory ({systemHealth.memory.used_gb}/{systemHealth.memory.total_gb} GB)
                  </span>
                  <span className={`text-sm font-bold ${
                    systemHealth.memory.percent < 60 ? 'text-green-600' :
                    systemHealth.memory.percent < 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round(systemHealth.memory.percent)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      systemHealth.memory.percent < 60 ? 'bg-blue-500' :
                      systemHealth.memory.percent < 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${systemHealth.memory.percent}%` }}
                  ></div>
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Storage ({systemHealth.disk.used_gb}/{systemHealth.disk.total_gb} GB)
                  </span>
                  <span className={`text-sm font-bold ${
                    systemHealth.disk.percent < 70 ? 'text-green-600' :
                    systemHealth.disk.percent < 85 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round(systemHealth.disk.percent)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      systemHealth.disk.percent < 70 ? 'bg-purple-500' :
                      systemHealth.disk.percent < 85 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${systemHealth.disk.percent}%` }}
                  ></div>
                </div>
              </div>

              {/* Network */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Network Traffic
                  </span>
                  <span className="text-sm font-bold text-indigo-600">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-bold">↑</span>
                    <span className="text-gray-700 dark:text-gray-300">Sent: {systemHealth.network.sent_mb} MB</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600 font-bold">↓</span>
                    <span className="text-gray-700 dark:text-gray-300">Recv: {systemHealth.network.recv_mb} MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
