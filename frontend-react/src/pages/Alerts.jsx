import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { Bell, Filter, CheckCircle, AlertTriangle, ShieldAlert, Clock, Trash2 } from 'lucide-react';
import api from '../services/api';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unacknowledged, acknowledged
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  useEffect(() => {
    loadAlerts();
    // Poll for new alerts every 5 seconds
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = () => {
    api.get('/alerts')
      .then(res => setAlerts(res.data))
      .catch(err => console.error('Error loading alerts:', err));
  };

  const acknowledgeAlert = (id) => {
    api.post(`/alerts/${id}/acknowledge`)
      .then(() => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, isAcknowledged: true } : a));
      })
      .catch(err => console.error('Acknowledge failed:', err));
  };

  const deleteAlert = (id) => {
    api.delete(`/alerts/${id}`)
      .then(() => setAlerts(prev => prev.filter(a => a.id !== id)))
      .catch(err => console.error('Delete failed:', err));
  };

  const deleteAllAlerts = () => {
    api.delete('/alerts')
      .then(() => setAlerts([]))
      .catch(err => console.error('Delete all failed:', err));
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'unacknowledged') return !a.isAcknowledged;
    if (filter === 'acknowledged') return a.isAcknowledged;
    return true;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Alerts & Notifications</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {alerts.filter(a => !a.isAcknowledged).length} unacknowledged alert{alerts.filter(a => !a.isAcknowledged).length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex space-x-2 items-center">
            {['all', 'unacknowledged', 'acknowledged'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            {alerts.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center ml-2"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`card flex items-start justify-between border-l-4 ${getSeverityColor(alert.severity)} ${
                alert.isAcknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {getSeverityIcon(alert.severity)}
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">{alert.message}</p>
                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {alert.timestamp}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{alert.type}</span>
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      alert.severity === 'critical' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' :
                      alert.severity === 'high' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>{alert.severity}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 ml-4">
                {!alert.isAcknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="flex items-center text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Acknowledge
                  </button>
                )}
                {alert.isAcknowledged && (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Acknowledged
                  </span>
                )}
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="flex items-center text-sm bg-red-500 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg transition-colors"
                  title="Delete alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="card text-center py-12">
            <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Alerts
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'all' ? 'No security alerts have been triggered yet' : `No ${filter} alerts`}
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={deleteAllAlerts}
        title="Delete All Alerts?"
        message="Are you sure you want to delete all alerts? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </Layout>
  );
};

export default Alerts;
