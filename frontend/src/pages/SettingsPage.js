import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { Palette, Users, Save, Database } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const themes = [
  { id: 'blue', name: 'Klasik Mavi', color: '#3b82f6' },
  { id: 'green', name: 'Yeşil Doğa', color: '#10b981' },
  { id: 'orange', name: 'Turuncu Enerji', color: '#f97316' },
  { id: 'purple', name: 'Mor Premium', color: '#8b5cf6' },
  { id: 'gray', name: 'Koyu Gri', color: '#475569' }
];

function SettingsPage({ user, onLogout, updateTheme }) {
  const [settings, setSettings] = useState({ company_name: '', site_title: '', logo_url: '', theme: 'blue' });
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    if (user.role === 'admin') {
      loadUsers();
      loadLogs();
    }
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Settings load error:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Users load error:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await axios.get(`${API}/logs`);
      setLogs(response.data.slice(0, 50));
    } catch (error) {
      console.error('Logs load error:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/settings`, settings);
      updateTheme(settings.theme);
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <Toaster position="top-right" richColors />
      <div className="page-header">
        <h2>Ayarlar</h2>
      </div>

      <div className="card">
        <h3><Palette size={20} /> Genel Ayarlar</h3>
        
        <div className="input-group">
          <label>Firma Adı</label>
          <input type="text" value={settings.company_name} onChange={(e) => setSettings({...settings, company_name: e.target.value})} />
        </div>

        <div className="input-group">
          <label>Site Başlığı</label>
          <input type="text" value={settings.site_title} onChange={(e) => setSettings({...settings, site_title: e.target.value})} />
        </div>

        <div className="input-group">
          <label>Logo URL</label>
          <input type="text" value={settings.logo_url} onChange={(e) => setSettings({...settings, logo_url: e.target.value})} placeholder="https://..." />
        </div>

        <div className="input-group">
          <label>Tema Seçimi</label>
          <div className="theme-grid">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className={`theme-option ${settings.theme === theme.id ? 'active' : ''}`}
                onClick={() => setSettings({...settings, theme: theme.id})}
              >
                <div className="theme-color" style={{ backgroundColor: theme.color }} />
                <div className="theme-name">{theme.name}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSaveSettings} disabled={loading}>
          <Save size={20} />
          {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </button>
      </div>

      {user.role === 'admin' && (
        <>
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3><Users size={20} /> Kullanıcı Yönetimi</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Kullanıcı</th><th>Email</th><th>Rol</th><th>Durum</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.full_name}</strong> ({u.username})</td>
                      <td>{u.email}</td>
                      <td><span className="badge badge-primary">{u.role === 'admin' ? 'Admin' : 'Kullanıcı'}</span></td>
                      <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Aktif' : 'Pasif'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ marginTop: '2rem' }}>
            <h3><Database size={20} /> Aktivite Logları</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Tarih</th><th>Kullanıcı</th><th>İşlem</th><th>Modül</th></tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleString('tr-TR')}</td>
                      <td>{log.user}</td>
                      <td>{log.description}</td>
                      <td><span className="badge badge-primary">{log.module}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .page-header { margin-bottom: 2rem; }
        .page-header h2 { font-size: 1.875rem; font-weight: 700; color: var(--text-primary); }
        .card h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem; }
        .theme-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 0.5rem; }
        .theme-option { padding: 1rem; border: 2px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: center; }
        .theme-option:hover { border-color: var(--primary); }
        .theme-option.active { border-color: var(--primary); background: var(--bg-tertiary); }
        .theme-color { width: 50px; height: 50px; border-radius: 50%; margin: 0 auto 0.5rem; }
        .theme-name { font-size: 0.875rem; font-weight: 500; }
      `}</style>
    </Layout>
  );
}

export default SettingsPage;
