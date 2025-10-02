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

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Sepet boş!');
      return;
    }

    if (paymentInfo.method === 'cash' && getChangeAmount() < 0) {
      setError('Alınan tutar yetersiz!');
      return;
    }

    try {
      setSubmitting(true);
      
      // Process each cart item as separate sale
      for (const item of cart) {
        const saleData = {
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          customer_name: customerInfo.name || null,
          customer_phone: customerInfo.phone || null,
          payment_method: paymentInfo.method,
          notes: paymentInfo.notes || null
        };
        
        await axios.post('/sales', saleData);
      }
      
      await fetchData(); // Refresh data
      clearCart();
      alert(`✅ Satış tamamlandı!\nToplam: ₺${getCartTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}\n${paymentInfo.method === 'cash' && getChangeAmount() > 0 ? `Para Üstü: ₺${getChangeAmount().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : ''}`);
      
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Satış kaydedilirken hata oluştu');
      }
      console.error('Checkout error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Focus barcode input on component mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

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
          <span className="mr-3">🛒</span>
          POS Satış Sistemi
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`btn ${showHistory ? 'btn-primary' : 'btn-secondary'}`}
            data-testid="toggle-history-btn"
          >
            <span>📊</span>
            {showHistory ? 'POS Görünümü' : 'Satış Geçmişi'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-xl">×</button>
        </div>
      )}

      {!showHistory ? (
        /* POS SYSTEM VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT PANEL - Product Selection & Barcode */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barcode Scanner */}
            <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-blue-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📷</span>
                Barkod/SKU Okuyucu
              </h3>
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  className="form-input flex-1 text-lg py-3 px-4"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Barkod, SKU veya ürün adı girin..."
                  data-testid="barcode-input"
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="btn btn-primary text-lg px-6"
                  data-testid="add-to-cart-btn"
                >
                  ➕ Ekle
                </button>
              </form>
            </div>

            {/* Quick Product Selection */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🔍</span>
                Hızlı Ürün Seçimi
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {products
                  .filter(p => p.current_stock > 0)
                  .slice(0, 20)
                  .map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                      data-testid={`quick-add-${product.id}`}
                    >
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500">Stok: {product.current_stock}</div>
                      <div className="text-sm font-bold text-green-600">
                        ₺{product.selling_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Cart & Checkout */}
          <div className="space-y-4">
            {/* Cart */}
            <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-green-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2">🛒</span>
                  Sepet ({getCartItemCount()} adet)
                </h3>
                {cart.length > 0 && (
                  <button 
                    onClick={clearCart}
                    className="btn btn-danger btn-sm"
                    data-testid="clear-cart-btn"
                  >
                    🗑️ Temizle
                  </button>
                )}
              </div>

              {cart.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.product.name}</div>
                          <div className="text-xs text-gray-500">
                            {item.product.sku && `SKU: ${item.product.sku}`}
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 text-lg"
                          data-testid={`remove-item-${item.product.id}`}
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">Miktar:</label>
                          <input
                            type="number"
                            min="1"
                            max={item.product.current_stock}
                            value={item.quantity}
                            onChange={(e) => updateCartItemQuantity(item.product.id, parseInt(e.target.value) || 1)}
                            className="form-input text-sm"
                            data-testid={`quantity-${item.product.id}`}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Birim Fiyat:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateCartItemPrice(item.product.id, e.target.value)}
                            className="form-input text-sm"
                            data-testid={`price-${item.product.id}`}
                          />
                        </div>
                      </div>
                      
                      <div className="text-right mt-2">
                        <span className="font-bold text-green-600">
                          ₺{item.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">🛒</div>
                  <div>Sepet boş</div>
                  <div className="text-sm">Barkod okutun veya ürün seçin</div>
                </div>
              )}
            </div>

            {/* Checkout Section */}
            {cart.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-yellow-100">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="mr-2">💳</span>
                  Ödeme
                </h3>

                {/* Total Amount */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">TOPLAM TUTAR</div>
                    <div className="text-3xl font-bold text-green-600" data-testid="total-amount">
                      ₺{getCartTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="form-label text-sm">Müşteri Adı</label>
                    <input
                      type="text"
                      className="form-input"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="Müşteri adı (opsiyonel)"
                      data-testid="customer-name-input"
                    />
                  </div>
                  <div>
                    <label className="form-label text-sm">Telefon</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="Telefon (opsiyonel)"
                      data-testid="customer-phone-input"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <div>
                    <label className="form-label text-sm">Ödeme Yöntemi</label>
                    <select
                      className="form-select"
                      value={paymentInfo.method}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, method: e.target.value })}
                      data-testid="payment-method-select"
                    >
                      <option value="cash">💵 Nakit</option>
                      <option value="card">💳 Kredi Kartı</option>
                      <option value="transfer">🏦 Havale/EFT</option>
                      <option value="check">📝 Çek</option>
                    </select>
                  </div>

                  {paymentInfo.method === 'cash' && (
                    <div>
                      <label className="form-label text-sm">Alınan Tutar (₺)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input text-lg font-bold"
                        value={paymentInfo.received_amount}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, received_amount: e.target.value })}
                        placeholder="0.00"
                        data-testid="received-amount-input"
                      />
                      {paymentInfo.received_amount && (
                        <div className={`mt-2 p-2 rounded text-center font-bold ${
                          getChangeAmount() >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {getChangeAmount() >= 0 ? (
                            <>
                              <div>✅ Para Üstü</div>
                              <div className="text-lg" data-testid="change-amount">
                                ₺{getChangeAmount().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </div>
                            </>
                          ) : (
                            <>
                              <div>❌ Yetersiz Tutar</div>
                              <div className="text-lg">
                                ₺{Math.abs(getChangeAmount()).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} eksik
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="form-label text-sm">Notlar</label>
                    <input
                      type="text"
                      className="form-input"
                      value={paymentInfo.notes}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, notes: e.target.value })}
                      placeholder="Satış notu (opsiyonel)"
                      data-testid="sale-notes-input"
                    />
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={submitting || (paymentInfo.method === 'cash' && getChangeAmount() < 0)}
                  className="btn btn-success w-full text-xl py-4 mt-4"
                  data-testid="checkout-btn"
                >
                  {submitting ? (
                    <><div className="spinner"></div> İşleniyor...</>
                  ) : (
                    <>💰 SATIŞ TAMAMLA</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SALES HISTORY VIEW */
        <div className="space-y-4">
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
                    <div className="mb-4">İlk satışınızı POS sistemi ile yapabilirsiniz.</div>
                    <button 
                      onClick={() => setShowHistory(false)}
                      className="btn btn-success"
                    >
                      POS Sistemine Git
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;