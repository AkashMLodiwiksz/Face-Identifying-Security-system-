import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Search, Filter, Eye, AlertTriangle } from 'lucide-react';

const Intruders = () => {
  const [intruders] = useState([
    {
      id: 1,
      imageUrl: null,
      firstSeen: '2025-10-05 14:30:25',
      lastSeen: '2025-10-05 18:45:12',
      appearances: 5,
      threatLevel: 'critical',
      status: 'active',
      location: 'Front Entrance'
    },
    {
      id: 2,
      imageUrl: null,
      firstSeen: '2025-10-04 09:15:30',
      lastSeen: '2025-10-05 16:20:45',
      appearances: 12,
      threatLevel: 'high',
      status: 'active',
      location: 'Parking Lot'
    },
    {
      id: 3,
      imageUrl: null,
      firstSeen: '2025-10-03 11:45:15',
      lastSeen: '2025-10-03 12:10:30',
      appearances: 2,
      threatLevel: 'medium',
      status: 'cleared',
      location: 'Back Door'
    },
    {
      id: 4,
      imageUrl: null,
      firstSeen: '2025-10-02 22:30:00',
      lastSeen: '2025-10-02 23:15:45',
      appearances: 4,
      threatLevel: 'low',
      status: 'identified',
      location: 'Reception'
    },
  ]);

  const getThreatLevelColor = (level) => {
    switch (level) {
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'badge-info';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'badge-danger';
      case 'identified': return 'badge-info';
      case 'cleared': return 'badge-success';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search intruders..."
                className="input pl-10"
              />
            </div>
            <select className="input">
              <option value="">All Threat Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select className="input">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="identified">Identified</option>
              <option value="cleared">Cleared</option>
            </select>
            <button className="btn btn-primary">
              <Filter className="w-4 h-4 mr-2 inline" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Intruders</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">12</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Cases</p>
            <p className="text-3xl font-bold text-red-600">5</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Identified</p>
            <p className="text-3xl font-bold text-blue-600">3</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cleared</p>
            <p className="text-3xl font-bold text-green-600">4</p>
          </div>
        </div>

        {/* Intruders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {intruders.map((intruder) => (
            <div key={intruder.id} className="card p-0 overflow-hidden">
              {/* Image Placeholder */}
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
                <Eye className="w-16 h-16 text-gray-400" />
                
                {/* Threat Level Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`badge ${getThreatLevelColor(intruder.threatLevel)}`}>
                    {intruder.threatLevel}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`badge ${getStatusColor(intruder.status)}`}>
                    {intruder.status}
                  </span>
                </div>

                {/* Alert Icon for Critical */}
                {intruder.threatLevel === 'critical' && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <AlertTriangle className="w-12 h-12 text-red-600 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Intruder Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Intruder #{intruder.id}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>First Seen:</span>
                    <span className="font-medium">{intruder.firstSeen.split(' ')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Seen:</span>
                    <span className="font-medium">{intruder.lastSeen.split(' ')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Appearances:</span>
                    <span className="font-medium">{intruder.appearances}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="font-medium">{intruder.location}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 btn btn-primary text-xs py-2">
                    View Details
                  </button>
                  <button className="flex-1 btn bg-orange-500 hover:bg-orange-600 text-white text-xs py-2">
                    Report
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing 1 to 4 of 12 entries
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Previous
              </button>
              <button className="px-3 py-1 bg-primary text-white rounded">1</button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                3
              </button>
              <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Intruders;
