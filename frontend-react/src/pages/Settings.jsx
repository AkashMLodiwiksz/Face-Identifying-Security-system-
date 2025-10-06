import React from 'react';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Save } from 'lucide-react';

const Settings = () => {
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">System Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Configure system preferences and options</p>
          </div>
          <button className="btn-primary flex items-center">
            <Save className="w-5 h-5 mr-2" />
            Save Changes
          </button>
        </div>

        {/* Placeholder Content */}
        <div className="card text-center py-12">
          <SettingsIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            System Configuration
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Configure AI models, alert preferences, and system behavior
          </p>
          <p className="text-sm text-gray-400">
            Coming soon: AI settings, notifications, user management, and more
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
