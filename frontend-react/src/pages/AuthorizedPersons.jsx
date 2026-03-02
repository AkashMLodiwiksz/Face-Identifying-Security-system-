import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { Users, Plus, Search, Trash2 } from 'lucide-react';
import api from '../services/api';

const AuthorizedPersons = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [name, setName] = React.useState('');
  const [videoStream, setVideoStream] = React.useState(null);
  const [captured, setCaptured] = React.useState(null);

  const openModal = () => {
    setShowModal(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        setVideoStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(err => console.error('camera error', err));
  };

  const closeModal = () => {
    setShowModal(false);
    setName('');
    setCaptured(null);
    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
      setVideoStream(null);
    }
  };

  const videoRef = React.useRef(null);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCaptured(dataUrl);
  };

  const submitPerson = () => {
    if (!name || !captured) return;
    api.post('/authorized_persons', { name, images: [captured] })
      .then(res => {
        console.log('created person', res.data);
        // reload list
        return api.get('/authorized_persons');
      })
      .then(r => {
        setPeople(r.data);
        closeModal();
      })
      .catch(err => console.error('failed add person', err));
  };

  const [people, setPeople] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  React.useEffect(() => {
    api.get('/authorized_persons')
      .then(res => setPeople(res.data))
      .catch(err => console.error('error loading people', err));
  }, []);

  const deletePerson = (id) => {
    api.delete(`/authorized_persons/${id}`)
      .then(() => setPeople(prev => prev.filter(p => p.id !== id)))
      .catch(err => console.error('delete failed', err));
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Authorized Persons</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage authorized personnel database</p>
          </div>
          <button className="btn-primary flex items-center" onClick={openModal}>
            <Plus className="w-5 h-5 mr-2" />
            Add Person
          </button>
        </div>

        {/* Search Bar */}
        <div className="card mb-6">
          <div className="flex items-center">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="input flex-1"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Authorized people list */}
        <div className="card mb-6">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.filter(p => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return p.name.toLowerCase().includes(q) || String(p.id).includes(q);
              }).map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">{p.id}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, id: p.id })}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete person"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {people.length === 0 && (
            <p className="text-center text-gray-500 py-6">No authorized persons yet</p>
          )}
        </div>
      </div>

      {/* Add person modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-dark-card rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Authorized Person</h3>
            <input
              type="text"
              placeholder="Name"
              className="input mb-4 w-full"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <div className="mb-4">
              {!captured ? (
                <div className="relative">
                  <video ref={videoRef} autoPlay className="w-full rounded" />
                  <button
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 btn btn-primary"
                    onClick={capturePhoto}
                  >Capture</button>
                </div>
              ) : (
                <img src={captured} className="w-full rounded" alt="capture" />
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <button className="btn" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={submitPerson} disabled={!name || !captured}>Add</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={() => deletePerson(deleteModal.id)}
        title="Delete Person?"
        message="Are you sure you want to delete this authorized person? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </Layout>
  );
};

export default AuthorizedPersons;
