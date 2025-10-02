import { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = () => {
  const [salesReport, setSalesReport] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportFilters, setReportFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0], // today
    group_by: 'day'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/dashboard/summary');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Dashboard data error:', err);
    }
  };

  const fetchSalesReport = async () => {
    if (!reportFilters.start_date || !reportFilters.end_date) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('start_date', reportFilters.start_date);
      params.append('end_date', reportFilters.end_date);
      params.append('group_by', reportFilters.group_by);
      
      const response = await axios.get(`/reports/sales?${params}`);
      setSalesReport(response.data);
    } catch (err) {
      setError('Rapor yüklenirken hata oluştu');
      console.error('Sales report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalReportRevenue = () => {
    if (!salesReport?.data) return 0;
    return salesReport.data.reduce((total, item) => total + item.total_revenue, 0);
  };

  const getTotalReportSales = () => {
    if (!salesReport?.data) return 0;
    return salesReport.data.reduce((total, item) => total + item.total_sales, 0);
  };

  const getTotalReportTransactions = () => {
    if (!salesReport?.data) return 0;
    return salesReport.data.reduce((total, item) => total + item.sales_count, 0);
  };

  const exportToCSV = () => {
    if (!salesReport?.data) return;

    const headers = ['Tarih', 'Toplam Satış Adedi', 'Toplam Ciro', 'İşlem Sayısı'];
    const csvContent = [
      headers.join(','),
      ...salesReport.data.map(item => [
        item._id,
        item.total_sales,
        item.total_revenue.toFixed(2),
        item.sales_count
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `satis_raporu_${reportFilters.start_date}_${reportFilters.end_date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <span className="mr-3">📈</span>
          Raporlar
        </h2>
        <div className="flex gap-2 no-print">
          <button 
            onClick={exportToCSV}
            className="btn btn-success"
            disabled={!salesReport?.data}
            data-testid="export-csv-btn"
          >
            <span>📄</span>
            CSV İndir
          </button>
          <button 
            onClick={printReport}
            className="btn btn-secondary"
            data-testid="print-report-btn"
          >
            <span>🖨️</span>
            Yazdır
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error no-print">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-xl">×</button>
        </div>
      )}

      {/* Report Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm no-print" data-testid="report-filters">
        <h3 className="text-lg font-semibold mb-4">Satış Raporu Filtreleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Başlangıç Tarihi</label>
            <input
              type="date"
              className="form-input"
              value={reportFilters.start_date}
              onChange={(e) => setReportFilters({ ...reportFilters, start_date: e.target.value })}
              data-testid="report-start-date"
            />
          </div>
          <div>
            <label className="form-label">Bitiş Tarihi</label>
            <input
              type="date"
              className="form-input"
              value={reportFilters.end_date}
              onChange={(e) => setReportFilters({ ...reportFilters, end_date: e.target.value })}
              data-testid="report-end-date"
            />
          </div>
          <div>
            <label className="form-label">Gruplama</label>
            <select
              className="form-select"
              value={reportFilters.group_by}
              onChange={(e) => setReportFilters({ ...reportFilters, group_by: e.target.value })}
              data-testid="report-group-by"
            >
              <option value="day">Günlük</option>
              <option value="week">Haftalık</option>
              <option value="month">Aylık</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={fetchSalesReport}
              className="btn btn-primary w-full"
              disabled={loading || !reportFilters.start_date || !reportFilters.end_date}
              data-testid="generate-report-btn"
            >
              {loading ? (
                <><div className="spinner"></div> Yükleniyor...</>
              ) : (
                <><span>📈</span> Rapor Oluştur</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* General Statistics */}
      {dashboardData && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Genel İstatistikler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card" data-testid="general-products-stat">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-number text-blue-600">{dashboardData.total_products}</div>
                  <div className="stat-label">Toplam Ürün</div>
                </div>
                <div className="text-2xl text-blue-600">📦</div>
              </div>
            </div>

            <div className="stat-card" data-testid="general-categories-stat">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-number text-green-600">{dashboardData.total_categories}</div>
                  <div className="stat-label">Kategori Sayısı</div>
                </div>
                <div className="text-2xl text-green-600">🏷️</div>
              </div>
            </div>

            <div className="stat-card" data-testid="general-low-stock-stat">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-number text-orange-600">{dashboardData.low_stock_count}</div>
                  <div className="stat-label">Düşük Stok Ürün</div>
                </div>
                <div className="text-2xl text-orange-600">⚠️</div>
              </div>
            </div>

            <div className="stat-card" data-testid="general-alerts-stat">
              <div className="flex items-center justify-between">
                <div>
                  <div className="stat-number text-red-600">{dashboardData.active_alerts}</div>
                  <div className="stat-label">Aktif Uyarı</div>
                </div>
                <div className="text-2xl text-red-600">🚨</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Report Results */}
      {salesReport && (
        <div className="space-y-4">
          {/* Report Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">📅</span>
              Satış Raporu Özeti
              <span className="ml-2 text-sm text-gray-500">
                ({new Date(reportFilters.start_date).toLocaleDateString('tr-TR')} - {new Date(reportFilters.end_date).toLocaleDateString('tr-TR')})
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat-card" data-testid="report-total-revenue">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="stat-number text-green-600">
                      ₺{getTotalReportRevenue().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="stat-label">Toplam Ciro</div>
                  </div>
                  <div className="text-2xl text-green-600">💵</div>
                </div>
              </div>

              <div className="stat-card" data-testid="report-total-sales">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="stat-number text-blue-600">{getTotalReportSales()}</div>
                    <div className="stat-label">Satılan Toplam Adet</div>
                  </div>
                  <div className="text-2xl text-blue-600">📦</div>
                </div>
              </div>

              <div className="stat-card" data-testid="report-total-transactions">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="stat-number text-purple-600">{getTotalReportTransactions()}</div>
                    <div className="stat-label">Toplam İşlem</div>
                  </div>
                  <div className="text-2xl text-purple-600">📄</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Report Table */}
          <div className="table-container" data-testid="sales-report-table">
            <div className="table-header p-4">
              <h3 className="text-lg font-semibold">
                Detaylı Satış Raporu ({reportFilters.group_by === 'day' ? 'Günlük' : reportFilters.group_by === 'week' ? 'Haftalık' : 'Aylık'})
              </h3>
            </div>
            
            {salesReport.data && salesReport.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="text-left p-3">Tarih/Periyot</th>
                      <th className="text-center p-3">Satılan Adet</th>
                      <th className="text-center p-3">İşlem Sayısı</th>
                      <th className="text-right p-3">Toplam Ciro</th>
                      <th className="text-right p-3">Ortalama İşlem Tutarı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport.data.map((item, index) => {
                      const avgTransaction = item.sales_count > 0 ? item.total_revenue / item.sales_count : 0;
                      return (
                        <tr key={index} className="table-row">
                          <td className="p-3">
                            <div className="font-medium">{item._id}</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-semibold text-blue-600">{item.total_sales}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-semibold text-purple-600">{item.sales_count}</span>
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-green-600">
                              ₺{item.total_revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-medium text-gray-600">
                              ₺{avgTransaction.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="table-header">
                    <tr>
                      <th className="p-3 text-left font-bold">TOPLAM</th>
                      <th className="p-3 text-center font-bold text-blue-600">{getTotalReportSales()}</th>
                      <th className="p-3 text-center font-bold text-purple-600">{getTotalReportTransactions()}</th>
                      <th className="p-3 text-right font-bold text-green-600">
                        ₺{getTotalReportRevenue().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </th>
                      <th className="p-3 text-right font-bold text-gray-600">
                        ₺{(getTotalReportTransactions() > 0 ? getTotalReportRevenue() / getTotalReportTransactions() : 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">📈</div>
                <div className="text-xl mb-2">Seçilen tarih aralığında satış bulunamadı</div>
                <div className="text-sm">Farklı bir tarih aralığı seçmeyi deneyin.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Selling Products */}
      {dashboardData?.top_selling_products?.length > 0 && (
        <div className="table-container">
          <div className="table-header p-4">
            <h3 className="text-lg font-semibold flex items-center">
              <span className="mr-2">🏆</span>
              En Çok Satan Ürünler (Son 30 Gün)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-3">Sıra</th>
                  <th className="text-left p-3">Ürün Adı</th>
                  <th className="text-center p-3">Satılan Adet</th>
                  <th className="text-right p-3">Toplam Ciro</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.top_selling_products.map((product, index) => (
                  <tr key={index} className="table-row">
                    <td className="p-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{product.product_name}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-semibold text-blue-600">{product.total_quantity}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-green-600">
                        ₺{product.total_revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!salesReport && (
        <div className="bg-white rounded-lg p-8 shadow-sm text-center">
          <div className="text-6xl mb-4">📈</div>
          <div className="text-xl mb-2">Rapor Oluşturun</div>
          <div className="text-gray-600 mb-4">
            Satış performansınızı analiz etmek için yukarıdaki filtrelerden tarih aralığı seçin ve "Rapor Oluştur" butonuna tıklayın.
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;