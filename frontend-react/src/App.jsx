import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import Intruders from './pages/Intruders';
import AuthorizedPersons from './pages/AuthorizedPersons';
import Alerts from './pages/Alerts';
import Detections from './pages/Detections';
import Cameras from './pages/Cameras';
import Recordings from './pages/Recordings';
import Settings from './pages/Settings';
import backgroundRecordingService from './services/backgroundRecording';

function App() {
  // Check if user is authenticated
  const isAuthenticated = () => {
    return localStorage.getItem('authToken') !== null;
  };

  // Auto-start recording on app load if user is authenticated
  useEffect(() => {
    const initializeRecordingOnAppLoad = async () => {
      if (isAuthenticated()) {
        try {
          const status = backgroundRecordingService.getStatus();
          
          if (!status.isInitialized) {
            console.log('📍 App: User authenticated but recording not started, initializing...');
            // Start recording asynchronously without blocking UI
            backgroundRecordingService.start().catch(error => {
              console.warn('⚠️ App: Background recording failed (may need camera permission):', error.message);
              // Don't block app loading if recording fails
            });
          } else {
            console.log('✅ App: Recording already initialized');
          }
        } catch (error) {
          console.error('❌ App: Error initializing recording:', error);
          // Don't block app loading
        }
      }
    };
    
    // Delay slightly to ensure UI renders first
    const timer = setTimeout(() => {
      initializeRecordingOnAppLoad();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/live-monitoring" 
            element={
              <ProtectedRoute>
                <LiveMonitoring />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/intruders" 
            element={
              <ProtectedRoute>
                <Intruders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/authorized-persons" 
            element={
              <ProtectedRoute>
                <AuthorizedPersons />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alerts" 
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/detections" 
            element={
              <ProtectedRoute>
                <Detections />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cameras" 
            element={
              <ProtectedRoute>
                <Cameras />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recordings" 
            element={
              <ProtectedRoute>
                <Recordings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />

          {/* Redirect root to dashboard or login */}
          <Route 
            path="/" 
            element={
              isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } 
          />

          {/* 404 - Redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

