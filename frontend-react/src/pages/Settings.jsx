import React from 'react';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = React.useState('recording');
  const [segmentDuration, setSegmentDuration] = React.useState(10);
  const [recordingsPath, setRecordingsPath] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const directoryInputRef = React.useRef(null);

  // detection settings
  const [objectConfidence, setObjectConfidence] = React.useState(70);

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
        if (res.data && res.data.object_confidence) {
          setObjectConfidence(Math.round(parseFloat(res.data.object_confidence) * 100));
        }
        if (res.data && res.data.recordings_path) {
          setRecordingsPath(res.data.recordings_path);
        }
      })
      .catch(err => console.error('Error loading settings', err));
  }, []);

  const saveSettings = () => {
    setSaving(true);
    Promise.all([
      api.post('/system_settings', { key: 'segment_duration', value: segmentDuration }),
      api.post('/system_settings', { key: 'object_confidence', value: (objectConfidence / 100).toFixed(2) }),
      api.post('/system_settings', { key: 'recordings_path', value: recordingsPath.trim() }),
    ])
      .then(() => setSaving(false))
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
              className={`mr-4 pb-2 ${activeTab === 'detection' ? 'border-b-2 border-primary text-primary' : 'text-gray-600 dark:text-gray-400'}`}
              onClick={() => setActiveTab('detection')}
            >
              Detection
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Recordings save path
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="e.g., C:\\MyRecordings\\CameraFiles"
                  value={recordingsPath}
                  onChange={(e) => setRecordingsPath(e.target.value)}
                />
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => directoryInputRef.current?.click()}
                >
                  Browse
                </button>
              </div>
              <input
                ref={directoryInputRef}
                type="file"
                webkitdirectory="true"
                directory="true"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    const first = files[0];
                    if (first.path) {
                      // Electron/Node environment available
                      const p = first.path;
                      const folder = p.substring(0, p.lastIndexOf(first.name));
                      setRecordingsPath(folder);
                    } else if (first.webkitRelativePath) {
                      const parts = first.webkitRelativePath.split('/');
                      if (parts.length > 0) {
                        setRecordingsPath(parts[0]);
                      }
                    }
                  }
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to use default: User profile Videos/recordings.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'detection' && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Object Detection (YOLOv8)</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Confidence Level
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={objectConfidence}
                  onChange={e => setObjectConfidence(parseInt(e.target.value, 10))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400 min-w-[3rem] text-right">{objectConfidence}%</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Only objects detected with confidence above this threshold will be recorded. Lower values detect more objects but may include false positives.
              </p>
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
      </div>
    </Layout>
  );
};

export default Settings;
