import { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/dashboard/summary');
      setDashboardData(response.data);
    } catch (err) {
      setError('Dashboard verileri yüklenirken hata oluştu');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
        <button 
          onClick={fetchDashboardData}
          className="btn btn-primary ml-4"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">📊 Dashboard</h2>
        <button 
          onClick={fetchDashboardData}
          className="btn btn-secondary"
          data-testid="refresh-dashboard-btn"
        >
          🔄 Yenile
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card card-hover" data-testid="total-products-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-number text-blue-600">{dashboardData?.total_products || 0}</div>
              <div className="stat-label">Toplam Ürün</div>
            </div>
            <div className="text-3xl text-blue-600">📦</div>
          </div>
        </div>

        <div className="stat-card card-hover" data-testid="total-categories-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-number text-green-600">{dashboardData?.total_categories || 0}</div>
              <div className="stat-label">Kategori</div>
            </div>
            <div className="text-3xl text-green-600">🏷️</div>
          </div>
        </div>

        <div className="stat-card card-hover" data-testid="today-sales-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-number text-purple-600">{dashboardData?.today_sales_count || 0}</div>
              <div className="stat-label">Bugünkü Satış</div>
            </div>
            <div className="text-3xl text-purple-600">💰</div>
          </div>
        </div>

        <div className="stat-card card-hover" data-testid="today-revenue-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-number text-yellow-600">
                {dashboardData?.today_revenue ? `₺${dashboardData.today_revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '₺0.00'}
              </div>
              <div className="stat-label">Bugünkü Ciro</div>
            </div>
            <div className="text-3xl text-yellow-600">💵</div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {dashboardData?.active_alerts > 0 && (
        <div className="alert alert-warning" data-testid="active-alerts">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🚨</span>
              <div>
                <strong>{dashboardData.active_alerts} aktif uyarı</strong> bulunuyor.
                <div className="text-sm">Düşük stok uyarıları kontrol edilmelidir.</div>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/alerts'}
              className="btn btn-warning"
            >
              Uyarıları Gör
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <div className="table-container" data-testid="low-stock-products">
          <div className="table-header p-4">
            <h3 className="text-lg font-semibold flex items-center">
              <span className="mr-2">⚠️</span>
              Düşük Stok Ürünleri ({dashboardData?.low_stock_count || 0})
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {dashboardData?.low_stock_products?.length > 0 ? (
              <table className="w-full">
                <thead className="table-header sticky top-0">
                  <tr>
                    <th className="text-left p-3">Ürün</th>
                    <th className="text-left p-3">Mevcut Stok</th>
                    <th className="text-left p-3">Min. Seviye</th>
                    <th className="text-left p-3">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.low_stock_products.map((product) => (
                    <tr key={product.id} className="table-row">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.sku && <div className="text-sm text-gray-500">SKU: {product.sku}</div>}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`font-semibold ${
                          product.current_stock === 0 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {product.current_stock}
                        </span>
                      </td>
                      <td className="p-3">{product.min_stock_level}</td>
                      <td className="p-3">
                        <span className={`status-dot ${
                          product.current_stock === 0 ? 'status-out' : 'status-low'
                        }`}></span>
                        {product.current_stock === 0 ? 'Stokta Yok' : 'Düşük Stok'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <div className="text-4xl mb-2">🎉</div>
                <div>Tüm ürünleriniz yeterli stok seviyesinde!</div>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="table-container" data-testid="top-selling-products">
          <div className="table-header p-4">
            <h3 className="text-lg font-semibold flex items-center">
              <span className="mr-2">🏆</span>
              En Çok Satan Ürünler (Son 30 Gün)
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {dashboardData?.top_selling_products?.length > 0 ? (
              <table className="w-full">
                <thead className="table-header sticky top-0">
                  <tr>
                    <th className="text-left p-3">Ürün</th>
                    <th className="text-left p-3">Satılan Adet</th>
                    <th className="text-left p-3">Toplam Ciro</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.top_selling_products.map((product, index) => (
                    <tr key={index} className="table-row">
                      <td className="p-3">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                          </span>
                          <span className="font-medium">{product.product_name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-blue-600">{product.total_quantity}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-green-600">
                          ₺{product.total_revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <div className="text-4xl mb-2">📈</div>
                <div>Henüz satış verisi bulunmuyor.</div>
                <div className="text-sm mt-1">İlk satışınızı yaptıktan sonra burada görüntülenecektir.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">⚡</span>
          Hızlı İşlemler
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => window.location.href = '/products'}
            className="btn btn-primary"
            data-testid="add-product-btn"
          >
            <span>📦</span>
            Yeni Ürün Ekle
          </button>
          <button 
            onClick={() => window.location.href = '/sales'}
            className="btn btn-success"
            data-testid="make-sale-btn"
          >
            <span>💰</span>
            Satış Yap
          </button>
          <button 
            onClick={() => window.location.href = '/stock'}
            className="btn btn-warning"
            data-testid="stock-transaction-btn"
          >
            <span>📋</span>
            Stok İşlemi
          </button>
          <button 
            onClick={() => window.location.href = '/reports'}
            className="btn btn-secondary"
            data-testid="view-reports-btn"
          >
            <span>📈</span>
            Raporlar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;