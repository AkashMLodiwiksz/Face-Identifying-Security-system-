import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Play, Pause, Maximize, Camera as CameraIcon } from 'lucide-react';

const LiveMonitoring = () => {
  const [cameras] = useState([
    { id: 1, name: 'Front Entrance', status: 'online', fps: 30 },
    { id: 2, name: 'Back Door', status: 'online', fps: 30 },
    { id: 3, name: 'Parking Lot', status: 'online', fps: 25 },
    { id: 4, name: 'Reception Area', status: 'online', fps: 30 },
    { id: 5, name: 'Hallway', status: 'online', fps: 30 },
    { id: 6, name: 'Server Room', status: 'offline', fps: 0 },
  ]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Controls */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="btn btn-primary">
                <Play className="w-4 h-4 mr-2 inline" />
                Start All
              </button>
              <button className="btn bg-gray-600 hover:bg-gray-700 text-white">
                <Pause className="w-4 h-4 mr-2 inline" />
                Pause All
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Detection Boxes:
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => (
            <div key={camera.id} className="card p-0 overflow-hidden">
              {/* Camera Feed Placeholder */}
              <div className="relative aspect-video bg-gray-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <CameraIcon className="w-16 h-16 text-gray-600" />
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`badge ${camera.status === 'online' ? 'badge-success' : 'badge-danger'}`}>
                    {camera.status === 'online' ? '● Live' : '● Offline'}
                  </span>
                </div>

                {/* FPS Counter */}
                {camera.status === 'online' && (
                  <div className="absolute top-3 right-3">
                    <span className="badge badge-info">
                      {camera.fps} FPS
                    </span>
                  </div>
                )}

                {/* Detection Boxes (Example) */}
                {camera.status === 'online' && camera.id === 1 && (
                  <div className="absolute top-1/3 left-1/4 w-32 h-40 border-2 border-green-500 rounded">
                    <span className="absolute -top-6 left-0 text-xs bg-green-500 text-white px-2 py-1 rounded">
                      Person: 98%
                    </span>
                  </div>
                )}
              </div>

              {/* Camera Info & Controls */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {camera.name}
                  </h3>
                  <span className="text-xs text-gray-500">Camera {camera.id}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <Play className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <Pause className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default LiveMonitoring;
