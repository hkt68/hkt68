import Layout from '@/components/Layout';

function CustomersPage({ user, onLogout }) {
  return (
    <Layout user={user} onLogout={onLogout}>
      <h2>Cari Müşteri Yönetimi</h2>
      <p>Bu sayfa yakında aktif olacak...</p>
    </Layout>
  );
}

export default CustomersPage;
