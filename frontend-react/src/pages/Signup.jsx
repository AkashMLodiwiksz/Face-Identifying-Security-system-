import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Shield, Camera, Users, Bell, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = '';

    if (password.length === 0) {
      return { score: 0, feedback: '' };
    }

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) {
      feedback = 'Weak';
    } else if (score <= 3) {
      feedback = 'Medium';
    } else if (score <= 4) {
      feedback = 'Strong';
    } else {
      feedback = 'Very Strong';
    }

    return { score, feedback };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength when password changes
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const validateForm = () => {
    // Username validation
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call backend API for registration
      const response = await api.post('/auth/signup', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        // Show success message and redirect to login
        setToast({
          isOpen: true,
          type: 'success',
          title: 'Account Created!',
          message: 'Your account has been created successfully. Please login with your credentials.'
        });
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Handle unsuccessful response
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      
      // Check if we got a response from server
      if (err.response) {
        // Server responded with error
        setError(err.response?.data?.message || 'Failed to create account. Please try again.');
      } else if (err.request) {
        // Request was made but no response
        setError('Cannot connect to server. Please check if the backend is running.');
      } else {
        // Something else happened
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];
    return colors[Math.min(passwordStrength.score - 1, 4)] || 'bg-gray-300';
  };

  const getPasswordStrengthWidth = () => {
    return `${(passwordStrength.score / 5) * 100}%`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in">
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

        {/* Right Side - Signup Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-gray-800">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-300 mb-8">Join SecureVision AI security platform</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Choose a username"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400"
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400 pr-12"
                    placeholder="Create a strong password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Password Strength:</span>
                      <span className={`text-xs font-semibold ${
                        passwordStrength.score <= 2 ? 'text-red-400' :
                        passwordStrength.score === 3 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {passwordStrength.feedback}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: getPasswordStrengthWidth() }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400 pr-12"
                    placeholder="Re-enter your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-primary text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        title={toast.title}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}
