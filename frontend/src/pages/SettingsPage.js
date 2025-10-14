import Layout from '@/components/Layout';

function SettingsPage({ user, onLogout, updateTheme }) {
  return (
    <Layout user={user} onLogout={onLogout}>
      <h2>Ayarlar</h2>
      <p>Bu sayfa yakında aktif olacak...</p>
    </Layout>
  );
}

export default SettingsPage;
