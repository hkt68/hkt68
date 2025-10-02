import { useState, useEffect } from 'react';
import axios from 'axios';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'resolved'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsResponse, productsResponse] = await Promise.all([
        axios.get('/alerts'),
        axios.get('/products')
      ]);
      setAlerts(alertsResponse.data);
      setProducts(productsResponse.data);
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await axios.put(`/alerts/${alertId}/resolve`);
      await fetchData(); // Refresh alerts
    } catch (err) {
      setError('Uyarı çözülürken hata oluştu');
      console.error('Resolve alert error:', err);
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Bilinmeyen Ürün';
  };

  const getProductStock = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.current_stock : 0;
  };

  const getAlertTypeLabel = (type) => {
    const types = {
      'low_stock': 'Düşük Stok',
      'out_of_stock': 'Stokta Yok',
      'reorder_point': 'Yeniden Sipariş Noktası'
    };
    return types[type] || type;
  };

  const getAlertTypeColor = (type) => {
    const colors = {
      'low_stock': 'text-orange-600 bg-orange-100 border-orange-200',
      'out_of_stock': 'text-red-600 bg-red-100 border-red-200',
      'reorder_point': 'text-yellow-600 bg-yellow-100 border-yellow-200'
    };
    return colors[type] || 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getAlertIcon = (type) => {
    const icons = {
      'low_stock': '⚠️',
      'out_of_stock': '🚨',
      'reorder_point': '🔄'
    };
    return icons[type] || 'ℹ️';
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return !alert.is_resolved;
    if (filter === 'resolved') return alert.is_resolved;
    return true; // 'all'
  });

  const activeAlertsCount = alerts.filter(alert => !alert.is_resolved).length;
  const resolvedAlertsCount = alerts.filter(alert => alert.is_resolved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <span className="mr-3">🚨</span>
          Uyarılar
        </h2>
        <button 
          onClick={fetchData}
          className="btn btn-secondary"
          data-testid="refresh-alerts-btn"
        >
          <span>🔄</span>
          Yenile
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-xl">×</button>
        </div>
      )}

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card card-hover" data-testid="total-alerts-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-number text-blue-600">{alerts.length}</div>
              <div className="stat-label">Toplam Uyarı</div>
            </div>
            <div className="text-3xl text-blue-600">📊</div>
          </div>
        </div>

        <div className="stat-card card-hover" data-testid="active-alerts-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-number text-red-600">{activeAlertsCount}</div>
              <div className="stat-label">Aktif Uyarı</div>
            </div>
            <div className="text-3xl text-red-600">🚨</div>
          </div>
        </div>

        <div className="stat-card card-hover" data-testid="resolved-alerts-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-number text-green-600">{resolvedAlertsCount}</div>
              <div className="stat-label">Çözülen Uyarı</div>
            </div>
            <div className="text-3xl text-green-600">✅</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm" data-testid="alert-filters">
        <div className="flex border-b">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            data-testid="filter-all-alerts"
          >
            Tüm Uyarılar ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              filter === 'active'
                ? 'border-red-600 text-red-600 bg-red-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            data-testid="filter-active-alerts"
          >
            Aktif Uyarılar ({activeAlertsCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              filter === 'resolved'
                ? 'border-green-600 text-green-600 bg-green-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            data-testid="filter-resolved-alerts"
          >
            Çözülen Uyarılar ({resolvedAlertsCount})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4" data-testid="alerts-list">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const productStock = getProductStock(alert.product_id);
            return (
              <div 
                key={alert.id} 
                className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${
                  alert.is_resolved 
                    ? 'border-green-500 bg-green-50' 
                    : getAlertTypeColor(alert.alert_type).includes('border-red') 
                      ? 'border-red-500'
                      : getAlertTypeColor(alert.alert_type).includes('border-orange')
                        ? 'border-orange-500'
                        : 'border-yellow-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getAlertIcon(alert.alert_type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getAlertTypeColor(alert.alert_type)}`}>
                            {getAlertTypeLabel(alert.alert_type)}
                          </span>
                          {alert.is_resolved && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              ✅ Çözülmüş
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-800 mt-1">
                          {getProductName(alert.product_id)}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="text-gray-600 mb-2">
                      {alert.message}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Mevcut Stok:</span>
                        <span className={`ml-2 font-semibold ${
                          productStock === 0 ? 'text-red-600' : productStock <= 5 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {productStock}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Oluşturulma:</span>
                        <span className="ml-2">
                          {new Date(alert.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {alert.resolved_at && (
                        <div>
                          <span className="font-medium text-gray-700">Çözülme:</span>
                          <span className="ml-2">
                            {new Date(alert.resolved_at).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col gap-2">
                    {!alert.is_resolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="btn btn-success btn-sm"
                        data-testid={`resolve-alert-${alert.id}`}
                      >
                        <span>✅</span>
                        Çöz
                      </button>
                    )}
                    <button
                      onClick={() => window.location.href = '/products'}
                      className="btn btn-secondary btn-sm"
                      data-testid={`view-product-${alert.id}`}
                    >
                      <span>👁️</span>
                      Ürünü Gör
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <div className="text-6xl mb-4">
              {filter === 'active' ? '🎉' : filter === 'resolved' ? '✅' : '🚨'}
            </div>
            <div className="text-xl mb-2">
              {filter === 'active' && 'Aktif uyarı bulunmuyor!'}
              {filter === 'resolved' && 'Henüz çözülen uyarı yok'}
              {filter === 'all' && 'Henüz hiç uyarı oluşmamış'}
            </div>
            <div className="text-gray-600">
              {filter === 'active' && 'Tüm ürünleriniz yeterli stok seviyesinde görünüyor.'}
              {filter === 'resolved' && 'Uyarılar çözüldükçe burada görüntülenecektir.'}
              {filter === 'all' && 'Stok seviyeleri minimum eşiğin altına düştüğünde burada uyarılar görüntülenecektir.'}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions for Active Alerts */}
      {activeAlertsCount > 0 && filter !== 'resolved' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-orange-500">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Hızlı İşlemler
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => window.location.href = '/stock'}
              className="btn btn-primary"
              data-testid="quick-stock-in-btn"
            >
              <span>📦</span>
              Stok Girişi Yap
            </button>
            <button 
              onClick={() => window.location.href = '/products'}
              className="btn btn-secondary"
              data-testid="quick-products-btn"
            >
              <span>✏️</span>
              Ürünleri Düzenle
            </button>
            <button 
              onClick={() => {
                const unresolvedAlerts = alerts.filter(a => !a.is_resolved);
                unresolvedAlerts.forEach(alert => resolveAlert(alert.id));
              }}
              className="btn btn-success"
              disabled={activeAlertsCount === 0}
              data-testid="resolve-all-alerts-btn"
            >
              <span>✅</span>
              Tümünü Çöz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;