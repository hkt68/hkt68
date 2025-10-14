import { useState } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { Calendar, Download, TrendingUp } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import * XLSX from 'xlsx';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ReportsPage({ user, onLogout }) {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      if (reportType === 'sales') {
        response = await axios.get(`${API}/reports/sales?start_date=${startDate}T00:00:00&end_date=${endDate}T23:59:59`);
      } else if (reportType === 'products') {
        response = await axios.get(`${API}/reports/products`);
      } else if (reportType === 'profit') {
        response = await axios.get(`${API}/reports/profit?start_date=${startDate}T00:00:00&end_date=${endDate}T23:59:59`);
      }
      setReportData(response.data);
      toast.success('Rapor oluşturuldu');
    } catch (error) {
      toast.error('Rapor oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) {
      toast.error('Önce rapor oluşturun');
      return;
    }

    let data = [];
    let sheetName = '';

    if (reportType === 'sales') {
      sheetName = 'Satış Raporu';
      data = reportData.sales?.map(sale => ({
        'Fiş No': sale.sale_number,
        'Tarih': new Date(sale.created_at).toLocaleString('tr-TR'),
        'Toplam': sale.total.toFixed(2) + ' ₺'
      })) || [];
    } else if (reportType === 'products') {
      sheetName = 'Ürün Raporu';
      data = reportData.low_stock_products?.map(p => ({
        'Ürün': p.name,
        'Barkod': p.barcode,
        'Stok': p.stock,
        'Alış Fiyatı': p.purchase_price.toFixed(2) + ' ₺',
        'Satış Fiyatı': p.sale_price.toFixed(2) + ' ₺'
      })) || [];
    } else if (reportType === 'profit') {
      sheetName = 'Kar-Zarar Raporu';
      data = [{
        'Toplam Gelir': reportData.total_revenue?.toFixed(2) + ' ₺',
        'Toplam Maliyet': reportData.total_cost?.toFixed(2) + ' ₺',
        'Kar': reportData.profit?.toFixed(2) + ' ₺',
        'Kar Marjı': reportData.profit_margin?.toFixed(2) + '%'
      }];
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel dosyası indirildi');
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <Toaster position="top-right" richColors />
      <div className="page-header">
        <h2>Raporlama</h2>
      </div>

      <div className="card">
        <h3><TrendingUp size={20} /> Rapor Oluştur</h3>
        
        <div className="report-controls">
          <div className="input-group">
            <label>Rapor Tipi</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="sales">Satış Raporu</option>
              <option value="products">Ürün Raporu</option>
              <option value="profit">Kar-Zarar Raporu</option>
            </select>
          </div>

          {(reportType === 'sales' || reportType === 'profit') && (
            <>
              <div className="input-group">
                <label>Başlangıç Tarihi</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Bitiş Tarihi</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}

          <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
            <Calendar size={20} />
            {loading ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
          </button>
        </div>
      </div>

      {reportData && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Rapor Sonuçları</h3>
            <button className="btn btn-secondary btn-sm">
              <Download size={16} />
              Excel İndir
            </button>
          </div>

          {reportType === 'sales' && (
            <div>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">Toplam Satış</div>
                  <div className="stat-value">{reportData.total_sales?.toFixed(2) || '0.00'} ₺</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Satış Adedi</div>
                  <div className="stat-value">{reportData.total_count || 0}</div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'products' && (
            <div>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">Toplam Ürün</div>
                  <div className="stat-value">{reportData.total_products || 0}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Stok Değeri</div>
                  <div className="stat-value">{reportData.total_stock_value?.toFixed(2) || '0.00'} ₺</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Düşük Stok</div>
                  <div className="stat-value">{reportData.low_stock_count || 0}</div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'profit' && (
            <div>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">Toplam Gelir</div>
                  <div className="stat-value">{reportData.total_revenue?.toFixed(2) || '0.00'} ₺</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Toplam Maliyet</div>
                  <div className="stat-value">{reportData.total_cost?.toFixed(2) || '0.00'} ₺</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Kar</div>
                  <div className="stat-value" style={{ color: 'var(--secondary)' }}>{reportData.profit?.toFixed(2) || '0.00'} ₺</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Kar Marjı</div>
                  <div className="stat-value">{reportData.profit_margin?.toFixed(2) || '0.00'}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .page-header { margin-bottom: 2rem; }
        .page-header h2 { font-size: 1.875rem; font-weight: 700; color: var(--text-primary); }
        .card h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem; }
        .report-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .stat-box { background: var(--bg-tertiary); padding: 1.5rem; border-radius: 8px; text-align: center; }
        .stat-label { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
        .stat-value { font-size: 1.875rem; font-weight: 700; color: var(--text-primary); }
      `}</style>
    </Layout>
  );
}

export default ReportsPage;
