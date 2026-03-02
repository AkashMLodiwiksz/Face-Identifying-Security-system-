import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { Search, Filter, Eye, AlertTriangle, Trash2, Clock, Camera, Film, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';

const Intruders = () => {
  const [intruders, setIntruders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const loadIntruders = (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params.dateTo) query.append('dateTo', params.dateTo);
    api.get(`/intruders?${query.toString()}`)
      .then(res => setIntruders(res.data))
      .catch(err => console.error('error loading intruders', err));
  };

  useEffect(() => {
    loadIntruders();
  }, []);

  const applyFilters = () => {
    loadIntruders({ status: statusFilter, dateFrom, dateTo });
  };

  const markIdentified = (id) => {
    api.patch(`/intruders/${id}`, { status: 'identified' })
      .then(() => {
        setIntruders(prev => prev.map(i => i.id === id ? { ...i, status: 'identified' } : i));
      })
      .catch(err => console.error('update failed', err));
  };

  const deleteIntruder = (id) => {
    api.delete(`/intruders/${id}`)
      .then(() => setIntruders(prev => prev.filter(i => i.id !== id)))
      .catch(err => console.error('delete failed', err));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="identified">Identified</option>
            </select>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
            <button className="btn btn-primary" onClick={applyFilters}>
              <Filter className="w-4 h-4 mr-2 inline" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Intruders</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{intruders.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Cases</p>
            <p className="text-3xl font-bold text-red-600">{intruders.filter(i => i.status === 'active').length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Identified</p>
            <p className="text-3xl font-bold text-blue-600">{intruders.filter(i => i.status === 'identified').length}</p>
          </div>
        </div>

        {/* Intruders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {intruders.map((intruder) => (
            <div key={intruder.id} className="card p-0 overflow-hidden">
              {/* Image */}
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
                {intruder.imageUrl ? (
                  <img src={`http://localhost:5000${intruder.imageUrl}`} alt="Intruder" className="w-full h-full object-cover" />
                ) : (
                  <Eye className="w-16 h-16 text-gray-400" />
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`badge ${intruder.status === 'active' ? 'badge-danger' : 'badge-info'}`}>
                    {intruder.status}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => setDeleteModal({ isOpen: true, id: intruder.id })}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Intruder Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                  Intruder #{intruder.id}
                </h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <Camera className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {intruder.camera}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                  First seen: {intruder.firstSeen}
                </div>
                {intruder.lastSeen && intruder.lastSeen !== intruder.firstSeen && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                    Last seen: {intruder.lastSeen}
                  </div>
                )}
                {intruder.appearances > 1 && (
                  <p className="text-xs text-orange-500 mt-1 font-medium">Seen {intruder.appearances} times</p>
                )}

                {/* Expand/Collapse for appearance details */}
                {intruder.appearancesList && intruder.appearancesList.length > 0 && (
                  <button
                    onClick={() => setExpandedId(expandedId === intruder.id ? null : intruder.id)}
                    className="mt-2 flex items-center text-xs text-blue-500 hover:text-blue-400 transition-colors w-full"
                  >
                    {expandedId === intruder.id ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                    {expandedId === intruder.id ? 'Hide' : 'Show'} capture details ({intruder.appearancesList.length})
                  </button>
                )}

                {/* Expanded appearance timestamps */}
                {expandedId === intruder.id && (
                  <div className="mt-2 space-y-2 border-t border-gray-700 pt-2">
                    {/* Appearance timeline */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Capture Timeline</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {intruder.appearancesList.map((ap, idx) => (
                          <div key={ap.id || idx} className="flex items-center justify-between text-xs bg-gray-800/50 rounded px-2 py-1">
                            <div className="flex items-center text-gray-300">
                              <Clock className="w-3 h-3 mr-1.5 text-orange-400 flex-shrink-0" />
                              {ap.timestamp}
                            </div>
                            <span className="text-gray-500 text-[10px]">{ap.camera}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recording segments */}
                    {intruder.recordingSegments && intruder.recordingSegments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">In Recording Segments</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {intruder.recordingSegments.map((seg, idx) => (
                            <div key={idx} className="text-xs bg-indigo-900/30 border border-indigo-700/40 rounded px-2 py-1.5">
                              <div className="flex items-center text-indigo-300 mb-0.5">
                                <Film className="w-3 h-3 mr-1.5 flex-shrink-0" />
                                {seg.camera}
                              </div>
                              <div className="text-gray-400 pl-4.5">
                                {seg.startTime} &rarr; {seg.endTime}
                              </div>
                              <div className="text-orange-400 pl-4.5 text-[10px]">
                                Detected at {seg.detectedAt}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* For active intruders show identify button */}
                {intruder.status === 'active' && (
                  <button
                    className="mt-3 btn btn-success w-full"
                    onClick={() => markIdentified(intruder.id)}
                  >
                    Mark Identified
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {intruders.length === 0 && (
          <div className="card text-center py-12">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No intruders detected yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Unknown faces will appear here automatically</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={() => deleteIntruder(deleteModal.id)}
        title="Delete Intruder?"
        message="Are you sure you want to delete this intruder record? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </Layout>
  );
};

export default Intruders;
