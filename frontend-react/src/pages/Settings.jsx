import React from 'react';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = React.useState('recording');
  const [segmentDuration, setSegmentDuration] = React.useState(10);
  const [saving, setSaving] = React.useState(false);

  // password fields
  const [currentPw, setCurrentPw] = React.useState('');
  const [newPw, setNewPw] = React.useState('');
  const [confirmPw, setConfirmPw] = React.useState('');
  const [pwMessage, setPwMessage] = React.useState(null);
  const [pwSaving, setPwSaving] = React.useState(false);

  React.useEffect(() => {
    api.get('/system_settings')
      .then(res => {
        if (res.data && res.data.segment_duration) {
          setSegmentDuration(res.data.segment_duration);
        }
      })
      .catch(err => console.error('Error loading settings', err));
  }, []);

  const saveSettings = () => {
    setSaving(true);
    api.post('/system_settings', { key: 'segment_duration', value: segmentDuration })
      .then(() => {
        setSaving(false);
      })
      .catch(err => {
        console.error('Failed to save settings', err);
        setSaving(false);
      });
  };

  const changePassword = () => {
    setPwMessage(null);
    if (!currentPw || !newPw) {
      setPwMessage({ type:'error', text:'Fill both fields' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMessage({ type:'error', text:'Passwords do not match' });
      return;
    }
    setPwSaving(true);
    api.post('/user/password', {
      username: localStorage.getItem('username'),
      current_password: currentPw,
      new_password: newPw
    })
    .then(res => {
      setPwMessage({ type:'success', text:'Password updated' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    })
    .catch(err => {
      const msg = err.response?.data?.error || err.message;
      setPwMessage({ type:'error', text: msg });
    })
    .finally(()=> setPwSaving(false));
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">System Settings</h2>
              <p className="text-gray-600 dark:text-gray-400">Configure system preferences and options</p>
            </div>
            <button className="btn-primary flex items-center" onClick={saveSettings} disabled={saving}>
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {/* tab navigation */}
          <div className="mt-4 border-b border-gray-300 dark:border-gray-600">
            <button
              className={`mr-4 pb-2 ${activeTab === 'recording' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 dark:text-gray-400'}`}
              onClick={() => setActiveTab('recording')}
            >
              Recording
            </button>
            <button
              className={`pb-2 ${activeTab === 'account' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 dark:text-gray-400'}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
          </div>
        </div>

        {activeTab === 'recording' && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Recording</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Segment duration (seconds)
              </label>
              <input
                type="number"
                min="1"
                className="input w-24"
                value={segmentDuration}
                onChange={(e) => setSegmentDuration(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            {pwMessage && (
              <div className={`mb-4 text-sm ${pwMessage.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{pwMessage.text}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                <input
                  type="password"
                  className="input"
                  value={currentPw}
                  onChange={e=>setCurrentPw(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                <input
                  type="password"
                  className="input"
                  value={newPw}
                  onChange={e=>setNewPw(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                <input
                  type="password"
                  className="input"
                  value={confirmPw}
                  onChange={e=>setConfirmPw(e.target.value)}
                />
              </div>
            </div>
            <button
              className="mt-4 btn-primary"
              onClick={changePassword}
              disabled={pwSaving}
            >
              {pwSaving ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        )}

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
