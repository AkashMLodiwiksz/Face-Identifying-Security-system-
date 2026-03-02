import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
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
  Bell,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    cameras: { total: 0, online: 0, offline: 0 },
    authorizedPersons: { total: 24, active: 22, inactive: 2 },
    intrudersDetected: { today: 3, thisWeek: 12, thisMonth: 45 },
    detectionsToday: { total: 156, persons: 89, objects: 52, animals: 15 }
  });

  const [cameras, setCameras] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const navigate = useNavigate();

  const [systemHealth, setSystemHealth] = useState({
    cpu: { percent: 0, cores: 0 },
    memory: { percent: 0, used_gb: 0, total_gb: 0 },
    disk: { percent: 0, used_gb: 0, total_gb: 0 },
    network: { sent_mb: 0, recv_mb: 0 }
  });


  // Fetch camera data
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        // Get username from storage
        const username = localStorage.getItem('username') || sessionStorage.getItem('username');
        
        if (!username) {
          console.warn('No username found in storage, using default stats');
          // Use default stats if no username
          setCameras([]);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/cameras?username=${username}`);
        
        if (!response.ok) {
          console.warn('Failed to fetch cameras, using default stats');
          setCameras([]);
          return;
        }

        const data = await response.json();
        setCameras(Array.isArray(data) ? data : []);
        
        // Update stats based on actual camera data
        if (Array.isArray(data)) {
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
        }
      } catch (error) {
        console.error('Error fetching cameras:', error);
        // Continue with default stats on error
        setCameras([]);
      }
    };

    fetchCameras();
    // Refresh camera status every 10 seconds
    const interval = setInterval(fetchCameras, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent alerts from API
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts');
        setRecentAlerts(Array.isArray(res.data) ? res.data.slice(0, 3) : []);
      } catch (err) {
        console.error('Error fetching alerts:', err);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch authorized persons count
  useEffect(() => {
    const fetchAuthorized = async () => {
      try {
        const res = await api.get('/authorized_persons');
        const persons = Array.isArray(res.data) ? res.data : [];
        const activeCount = persons.length;
        setStats(prev => ({
          ...prev,
          authorizedPersons: { total: activeCount, active: activeCount, inactive: 0 }
        }));
      } catch (err) {
        console.error('Error fetching authorized persons:', err);
      }
    };
    fetchAuthorized();
  }, []);

  // Fetch intruders detected count
  useEffect(() => {
    const fetchIntruders = async () => {
      try {
        const res = await api.get('/intruders');
        const intruders = Array.isArray(res.data) ? res.data : [];
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let today = 0, thisWeek = 0, thisMonth = 0;
        intruders.forEach(i => {
          const seen = new Date(i.firstSeen);
          if (seen >= startOfToday) today++;
          if (seen >= startOfWeek) thisWeek++;
          if (seen >= startOfMonth) thisMonth++;
        });
        setStats(prev => ({
          ...prev,
          intrudersDetected: { today, thisWeek, thisMonth }
        }));
      } catch (err) {
        console.error('Error fetching intruders:', err);
      }
    };
    fetchIntruders();
    const interval = setInterval(fetchIntruders, 10000);
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



  return (
    <Layout>
      <div className="p-6 space-y-8">
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
              <p className="text-4xl font-bold mb-3">{stats.cameras.total}</p>
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
              {recentAlerts.filter(a => !a.isAcknowledged).length > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                  {recentAlerts.filter(a => !a.isAcknowledged).length} New
                </span>
              )}
            </div>
            <div className="space-y-3 overflow-y-auto scrollbar-thin flex-1 pr-2">
              {recentAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Bell className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">No alerts yet</p>
                </div>
              ) : (
                recentAlerts.map(alert => {
                  const severityStyles = {
                    critical: { bg: 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20', border: 'border-red-500', title: 'text-red-800 dark:text-red-300' },
                    high: { bg: 'bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20', border: 'border-orange-500', title: 'text-orange-800 dark:text-orange-300' },
                    medium: { bg: 'bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20', border: 'border-yellow-500', title: 'text-yellow-800 dark:text-yellow-300' },
                    low: { bg: 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20', border: 'border-blue-500', title: 'text-blue-800 dark:text-blue-300' },
                  };
                  const s = severityStyles[alert.severity] || severityStyles.medium;
                  // Time ago
                  const timeAgo = (() => {
                    if (!alert.timestamp) return '';
                    const diff = Math.floor((Date.now() - new Date(alert.timestamp).getTime()) / 1000);
                    if (diff < 60) return `${diff}s ago`;
                    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                    return `${Math.floor(diff / 86400)}d ago`;
                  })();
                  return (
                    <div key={alert.id} className={`p-4 ${s.bg} rounded-lg border-l-4 ${s.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold ${s.title} flex items-center`}>
                          {!alert.isAcknowledged && <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>}
                          {alert.message || alert.type}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{timeAgo}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded ${s.bg} ${s.title}`}>{alert.severity}</span>
                        {alert.isAcknowledged && <span className="text-[10px] text-green-500 font-medium">Acknowledged</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {recentAlerts.length > 0 && (
              <button
                onClick={() => navigate('/alerts')}
                className="mt-3 flex items-center justify-center text-sm text-blue-500 hover:text-blue-400 transition-colors w-full py-2 border-t border-gray-200 dark:border-gray-700"
              >
                View All Alerts <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}
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
              {cameras.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Camera className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">No cameras added</p>
                  <p className="text-xs mt-1">Add cameras to start monitoring</p>
                </div>
              ) : (
                cameras.map(cam => (
                  <div key={cam.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        cam.status === 'online' 
                          ? 'bg-green-500 animate-pulse' 
                          : 'bg-red-500'
                      }`}></div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                          {cam.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {cam.location || 'No location'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-gray-500">{cam.fps} FPS</span>
                      <span className={`px-2 py-1 rounded font-semibold ${
                        cam.status === 'online'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      }`}>
                        {cam.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))
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
