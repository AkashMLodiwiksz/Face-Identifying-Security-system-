import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import Intruders from './pages/Intruders';
import AuthorizedPersons from './pages/AuthorizedPersons';
import Alerts from './pages/Alerts';
import Detections from './pages/Detections';
import Cameras from './pages/Cameras';
import Settings from './pages/Settings';

function App() {
  // Check if user is authenticated
  const isAuthenticated = () => {
    return localStorage.getItem('authToken') !== null;
  };

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

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

