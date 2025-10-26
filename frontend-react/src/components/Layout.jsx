import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import backgroundRecordingService from '../services/backgroundRecording';
import { 
  LayoutDashboard, 
  Camera, 
  UserX, 
  Users, 
  Bell, 
  Eye,
  Settings,
  Video,
  Film,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/live-monitoring', icon: Camera, label: 'Live Monitoring' },
    { path: '/recordings', icon: Film, label: 'Recordings' },
    { path: '/intruders', icon: UserX, label: 'Intruder Gallery' },
    { path: '/authorized-persons', icon: Users, label: 'Authorized Persons' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { path: '/detections', icon: Eye, label: 'Detection Events' },
    { path: '/cameras', icon: Video, label: 'Camera Management' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    // Stop background recording service
    backgroundRecordingService.stop();
    
    // Clear both localStorage and sessionStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userRole');
    navigate('/login');
  };

  const username = localStorage.getItem('username') || sessionStorage.getItem('username') || 'User';
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'User';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-dark-sidebar text-white transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {sidebarOpen && (
            <span className="text-xl font-bold animate-fade-in">SecureVision AI</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } ${!sidebarOpen && 'justify-center'}`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="ml-3 animate-fade-in">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{username}</p>
                <p className="text-xs text-gray-400 truncate capitalize">{userRole}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-dark-card shadow-sm flex items-center justify-between px-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h1>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {username}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-xl py-2 animate-fade-in z-50">
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;
