import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { 
  Video, 
  Plus, 
  Edit2, 
  Trash2, 
  Power, 
  PowerOff, 
  Wifi, 
  WifiOff,
  CheckCircle,
  XCircle,
  Camera as CameraIcon,
  Monitor,
  Settings
} from 'lucide-react';
import api from '../services/api';

const Cameras = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    rtsp_url: '',
    camera_type: 'IP',
    fps: 30,
    resolution: '1920x1080',
    is_ptz: false
  });
  const [testingConnection, setTestingConnection] = useState(null);

  const username = localStorage.getItem('username') || sessionStorage.getItem('username');

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const response = await api.get(`/cameras?username=${username}`);
      setCameras(response.data);
    } catch (error) {
      console.error('Error fetching cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCamera) {
        // Update existing camera
        await api.put(`/cameras/${editingCamera.id}`, {
          ...formData,
          username
        });
        setToast({
          isOpen: true,
          type: 'success',
          title: 'Camera Updated!',
          message: `Camera "${formData.name}" has been updated successfully.`
        });
      } else {
        // Add new camera
        await api.post('/cameras', {
          ...formData,
          username
        });
        setToast({
          isOpen: true,
          type: 'success',
          title: 'Camera Added!',
          message: `Camera "${formData.name}" has been added successfully.`
        });
      }
      
      setShowAddModal(false);
      setEditingCamera(null);
      resetForm();
      fetchCameras();
    } catch (error) {
      console.error('Error saving camera:', error);
      setToast({
        isOpen: true,
        type: 'error',
        title: 'Failed to Save Camera',
        message: error.response?.data?.message || 'An error occurred while saving the camera.'
      });
    }
  };

  const handleEdit = (camera) => {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      location: camera.location,
      rtsp_url: camera.rtsp_url,
      camera_type: camera.camera_type,
      fps: camera.fps,
      resolution: camera.resolution,
      is_ptz: camera.is_ptz
    });
    setShowAddModal(true);
  };

  const handleDelete = async (cameraId) => {
    // Show confirmation state
    setShowDeleteConfirm(cameraId);
  };

  const confirmDelete = async () => {
    const cameraId = showDeleteConfirm;
    setShowDeleteConfirm(null);

    try {
      await api.delete(`/cameras/${cameraId}?username=${username}`);
      setToast({
        isOpen: true,
        type: 'success',
        title: 'Camera Deleted!',
        message: 'The camera has been deleted successfully.'
      });
      fetchCameras();
    } catch (error) {
      console.error('Error deleting camera:', error);
      setToast({
        isOpen: true,
        type: 'error',
        title: 'Failed to Delete Camera',
        message: 'An error occurred while deleting the camera.'
      });
    }
  };

  const handleTestConnection = async (cameraId) => {
    setTestingConnection(cameraId);
    
    try {
      const response = await api.post(`/cameras/${cameraId}/test`, { username });
      if (response.data.success) {
        setToast({
          isOpen: true,
          type: 'success',
          title: 'Connection Successful!',
          message: 'Camera connection has been tested successfully.'
        });
        fetchCameras(); // Refresh to get updated status
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setToast({
        isOpen: true,
        type: 'error',
        title: 'Connection Failed',
        message: 'Failed to connect to the camera. Please check your settings.'
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      rtsp_url: '',
      camera_type: 'IP',
      fps: 30,
      resolution: '1920x1080',
      is_ptz: false
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCamera(null);
    resetForm();
  };

  const getCameraIcon = (type) => {
    switch(type) {
      case 'IP': return <Wifi className="w-5 h-5" />;
      case 'CCTV': return <Video className="w-5 h-5" />;
      case 'USB': return <CameraIcon className="w-5 h-5" />;
      case 'PTZ': return <Monitor className="w-5 h-5" />;
      default: return <Video className="w-5 h-5" />;
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Camera Management</h2>
            <p className="text-gray-600 dark:text-gray-400">Configure and manage all cameras</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Camera
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading cameras...</p>
          </div>
        ) : cameras.length === 0 ? (
          <div className="card text-center py-12">
            <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Cameras Added
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add your first CCTV camera to start monitoring
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Camera
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cameras.map((camera) => (
              <div key={camera.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${
                      camera.status === 'online' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                    }`}>
                      {getCameraIcon(camera.camera_type)}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {camera.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {camera.camera_type} Camera
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {camera.status === 'online' ? (
                      <Wifi className="w-5 h-5 text-green-500" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 w-24">Location:</span>
                    <span className="text-gray-700 dark:text-gray-300">{camera.location || 'Not set'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 w-24">Resolution:</span>
                    <span className="text-gray-700 dark:text-gray-300">{camera.resolution}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 w-24">FPS:</span>
                    <span className="text-gray-700 dark:text-gray-300">{camera.fps}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 w-24">Status:</span>
                    <span className={`flex items-center ${
                      camera.status === 'online' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {camera.status === 'online' ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      {camera.status}
                    </span>
                  </div>
                  {camera.is_ptz && (
                    <div className="flex items-center text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs">
                        PTZ Enabled
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleTestConnection(camera.id)}
                    disabled={testingConnection === camera.id}
                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {testingConnection === camera.id ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </span>
                    ) : (
                      'Test'
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(camera)}
                    className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(camera.id)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Camera Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {editingCamera ? 'Edit Camera' : 'Add New Camera'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Camera Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Front Door Camera"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Main Entrance"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      RTSP URL / IP Address *
                    </label>
                    <input
                      type="text"
                      name="rtsp_url"
                      value={formData.rtsp_url}
                      onChange={handleInputChange}
                      required
                      placeholder="rtsp://admin:password@192.168.1.100:554/stream"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Format: rtsp://username:password@ip:port/path
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Camera Type
                      </label>
                      <select
                        name="camera_type"
                        value={formData.camera_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="IP">IP Camera</option>
                        <option value="CCTV">CCTV</option>
                        <option value="USB">USB Camera</option>
                        <option value="PTZ">PTZ Camera</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Resolution
                      </label>
                      <select
                        name="resolution"
                        value={formData.resolution}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="640x480">640x480</option>
                        <option value="1280x720">1280x720 (HD)</option>
                        <option value="1920x1080">1920x1080 (FHD)</option>
                        <option value="2560x1440">2560x1440 (QHD)</option>
                        <option value="3840x2160">3840x2160 (4K)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        FPS
                      </label>
                      <input
                        type="number"
                        name="fps"
                        value={formData.fps}
                        onChange={handleInputChange}
                        min="1"
                        max="60"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_ptz"
                      checked={formData.is_ptz}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Enable PTZ (Pan-Tilt-Zoom) Controls
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingCamera ? 'Update Camera' : 'Add Camera'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Delete Camera?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this camera? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Toast Notification */}
        <Toast
          isOpen={toast.isOpen}
          onClose={() => setToast({ ...toast, isOpen: false })}
          title={toast.title}
          message={toast.message}
          type={toast.type}
        />
      </div>
    </Layout>
  );
};

export default Cameras;
