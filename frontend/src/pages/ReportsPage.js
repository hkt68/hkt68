import Layout from '@/components/Layout';

function ReportsPage({ user, onLogout }) {
  return (
    <Layout user={user} onLogout={onLogout}>
      <h2>Raporlama</h2>
      <p>Bu sayfa yakında aktif olacak...</p>
    </Layout>
  );
}

export default ReportsPage;
