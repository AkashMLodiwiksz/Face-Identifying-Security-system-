import React from 'react';
import Layout from '../components/Layout';
import { Bell, Filter } from 'lucide-react';

const Alerts = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Alerts & Notifications</h2>
            <p className="text-gray-600 dark:text-gray-400">View and manage system alerts</p>
          </div>
          <button className="btn-primary flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter Alerts
          </button>
        </div>

        {/* Placeholder Content */}
        <div className="card text-center py-12">
          <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Alert Management System
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Real-time alerts for intruder detection and security events
          </p>
          <p className="text-sm text-gray-400">
            Coming soon: Real-time notifications and alert history
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Alerts;
