import { useState, useEffect } from 'react';
import axios from 'axios';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [accountSummary, setAccountSummary] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [detailedReport, setDetailedReport] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'cash',
    reference_no: '',
    notes: ''
  });
  const [creditData, setCreditData] = useState({
    amount: '',
    due_date: '',
    notes: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    credit_limit: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    active_only: true
  });

  useEffect(() => {
    fetchCustomers();
  }, [filters]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.active_only) params.append('active_only', 'true');
      
      const response = await axios.get(`/customers?${params}`);
      setCustomers(response.data);
    } catch (err) {
      setError('Müşteriler yüklenirken hata oluştu');
      console.error('Customers fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      
      const submitData = {
        ...formData,
        credit_limit: parseFloat(formData.credit_limit) || 0
      };
      
      if (editingCustomer) {
        await axios.put(`/customers/${editingCustomer.id}`, submitData);
      } else {
        await axios.post('/customers', submitData);
      }
      
      await fetchCustomers();
      resetForm();
    } catch (err) {
      setError(editingCustomer ? 'Müşteri güncellenirken hata oluştu' : 'Müşteri eklenirken hata oluştu');
      console.error('Customer submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      tax_number: customer.tax_number || '',
      credit_limit: customer.credit_limit.toString(),
      notes: customer.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`/customers/${customerId}`);
      await fetchCustomers();
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Bu müşterinin veresiye borcu olduğu için silinemez');
      } else {
        setError('Müşteri silinirken hata oluştu');
      }
      console.error('Delete customer error:', err);
    }
  };

  const showAccountDetails = async (customer) => {
    try {
      setSelectedCustomer(customer);
      
      // Fetch account summary and purchase history
      const [summaryResponse, historyResponse, reportResponse] = await Promise.all([
        axios.get(`/customers/${customer.id}/account-summary`),
        axios.get(`/customers/${customer.id}/purchase-history`),
        axios.get(`/customers/${customer.id}/detailed-report`)
      ]);
      
      setAccountSummary(summaryResponse.data);
      setPurchaseHistory(historyResponse.data);
      setDetailedReport(reportResponse.data);
      setShowAccountModal(true);
    } catch (err) {
      setError('Hesap bilgileri yüklenirken hata oluştu');
      console.error('Account details error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      tax_number: '',
      credit_limit: '',
      notes: ''
    });
    setEditingCustomer(null);
    setShowForm(false);
    setError(null);
  };

  const getDebtStatus = (customer) => {
    // This would need to be calculated from account summary
    // For now, return a placeholder
    return { debt: 0, status: 'clear' };
  };

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
          <span className="mr-3">👥</span>
          Cari Hesaplar
        </h2>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          data-testid="add-customer-btn"
        >
          <span>➕</span>
          Yeni Müşteri
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-xl">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm" data-testid="customer-filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Müşteri Ara</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ad, telefon veya e-posta..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              data-testid="search-customers-input"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={filters.active_only}
                onChange={(e) => setFilters({ ...filters, active_only: e.target.checked })}
                data-testid="active-customers-checkbox"
              />
              <span className="text-sm">Sadece Aktif Müşteriler</span>
            </label>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => setFilters({ search: '', active_only: true })}
              className="btn btn-secondary w-full"
              data-testid="clear-customer-filters-btn"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal-content p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Müşteri Adı *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ahmet Yılmaz"
                    required
                    data-testid="customer-name-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0555 123 45 67"
                    data-testid="customer-phone-input"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">E-posta</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ahmet@example.com"
                    data-testid="customer-email-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Vergi Numarası</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="1234567890"
                    data-testid="customer-tax-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Adres</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="İstanbul/Kadıköy..."
                  data-testid="customer-address-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Kredi Limiti (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  placeholder="0.00"
                  data-testid="customer-credit-limit-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Notlar</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Müşteri hakkında notlar..."
                  data-testid="customer-notes-input"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={submitting || !formData.name.trim()}
                  data-testid="save-customer-btn"
                >
                  {submitting ? (
                    <><div className="spinner"></div> Kaydediliyor...</>
                  ) : (
                    <><span>💾</span> {editingCustomer ? 'Güncelle' : 'Kaydet'}</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                  data-testid="cancel-customer-btn"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Details Modal */}
      {showAccountModal && selectedCustomer && accountSummary && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAccountModal(false)}>
          <div className="modal-content p-6 w-full max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <span className="mr-2">🏦</span>
                Cari Hesap Özeti - {selectedCustomer.name}
              </h3>
              <button 
                onClick={() => setShowAccountModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Account Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="stat-card">
                <div className="stat-number text-red-600">
                  ₺{accountSummary.total_debt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
                <div className="stat-label">Toplam Borç</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-number text-orange-600">
                  ₺{accountSummary.overdue_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
                <div className="stat-label">Vadesi Geçen</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-number text-blue-600">
                  ₺{accountSummary.credit_limit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
                <div className="stat-label">Kredi Limiti</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-number text-green-600">
                  ₺{accountSummary.available_credit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
                <div className="stat-label">Kullanılabilir Kredi</div>
              </div>
            </div>
            
            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <span className="mr-2">💳</span>
                  Son Ödemeler
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {accountSummary.recent_payments.length > 0 ? (
                    accountSummary.recent_payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <div>
                          <div className="font-medium text-green-600">
                            +₺{payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(payment.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{payment.payment_method}</div>
                          {payment.notes && (
                            <div className="text-xs text-gray-500">{payment.notes}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">Henüz ödeme yok</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <span className="mr-2">📝</span>
                  Son Veresiye Satışlar
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {accountSummary.recent_credit_sales.length > 0 ? (
                    accountSummary.recent_credit_sales.map((creditSale) => (
                      <div key={creditSale.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <div>
                          <div className="font-medium text-red-600">
                            -₺{creditSale.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(creditSale.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm px-2 py-1 rounded ${
                            creditSale.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            creditSale.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            creditSale.payment_status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {creditSale.payment_status === 'paid' ? 'Ödendi' :
                             creditSale.payment_status === 'partial' ? 'Kısmi' :
                             creditSale.payment_status === 'overdue' ? 'Vadesi Geçti' :
                             'Ödenmedi'}
                          </div>
                          {creditSale.remaining_amount > 0 && (
                            <div className="text-xs text-gray-500">
                              Kalan: ₺{creditSale.remaining_amount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">Henüz veresiye satış yok</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="table-container" data-testid="customers-table">
        <div className="table-header p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Müşteri Listesi ({customers.length})</h3>
            <button 
              onClick={fetchCustomers}
              className="btn btn-secondary btn-sm"
              data-testid="refresh-customers-btn"
            >
              🔄 Yenile
            </button>
          </div>
        </div>
        
        {customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-3">Müşteri</th>
                  <th className="text-left p-3">İletişim</th>
                  <th className="text-left p-3">Kredi Durumu</th>
                  <th className="text-left p-3">Kayıt Tarihi</th>
                  <th className="text-center p-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const debtStatus = getDebtStatus(customer);
                  return (
                    <tr key={customer.id} className="table-row">
                      <td className="p-3">
                        <div>
                          <div className="font-semibold text-gray-800">{customer.name}</div>
                          {customer.tax_number && (
                            <div className="text-xs text-gray-500">VN: {customer.tax_number}</div>
                          )}
                          {customer.notes && (
                            <div className="text-xs text-gray-500 max-w-xs truncate" title={customer.notes}>
                              {customer.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {customer.phone && <div>📞 {customer.phone}</div>}
                          {customer.email && <div>📧 {customer.email}</div>}
                          {customer.address && (
                            <div className="text-xs text-gray-500 max-w-xs truncate" title={customer.address}>
                              📍 {customer.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div>Limit: ₺{customer.credit_limit.toLocaleString('tr-TR')}</div>
                          <div className={`font-medium ${
                            debtStatus.status === 'clear' ? 'text-green-600' : 
                            debtStatus.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {debtStatus.status === 'clear' ? '✅ Temiz' : 
                             `💰 ₺${debtStatus.debt.toLocaleString('tr-TR')}`}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-500">
                          {new Date(customer.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => showAccountDetails(customer)}
                            className="btn btn-primary btn-sm"
                            data-testid={`view-account-${customer.id}`}
                          >
                            <span>🏦</span>
                            Hesap
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="btn btn-warning btn-sm"
                            data-testid={`edit-customer-${customer.id}`}
                          >
                            <span>✏️</span>
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="btn btn-danger btn-sm"
                            data-testid={`delete-customer-${customer.id}`}
                          >
                            <span>🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">👥</div>
            <div className="text-xl mb-2">
              {filters.search ? 'Arama kriterlerinize uygun müşteri bulunamadı' : 'Henüz müşteri eklenmemiş'}
            </div>
            {!filters.search && (
              <>
                <div className="mb-4">Cari hesap takibi için müşterilerinizi ekleyin.</div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary"
                >
                  İlk Müşteriyi Ekle
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;