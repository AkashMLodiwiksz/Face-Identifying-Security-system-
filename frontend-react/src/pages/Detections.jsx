import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import {
  Eye, Search, Clock, Camera, Trash2, RefreshCw, Calendar,
  Car, Bug, Tv, UtensilsCrossed, Dumbbell, Sofa, Package,
  Zap, TrendingUp
} from 'lucide-react';
import api from '../services/api';

// Category styling
const CATEGORY_CONFIG = {
  vehicle:        { color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400',   icon: Car },
  animal:         { color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-400', icon: Bug },
  electronics:    { color: '#8b5cf6', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: Tv },
  food:           { color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-400',     icon: UtensilsCrossed },
  kitchen:        { color: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: UtensilsCrossed },
  sports:         { color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: Dumbbell },
  furniture:      { color: '#6366f1', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', icon: Sofa },
  accessory:      { color: '#ec4899', bg: 'bg-pink-100 dark:bg-pink-900/30',    text: 'text-pink-700 dark:text-pink-400',   icon: Package },
  infrastructure: { color: '#64748b', bg: 'bg-slate-100 dark:bg-slate-900/30',  text: 'text-slate-700 dark:text-slate-400', icon: Package },
  tool:           { color: '#dc2626', bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-400',     icon: Zap },
  item:           { color: '#06b6d4', bg: 'bg-cyan-100 dark:bg-cyan-900/30',    text: 'text-cyan-700 dark:text-cyan-400',   icon: Package },
  other:          { color: '#9ca3af', bg: 'bg-gray-100 dark:bg-gray-900/30',    text: 'text-gray-700 dark:text-gray-400',   icon: Package },
};

const getCategoryStyle = (category) => CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;

const Detections = () => {
  // ─────── History state ───────
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadDetections();
    const interval = setInterval(loadDetections, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadDetections = async () => {
    try {
      const res = await api.get('/object-detections');
      setDetections(res.data);
    } catch (err) {
      console.error('Error loading object detections:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─────── History helpers ───────
  const deleteDetection = async (id) => {
    try {
      await api.delete(`/object-detections/${id}`);
      setDetections(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting detection:', err);
    }
  };

  const deleteAllDetections = async () => {
    try {
      await api.delete('/object-detections');
      setDetections([]);
    } catch (err) {
      console.error('Error deleting all detections:', err);
    }
  };

  const filteredDetections = detections.filter(d => {
    if (filter !== 'all' && d.category !== filter) return false;
    if (dateFilter) {
      const detDate = d.timestamp.split(' ')[0];
      if (detDate !== dateFilter) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return d.label.toLowerCase().includes(q) ||
             d.category.toLowerCase().includes(q) ||
             String(d.id).includes(q) ||
             d.timestamp.toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const stats = {
    total: detections.length,
    today: detections.filter(d => {
      const today = new Date().toISOString().split('T')[0];
      return d.timestamp.startsWith(today);
    }).length,
    animals: detections.filter(d => d.category === 'animal').length,
    vehicles: detections.filter(d => d.category === 'vehicle').length,
  };

  const getTimeBadge = (timestamp) => {
    const now = new Date();
    const det = new Date(timestamp);
    const diffMs = now - det;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Category badge component
  const CategoryBadge = ({ category }) => {
    const style = getCategoryStyle(category);
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {category}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Objects</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-lg">
                <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Animals</p>
                <p className="text-2xl font-bold text-amber-600">{stats.animals}</p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-lg">
                <Bug className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vehicles</p>
                <p className="text-2xl font-bold text-blue-500">{stats.vehicles}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg">
                <Car className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search label, category, ID..."
                className="bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 w-full"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 overflow-x-auto max-w-full">
              {['all', 'vehicle', 'animal', 'electronics', 'food', 'sports', 'furniture', 'tool'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    filter === f
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Date */}
            <input
              type="date"
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm outline-none border-none"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />

            {/* Refresh */}
            <button
              onClick={loadDetections}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Delete All */}
            {detections.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* ── Detection History Table ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Detection History</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : filteredDetections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Object</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Camera</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confidence</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">When</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredDetections.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono font-medium text-gray-800 dark:text-white">#{d.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-white capitalize">{d.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <CategoryBadge category={d.category} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <Camera className="w-3.5 h-3.5" />
                          {d.cameraName || `Camera ${d.cameraId}`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                d.confidence >= 0.7 ? 'bg-green-500' : d.confidence >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.round(d.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {Math.round(d.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{d.timestamp}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3" />
                          {getTimeBadge(d.timestamp)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, id: d.id })}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Eye className="w-16 h-16 mb-4 opacity-40" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">No Object Detections</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {detections.length === 0 ? 'Start live detection to record objects' : 'No detections match your filters'}
              </p>
            </div>
          )}
        </div>

        {/* Results count */}
        {filteredDetections.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
            Showing {filteredDetections.length} of {detections.length} object detections
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={() => deleteDetection(deleteModal.id)}
        title="Delete Detection?"
        message="Are you sure you want to delete this object detection record?"
        confirmText="Delete"
        type="danger"
      />

      <ConfirmModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={deleteAllDetections}
        title="Delete All Object Detections?"
        message="This will permanently delete all object detection records."
        confirmText="Delete All"
        type="danger"
      />
    </Layout>
  );
};

export default Detections;
