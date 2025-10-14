import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { Search, Eye, Printer, Download } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import * as XLSX from 'xlsx';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SalesHistoryPage({ user, onLogout }) {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = sales.filter(sale => 
        sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.user.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  }, [searchTerm, sales]);

  const loadSales = async () => {
    try {
      const response = await axios.get(`${API}/sales`);
      setSales(response.data);
      setFilteredSales(response.data);
    } catch (error) {
      toast.error('Satışlar yüklenemedi');
    }
  };

  const handleViewDetail = (sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const printReceipt = (sale) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Fiş - ${sale.sale_number}</title>
          <style>
            body { font-family: monospace; font-size: 12px; width: 280px; margin: 10px auto; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; }
            .right { text-align: right; }
            .total { font-size: 14px; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="center bold">Elite Medya Bilişim</div>
          <div class="center">POS Satış Sistemi</div>
          <div class="line"></div>
          <div class="center bold">FİŞ NO: ${sale.sale_number}</div>
          <div class="line"></div>
          <div>Tarih: ${new Date(sale.created_at).toLocaleString('tr-TR')}</div>
          <div>Kasiyer: ${sale.user}</div>
          ${sale.customer_name ? `<div>Müşteri: ${sale.customer_name}</div>` : ''}
          <div class="line"></div>
          <table>
            <thead>
              <tr>
                <td class="bold">Ürün</td>
                <td class="bold right">Mik.</td>
                <td class="bold right">Fiyat</td>
                <td class="bold right">Tutar</td>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">${item.unit_price.toFixed(2)}</td>
                  <td class="right">${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="line"></div>
          <div class="total">
            <table>
              <tr>
                <td>Ara Toplam:</td>
                <td class="right">${sale.subtotal.toFixed(2)} ₺</td>
              </tr>
              ${sale.discount_rate > 0 ? `
                <tr>
                  <td>İndirim (${sale.discount_rate}%):</td>
                  <td class="right">-${sale.discount_amount.toFixed(2)} ₺</td>
                </tr>
              ` : ''}
              <tr>
                <td class="bold">TOPLAM:</td>
                <td class="right bold">${sale.total.toFixed(2)} ₺</td>
              </tr>
              ${sale.payment_method === 'cash' && sale.cash_received ? `
                <tr>
                  <td>Alınan:</td>
                  <td class="right">${sale.cash_received.toFixed(2)} ₺</td>
                </tr>
                <tr>
                  <td>Para Üstü:</td>
                  <td class="right">${sale.change.toFixed(2)} ₺</td>
                </tr>
              ` : ''}
            </table>
          </div>
          <div class="line"></div>
          <div class="center">Ödeme: ${
            sale.payment_method === 'cash' ? 'Nakit' :
            sale.payment_method === 'card' ? 'Kredi Kartı' :
            sale.payment_method === 'customer' ? 'Cari' : 'Diğer'
          }</div>
          <div class="center">Teşekkür Ederiz!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToExcel = () => {
    const data = filteredSales.map(sale => ({
      'Fiş No': sale.sale_number,
      'Tarih': new Date(sale.created_at).toLocaleString('tr-TR'),
      'Kasiyer': sale.user,
      'Müşteri': sale.customer_name || '-',
      'Ödeme': sale.payment_method === 'cash' ? 'Nakit' : sale.payment_method === 'card' ? 'Kredi Kartı' : sale.payment_method === 'customer' ? 'Cari' : 'Diğer',
      'Toplam': sale.total.toFixed(2) + ' ₺'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Satışlar');
    XLSX.writeFile(wb, `satislar_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel dosyası indirildi');
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <Toaster position="top-right" richColors />
      
      <div className="page-header">
        <h2>Satış Geçmişi</h2>
        <button className="btn btn-success" onClick={exportToExcel}>
          <Download size={20} />
          Excel İndir
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Fiş no, müşteri veya kasiyer ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem' }}
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fiş No</th>
                <th>Tarih</th>
                <th>Kasiyer</th>
                <th>Müşteri</th>
                <th>Ödeme</th>
                <th>Toplam</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    {searchTerm ? 'Sonuç bulunamadı' : 'Henüz satış yok'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td><strong>{sale.sale_number}</strong></td>
                    <td>{new Date(sale.created_at).toLocaleString('tr-TR')}</td>
                    <td>
                      <span className="badge badge-primary">{sale.user}</span>
                    </td>
                    <td>{sale.customer_name || '-'}</td>
                    <td>
                      <span className="badge">
                        {sale.payment_method === 'cash' ? 'Nakit' :
                         sale.payment_method === 'card' ? 'Kredi Kartı' :
                         sale.payment_method === 'customer' ? 'Cari' : 'Diğer'}
                      </span>
                    </td>
                    <td><strong>{sale.total.toFixed(2)} ₺</strong></td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleViewDetail(sale)}
                        style={{ marginRight: '0.5rem' }}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => printReceipt(sale)}
                      >
                        <Printer size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSale && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Satış Detayı - {selectedSale.sale_number}</h3>
              <button onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <strong>Tarih:</strong> {new Date(selectedSale.created_at).toLocaleString('tr-TR')}
                  </div>
                  <div>
                    <strong>Kasiyer:</strong> {selectedSale.user}
                  </div>
                  <div>
                    <strong>Ödeme:</strong> {
                      selectedSale.payment_method === 'cash' ? 'Nakit' :
                      selectedSale.payment_method === 'card' ? 'Kredi Kartı' :
                      selectedSale.payment_method === 'customer' ? 'Cari' : 'Diğer'
                    }
                  </div>
                  {selectedSale.customer_name && (
                    <div>
                      <strong>Müşteri:</strong> {selectedSale.customer_name}
                    </div>
                  )}
                </div>
              </div>

              <h4 style={{ marginBottom: '1rem' }}>Ürünler</h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Ürün</th>
                      <th>Miktar</th>
                      <th>Birim Fiyat</th>
                      <th>Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit_price.toFixed(2)} ₺</td>
                        <td><strong>{item.total.toFixed(2)} ₺</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Ara Toplam:</span>
                  <strong>{selectedSale.subtotal.toFixed(2)} ₺</strong>
                </div>
                {selectedSale.discount_rate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#d97706' }}>
                    <span>İndirim ({selectedSale.discount_rate}%):</span>
                    <strong>-{selectedSale.discount_amount.toFixed(2)} ₺</strong>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', textAlign: 'right' }}>
                <div style={{ fontSize: '1.125rem' }}>Genel Toplam</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{selectedSale.total.toFixed(2)} ₺</div>
                {selectedSale.payment_method === 'cash' && selectedSale.cash_received && (
                  <>
                    <div style={{ marginTop: '0.5rem', opacity: 0.9 }}>Alınan: {selectedSale.cash_received.toFixed(2)} ₺</div>
                    <div style={{ opacity: 0.9 }}>Para Üstü: {selectedSale.change.toFixed(2)} ₺</div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Kapat
              </button>
              <button className="btn btn-primary" onClick={() => printReceipt(selectedSale)}>
                <Printer size={16} />
                Fiş Yazdır
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .page-header h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--bg-secondary);
        }
        .search-bar:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--shadow);
        }
        h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>
    </Layout>
  );
}

export default SalesHistoryPage;
