import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { ShoppingCart, Package, Users, TrendingUp, DollarSign } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayCount: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStock: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [salesRes, productsRes, customersRes, salesListRes] = await Promise.all([
        axios.get(`${API}/reports/sales?start_date=${today.toISOString()}&end_date=${tomorrow.toISOString()}`),
        axios.get(`${API}/products`),
        axios.get(`${API}/customers`),
        axios.get(`${API}/sales`)
      ]);

      const lowStockProducts = productsRes.data.filter(p => p.stock < 10);

      setStats({
        todaySales: salesRes.data.total_sales || 0,
        todayCount: salesRes.data.total_count || 0,
        totalProducts: productsRes.data.length,
        totalCustomers: customersRes.data.length,
        lowStock: lowStockProducts.length
      });

      setRecentSales(salesListRes.data.slice(0, 10));
    } catch (error) {
      console.error('Dashboard data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="loading-message">Yükleniyor...</div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="dashboard" data-testid="dashboard">
        <div className="welcome-section">
          <h2>Hoş geldiniz, {user.full_name}!</h2>
          <p>Bugünün özeti ve hızlı erişim</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              <DollarSign size={24} color="#2563eb" />
            </div>
            <div className="stat-content">
              <div className="stat-label">Bugünkü Satış</div>
              <div className="stat-value" data-testid="today-sales">{stats.todaySales.toFixed(2)} ₺</div>
              <div className="stat-sub">{stats.todayCount} adet</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>
              <Package size={24} color="#059669" />
            </div>
            <div className="stat-content">
              <div className="stat-label">Toplam Ürün</div>
              <div className="stat-value" data-testid="total-products">{stats.totalProducts}</div>
              <div className="stat-sub">{stats.lowStock} düşük stok</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              <Users size={24} color="#d97706" />
            </div>
            <div className="stat-content">
              <div className="stat-label">Cari Müşteri</div>
              <div className="stat-value" data-testid="total-customers">{stats.totalCustomers}</div>
              <div className="stat-sub">Aktif müşteriler</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e9d5ff' }}>
              <TrendingUp size={24} color="#7c3aed" />
            </div>
            <div className="stat-content">
              <div className="stat-label">Ortalama Satış</div>
              <div className="stat-value">
                {stats.todayCount > 0 ? (stats.todaySales / stats.todayCount).toFixed(2) : '0.00'} ₺
              </div>
              <div className="stat-sub">Fiş başına</div>
            </div>
          </div>
        </div>

        <div className="recent-sales-section">
          <h3>Son Satışlar</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fiş No</th>
                  <th>Ödeme</th>
                  <th>Müşteri</th>
                  <th>Toplam</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      Henüz satış yok
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td><strong>{sale.sale_number}</strong></td>
                      <td>
                        <span className="badge badge-primary">
                          {sale.payment_method === 'cash' ? 'Nakit' : 
                           sale.payment_method === 'card' ? 'Kredi Kartı' :
                           sale.payment_method === 'customer' ? 'Cari' : 'Diğer'}
                        </span>
                      </td>
                      <td>{sale.customer_name || '-'}</td>
                      <td><strong>{sale.total.toFixed(2)} ₺</strong></td>
                      <td>{new Date(sale.created_at).toLocaleString('tr-TR')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 1400px;
        }

        .welcome-section {
          margin-bottom: 2rem;
        }

        .welcome-section h2 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .welcome-section p {
          color: var(--text-secondary);
          font-size: 1.125rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid var(--border);
          display: flex;
          gap: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--shadow);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .stat-sub {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .recent-sales-section h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .loading-message {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .welcome-section h2 {
            font-size: 1.5rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-value {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </Layout>
  );
}

export default Dashboard;
