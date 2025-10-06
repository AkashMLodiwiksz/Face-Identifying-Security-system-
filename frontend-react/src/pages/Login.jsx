import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Camera, Bell, Lock, User } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Test credentials: username = 1, password = 1
    if (username === '1' && password === '1') {
      // Store auth token
      localStorage.setItem('authToken', 'dummy-token');
      localStorage.setItem('username', username);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      alert('Invalid credentials! Use username: 1 and password: 1');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in">
        {/* Left Side - Branding */}
        <div className="md:w-1/2 bg-gradient-primary p-12 text-white flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="w-12 h-12 mr-3" />
              <h1 className="text-4xl font-bold">SecureVision AI</h1>
            </div>
            <p className="text-xl text-blue-100">
              Advanced Face Recognition Security System
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start">
              <Camera className="w-6 h-6 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Real-time Monitoring</h3>
                <p className="text-blue-100">
                  Monitor multiple cameras simultaneously with AI-powered detection
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Eye className="w-6 h-6 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Intelligent Recognition</h3>
                <p className="text-blue-100">
                  Identify faces, objects, and animals with high accuracy
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Bell className="w-6 h-6 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Instant Alerts</h3>
                <p className="text-blue-100">
                  Get notified immediately when unknown persons are detected
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-blue-300 border-opacity-30">
            <p className="text-sm text-blue-100">
              Powered by advanced AI including YOLO, FaceNet, and DeepSORT
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-gray-50">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-8">Please sign in to continue</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 animate-fade-in">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-primary text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="#" className="text-primary hover:text-primary-dark font-medium transition-colors">
                  Create Account
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
