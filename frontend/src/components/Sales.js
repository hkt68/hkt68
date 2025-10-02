import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // POS System State
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cash',
    received_amount: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    product_id: '',
    start_date: '',
    end_date: ''
  });
  
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesResponse, productsResponse] = await Promise.all([
        axios.get('/sales'),
        axios.get('/products')
      ]);
      setSales(salesResponse.data);
      setProducts(productsResponse.data);
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.product_id) params.append('product_id', filters.product_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await axios.get(`/sales?${params}`);
      setSales(response.data);
    } catch (err) {
      console.error('Sales fetch error:', err);
    }
  };

  // POS System Functions
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const product = products.find(p => 
      p.barcode === barcodeInput.trim() || 
      p.sku === barcodeInput.trim() ||
      p.name.toLowerCase().includes(barcodeInput.toLowerCase())
    );
    
    if (product) {
      addToCart(product);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    } else {
      setError('Barkod/SKU bulunamadı: ' + barcodeInput);
      setBarcodeInput('');
    }
  };

  const addToCart = (product, quantity = 1) => {
    if (product.current_stock < quantity) {
      setError(`Yetersiz stok! Mevcut: ${product.current_stock}`);
      return;
    }

    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.current_stock < newQuantity) {
        setError(`Yetersiz stok! Maksimum: ${product.current_stock}`);
        return;
      }
      
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unit_price }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity,
        unit_price: product.selling_price,
        subtotal: quantity * product.selling_price
      }]);
    }
    setError(null);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product.current_stock < newQuantity) {
      setError(`Yetersiz stok! Maksimum: ${product.current_stock}`);
      return;
    }

    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unit_price }
        : item
    ));
  };

  const updateCartItemPrice = (productId, newPrice) => {
    const price = parseFloat(newPrice) || 0;
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, unit_price: price, subtotal: item.quantity * price }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getChangeAmount = () => {
    const receivedAmount = parseFloat(paymentInfo.received_amount) || 0;
    return receivedAmount - getCartTotal();
  };

  const clearCart = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '' });
    setPaymentInfo({ method: 'cash', received_amount: '', notes: '' });
    setError(null);
    barcodeInputRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.quantity || !formData.unit_price) return;

    const quantity = parseInt(formData.quantity);
    const unit_price = parseFloat(formData.unit_price);

    // Check if there's enough stock
    if (selectedProduct && selectedProduct.current_stock < quantity) {
      setError(`Yetersiz stok! Mevcut stok: ${selectedProduct.current_stock}`);
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData = {
        ...formData,
        quantity,
        unit_price
      };
      
      await axios.post('/sales', submitData);
      await fetchData(); // Refresh both sales and products (for updated stock)
      resetForm();
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Satış kaydedilirken hata oluştu');
      }
      console.error('Sale submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      quantity: '',
      unit_price: '',
      customer_name: '',
      customer_phone: '',
      payment_method: 'cash',
      notes: ''
    });
    setSelectedProduct(null);
    setShowForm(false);
    setError(null);
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Bilinmeyen Ürün';
  };

  const getTotalRevenue = () => {
    return sales.reduce((total, sale) => total + sale.total_amount, 0);
  };

  const getTotalQuantity = () => {
    return sales.reduce((total, sale) => total + sale.quantity, 0);
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
          <span className="mr-3">💰</span>
          Satışlar
        </h2>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-success"
          data-testid="new-sale-btn"
        >
          <span>➕</span>
          Yeni Satış
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-xl">×</button>
        </div>
      )}

      {/* Sales Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card card-hover" data-testid="total-sales-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-number text-blue-600">{sales.length}</div>
              <div className="stat-label">Toplam Satış</div>
            </div>
            <div className="text-3xl text-blue-600">📄</div>
          </div>
        </div>

        <div className="stat-card card-hover" data-testid="total-quantity-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-number text-purple-600">{getTotalQuantity()}</div>
              <div className="stat-label">Toplam Adet</div>
            </div>
            <div className="text-3xl text-purple-600">📦</div>
          </div>
        </div>

        <div className="stat-card card-hover" data-testid="total-revenue-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="stat-number text-green-600">
                ₺{getTotalRevenue().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </div>
              <div className="stat-label">Toplam Ciro</div>
            </div>
            <div className="text-3xl text-green-600">💵</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm" data-testid="sales-filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="form-label">Başlangıç Tarihi</label>
            <input
              type="date"
              className="form-input"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              data-testid="filter-start-date"
            />
          </div>
          <div>
            <label className="form-label">Bitiş Tarihi</label>
            <input
              type="date"
              className="form-input"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              data-testid="filter-end-date"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => setFilters({ product_id: '', start_date: '', end_date: '' })}
              className="btn btn-secondary w-full"
              data-testid="clear-sales-filters-btn"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Sale Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal-content p-6 w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Yeni Satış Kaydı</h3>
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
                  data-testid="sale-product-select"
                >
                  <option value="">Ürün Seçin</option>
                  {products.filter(p => p.current_stock > 0).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stok: {product.current_stock})
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <div><strong>Mevcut Stok:</strong> {selectedProduct.current_stock}</div>
                    <div><strong>Önerilen Fiyat:</strong> ₺{selectedProduct.selling_price}</div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Miktar *</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct ? selectedProduct.current_stock : undefined}
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1"
                    required
                    data-testid="sale-quantity-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Birim Fiyat (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="0.00"
                    required
                    data-testid="sale-unit-price-input"
                  />
                </div>
              </div>
              
              {formData.quantity && formData.unit_price && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-lg font-semibold text-green-800">
                    Toplam Tutar: ₺{(parseFloat(formData.quantity || 0) * parseFloat(formData.unit_price || 0)).toFixed(2)}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Müşteri Adı</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Müşteri adı..."
                    data-testid="sale-customer-name-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Müşteri Telefon</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="0555 123 45 67"
                    data-testid="sale-customer-phone-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Ödeme Yöntemi</label>
                <select
                  className="form-select"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  data-testid="sale-payment-method-select"
                >
                  <option value="cash">Nakit</option>
                  <option value="card">Kredi Kartı</option>
                  <option value="transfer">Havale/EFT</option>
                  <option value="check">Çek</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Notlar</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Satış ile ilgili notlar..."
                  data-testid="sale-notes-input"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn btn-success flex-1"
                  disabled={submitting || !formData.product_id || !formData.quantity || !formData.unit_price}
                  data-testid="save-sale-btn"
                >
                  {submitting ? (
                    <><div className="spinner"></div> Kaydediliyor...</>
                  ) : (
                    <><span>💾</span> Satışı Kaydet</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                  data-testid="cancel-sale-btn"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="table-container" data-testid="sales-table">
        <div className="table-header p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Satış Listesi ({sales.length})</h3>
            <button 
              onClick={fetchSales}
              className="btn btn-secondary btn-sm"
              data-testid="refresh-sales-btn"
            >
              🔄 Yenile
            </button>
          </div>
        </div>
        
        {sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-3">Tarih</th>
                  <th className="text-left p-3">Ürün</th>
                  <th className="text-center p-3">Miktar</th>
                  <th className="text-left p-3">Birim Fiyat</th>
                  <th className="text-left p-3">Toplam</th>
                  <th className="text-left p-3">Müşteri</th>
                  <th className="text-left p-3">Ödeme</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="table-row">
                    <td className="p-3">
                      <div className="text-sm">
                        {new Date(sale.created_at).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(sale.created_at).toLocaleTimeString('tr-TR')}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{getProductName(sale.product_id)}</div>
                      {sale.notes && (
                        <div className="text-xs text-gray-500 mt-1">{sale.notes}</div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-semibold text-blue-600">{sale.quantity}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">₺{sale.unit_price.toFixed(2)}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-green-600">
                        ₺{sale.total_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>{sale.customer_name || '-'}</div>
                        {sale.customer_phone && (
                          <div className="text-xs text-gray-500">{sale.customer_phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {{"cash": "Nakit", "card": "Kart", "transfer": "Havale", "check": "Çek"}[sale.payment_method] || sale.payment_method}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">💰</div>
            <div className="text-xl mb-2">
              {filters.product_id || filters.start_date || filters.end_date
                ? 'Arama kriterlerinize uygun satış bulunamadı' 
                : 'Henüz satış kaydı yok'
              }
            </div>
            {!filters.product_id && !filters.start_date && !filters.end_date && (
              <>
                <div className="mb-4">İlk satışınızı yapmak için yukarıdaki butonu kullanın.</div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="btn btn-success"
                >
                  İlk Satışı Yap
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;