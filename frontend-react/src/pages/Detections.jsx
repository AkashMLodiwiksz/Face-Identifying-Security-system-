import React from 'react';
import Layout from '../components/Layout';
import { Eye, Calendar } from 'lucide-react';

const Detections = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Detection Events</h2>
            <p className="text-gray-600 dark:text-gray-400">All detected objects, persons, and animals</p>
          </div>
          <button className="btn-primary flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Date Range
          </button>
        </div>

        {/* Placeholder Content */}
        <div className="card text-center py-12">
          <Eye className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Detection Events Log
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Comprehensive history of all detection events from all cameras
          </p>
          <p className="text-sm text-gray-400">
            Coming soon: Face, object, and animal detection history with filtering
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Detections;
