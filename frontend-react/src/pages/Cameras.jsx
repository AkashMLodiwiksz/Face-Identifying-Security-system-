import React from 'react';
import Layout from '../components/Layout';
import { Video, Plus } from 'lucide-react';

const Cameras = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Camera Management</h2>
            <p className="text-gray-600 dark:text-gray-400">Configure and manage all cameras</p>
          </div>
          <button className="btn-primary flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add Camera
          </button>
        </div>

        {/* Placeholder Content */}
        <div className="card text-center py-12">
          <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Camera Configuration
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Add, configure, and manage RTSP cameras and PTZ controls
          </p>
          <p className="text-sm text-gray-400">
            Coming soon: Camera settings, RTSP URLs, PTZ configuration
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Cameras;
