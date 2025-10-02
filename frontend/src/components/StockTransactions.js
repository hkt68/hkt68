import { useState, useEffect } from 'react';
import axios from 'axios';

const StockTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    transaction_type: 'stock_in',
    quantity: '',
    unit_price: '',
    reference_no: '',
    notes: '',
    created_by: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    product_id: '',
    transaction_type: ''
  });
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsResponse, productsResponse] = await Promise.all([
        axios.get('/stock/transactions'),
        axios.get('/products')
      ]);
      setTransactions(transactionsResponse.data);
      setProducts(productsResponse.data);
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.product_id) params.append('product_id', filters.product_id);
      if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
      
      const response = await axios.get(`/stock/transactions?${params}`);
      setTransactions(response.data);
    } catch (err) {
      console.error('Transactions fetch error:', err);
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    setFormData({
      ...formData,
      product_id: productId,
      unit_price: product ? product.cost_price.toString() : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.quantity) return;

    const quantity = parseInt(formData.quantity);

    // Check for stock out operations
    if (formData.transaction_type === 'stock_out' && selectedProduct) {
      if (selectedProduct.current_stock < quantity) {
        setError(`Yetersiz stok! Mevcut stok: ${selectedProduct.current_stock}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        ...formData,
        quantity,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null
      };
      
      await axios.post('/stock/transactions', submitData);
      await fetchData(); // Refresh both transactions and products (for updated stock)
      resetForm();
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Stok işlemi kaydedilirken hata oluştu');
      }
      console.error('Transaction submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      transaction_type: 'stock_in',
      quantity: '',
      unit_price: '',
      reference_no: '',
      notes: '',
      created_by: ''
    });
    setSelectedProduct(null);
    setShowForm(false);
    setError(null);
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Bilinmeyen Ürün';
  };

  const getTransactionTypeLabel = (type) => {
    const types = {
      'stock_in': 'Stok Girişi',
      'stock_out': 'Stok Çıkışı',
      'sale': 'Satış',
      'adjustment': 'Düzeltme',
      'return': 'İade'
    };
    return types[type] || type;
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      'stock_in': 'text-green-600 bg-green-100',
      'stock_out': 'text-red-600 bg-red-100',
      'sale': 'text-blue-600 bg-blue-100',
      'adjustment': 'text-yellow-600 bg-yellow-100',
      'return': 'text-purple-600 bg-purple-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
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
          <span className="mr-3">📋</span>
          Stok İşlemleri
        </h2>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          data-testid="new-stock-transaction-btn"
        >
          <span>➕</span>
          Yeni İşlem
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-xl">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm" data-testid="stock-filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Ürün</label>
            <select
              className="form-select"
              value={filters.product_id}
              onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}
              data-testid="filter-product-select"
            >
              <option value="">Tüm Ürünler</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">İşlem Tipi</label>
            <select
              className="form-select"
              value={filters.transaction_type}
              onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
              data-testid="filter-transaction-type-select"
            >
              <option value="">Tüm İşlemler</option>
              <option value="stock_in">Stok Girişi</option>
              <option value="stock_out">Stok Çıkışı</option>
              <option value="sale">Satış</option>
              <option value="adjustment">Düzeltme</option>
              <option value="return">İade</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => setFilters({ product_id: '', transaction_type: '' })}
              className="btn btn-secondary w-full"
              data-testid="clear-stock-filters-btn"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal-content p-6 w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Yeni Stok İşlemi</h3>
              <button 
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Ürün *</label>
                <select
                  className="form-select"
                  value={formData.product_id}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  required
                  data-testid="transaction-product-select"
                >
                  <option value="">Ürün Seçin</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Mevcut: {product.current_stock})
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div><strong>Mevcut Stok:</strong> {selectedProduct.current_stock}</div>
                    <div><strong>Maliyet Fiyatı:</strong> ₺{selectedProduct.cost_price}</div>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label className="form-label">İşlem Tipi *</label>
                <select
                  className="form-select"
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                  data-testid="transaction-type-select"
                >
                  <option value="stock_in">Stok Girişi</option>
                  <option value="stock_out">Stok Çıkışı</option>
                  <option value="adjustment">Stok Düzeltme</option>
                  <option value="return">İade</option>
                </select>
                <div className="text-sm text-gray-500 mt-1">
                  {formData.transaction_type === 'stock_in' && 'Stok seviyesini artırır'}
                  {formData.transaction_type === 'stock_out' && 'Stok seviyesini azaltır'}
                  {formData.transaction_type === 'adjustment' && 'Stok düzeltmesi yapar'}
                  {formData.transaction_type === 'return' && 'İade işlemi - stok artırır'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Miktar *</label>
                  <input
                    type="number"
                    min="1"
                    max={formData.transaction_type === 'stock_out' && selectedProduct 
                         ? selectedProduct.current_stock 
                         : undefined}
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1"
                    required
                    data-testid="transaction-quantity-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Birim Fiyat (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="0.00"
                    data-testid="transaction-unit-price-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Referans No</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  placeholder="Fatura no, evrak no, vb."
                  data-testid="transaction-reference-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Sorumlu Kişi</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.created_by}
                  onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                  placeholder="İşlemi yapan kişi..."
                  data-testid="transaction-created-by-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Notlar</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="İşlem ile ilgili açıklamalar..."
                  data-testid="transaction-notes-input"
                />
              </div>
              
              {formData.quantity && formData.unit_price && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-lg font-semibold text-blue-800">
                    Toplam Tutar: ₺{(parseFloat(formData.quantity || 0) * parseFloat(formData.unit_price || 0)).toFixed(2)}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={submitting || !formData.product_id || !formData.quantity}
                  data-testid="save-transaction-btn"
                >
                  {submitting ? (
                    <><div className="spinner"></div> Kaydediliyor...</>
                  ) : (
                    <><span>💾</span> İşlemi Kaydet</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                  data-testid="cancel-transaction-btn"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="table-container" data-testid="transactions-table">
        <div className="table-header p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Stok İşlem Listesi ({transactions.length})</h3>
            <button 
              onClick={fetchTransactions}
              className="btn btn-secondary btn-sm"
              data-testid="refresh-transactions-btn"
            >
              🔄 Yenile
            </button>
          </div>
        </div>
        
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-3">Tarih</th>
                  <th className="text-left p-3">Ürün</th>
                  <th className="text-left p-3">İşlem Tipi</th>
                  <th className="text-center p-3">Miktar</th>
                  <th className="text-left p-3">Birim Fiyat</th>
                  <th className="text-left p-3">Toplam</th>
                  <th className="text-left p-3">Referans</th>
                  <th className="text-left p-3">Sorumlu</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="table-row">
                    <td className="p-3">
                      <div className="text-sm">
                        {new Date(transaction.created_at).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleTimeString('tr-TR')}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{getProductName(transaction.product_id)}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-semibold ${
                        ['stock_in', 'return'].includes(transaction.transaction_type) 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {['stock_in', 'return'].includes(transaction.transaction_type) ? '+' : '-'}{transaction.quantity}
                      </span>
                    </td>
                    <td className="p-3">
                      {transaction.unit_price ? (
                        <span className="font-medium">₺{transaction.unit_price.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {transaction.total_amount ? (
                        <span className="font-bold text-blue-600">
                          ₺{transaction.total_amount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        {transaction.reference_no || '-'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{transaction.created_by || '-'}</div>
                        {transaction.notes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={transaction.notes}>
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">📋</div>
            <div className="text-xl mb-2">
              {filters.product_id || filters.transaction_type
                ? 'Arama kriterlerinize uygun işlem bulunamadı' 
                : 'Henüz stok işlemi yapılmamış'
              }
            </div>
            {!filters.product_id && !filters.transaction_type && (
              <>
                <div className="mb-4">Stok giriş/çıkış işlemlerini buradan takip edebilirsiniz.</div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary"
                >
                  İlk İşlemi Yap
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTransactions;