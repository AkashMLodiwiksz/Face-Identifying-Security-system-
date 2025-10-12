import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, Camera, Users, Bell } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call backend API for authentication
      const response = await api.post('/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        // Store auth token and user info
        if (rememberMe) {
          // Store in localStorage for persistent login
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('username', response.data.user.username);
          localStorage.setItem('userRole', response.data.user.role);
          localStorage.setItem('rememberMe', 'true');
        } else {
          // Store in sessionStorage for session-only login
          sessionStorage.setItem('authToken', response.data.token);
          sessionStorage.setItem('username', response.data.user.username);
          sessionStorage.setItem('userRole', response.data.user.role);
          // Also set a minimal flag in localStorage
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('username', response.data.user.username);
          localStorage.setItem('userRole', response.data.user.role);
        }
        
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
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
                <h3 className="font-semibold mb-1">Real-time Monitoring</h3>
                <p className="text-blue-100 text-sm">
                  24/7 surveillance with instant face detection and recognition
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Users className="w-6 h-6 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Intruder Detection</h3>
                <p className="text-blue-100 text-sm">
                  Automatic identification of unauthorized personnel
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Bell className="w-6 h-6 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Instant Alerts</h3>
                <p className="text-blue-100 text-sm">
                  Real-time notifications for security events
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-8">Sign in to access your security dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                  disabled={loading}
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-primary text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need access?{' '}
                <a href="#" className="text-primary font-semibold hover:underline">
                  Create Account
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
