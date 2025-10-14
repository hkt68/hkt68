import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { 
  Barcode, 
  Camera, 
  Trash2, 
  Plus, 
  Minus,
  CreditCard,
  DollarSign,
  User,
  Search,
  X,
  Printer
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function POSPage({ user, onLogout }) {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [printReceipt, setPrintReceipt] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  
  const barcodeInputRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    loadProducts();
    loadFavorites();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Products load error:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await axios.get(`${API}/products/favorites`);
      setFavoriteProducts(response.data);
    } catch (error) {
      console.error('Favorites load error:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Customers load error:', error);
    }
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const response = await axios.get(`${API}/products/barcode/${barcode}`);
      addToCart(response.data);
      setBarcode('');
      toast.success(`${response.data.name} sepete eklendi`);
    } catch (error) {
      toast.error('Ürün bulunamadı');
      setBarcode('');
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        quantity: 1,
        unit_price: product.sale_price,
        total: product.sale_price
      }]);
    }
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.unit_price
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCashReceived('');
    setCashAmount(0);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateChange = () => {
    const total = calculateTotal();
    const received = parseFloat(cashReceived) || 0;
    return received - total;
  };

  const handleQuickCash = (amount) => {
    const newAmount = cashAmount + amount;
    setCashAmount(newAmount);
    setCashReceived(newAmount.toString());
  };

  const resetCashAmount = () => {
    setCashAmount(0);
    setCashReceived('');
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error('Sepet boş');
      return;
    }

    if (paymentMethod === 'customer' && !selectedCustomer) {
      toast.error('Lütfen cari müşteri seçin');
      return;
    }

    if (paymentMethod === 'cash' && calculateChange() < 0) {
      toast.error('Yetersiz nakit tutarı');
      return;
    }

    try {
      const saleData = {
        items: cart,
        payment_method: paymentMethod,
        customer_id: selectedCustomer?.id || null,
        cash_received: paymentMethod === 'cash' ? parseFloat(cashReceived) : null,
        print_receipt: printReceipt
      };

      const response = await axios.post(`${API}/sales`, saleData);
      
      toast.success(`Satış tamamlandı! Fiş No: ${response.data.sale_number}`);
      
      if (printReceipt) {
        // Print receipt functionality can be added here
        console.log('Printing receipt:', response.data);
      }

      clearCart();
      loadProducts();
    } catch (error) {
      toast.error('Satış tamamlanamadı: ' + (error.response?.data?.detail || 'Hata'));
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearch('');
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast.error('Kamera erişimi başarısız');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const total = calculateTotal();
  const change = calculateChange();

  return (
    <Layout user={user} onLogout={onLogout}>
      <Toaster position="top-right" richColors />
      
      <div className="pos-page" data-testid="pos-page">
        <div className="pos-grid">
          {/* Left Side - Products */}
          <div className="pos-left">
            {/* Barcode Scanner */}
            <div className="card">
              <h3><Barcode size={20} /> Barkod Okuma</h3>
              
              <form onSubmit={handleBarcodeSubmit} className="barcode-form">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Barkod okutun veya yazın..."
                    className="barcode-input"
                    data-testid="barcode-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (cameraActive) {
                        stopCamera();
                      } else {
                        startCamera();
                      }
                    }}
                    data-testid="camera-button"
                  >
                    <Camera size={20} />
                  </button>
                </div>
              </form>

              {cameraActive && (
                <div className="camera-preview">
                  <video ref={videoRef} autoPlay playsInline />
                  <button className="btn btn-danger btn-sm" onClick={stopCamera}>
                    Kamerayı Kapat
                  </button>
                </div>
              )}
            </div>

            {/* Favorite Products */}
            <div className="card">
              <h3>Hızlı Ürünler</h3>
              <div className="favorite-grid">
                {favoriteProducts.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                    Favori ürün yok
                  </p>
                ) : (
                  favoriteProducts.map((product) => (
                    <button
                      key={product.id}
                      className="favorite-btn"
                      onClick={() => {
                        addToCart(product);
                        toast.success(`${product.name} sepete eklendi`);
                      }}
                      data-testid={`favorite-product-${product.id}`}
                    >
                      <div className="favorite-name">{product.name}</div>
                      <div className="favorite-price">{product.sale_price.toFixed(2)} ₺</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Cart */}
          <div className="pos-right">
            <div className="card cart-card">
              <div className="cart-header">
                <h3>Sepet ({cart.length})</h3>
                {cart.length > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={clearCart}>
                    <Trash2 size={16} />
                    Temizle
                  </button>
                )}
              </div>

              <div className="cart-items" data-testid="cart-items">
                {cart.length === 0 ? (
                  <div className="empty-cart">
                    <p>Sepet boş</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product_id} className="cart-item">
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.product_name}</div>
                        <div className="cart-item-price">{item.unit_price.toFixed(2)} ₺</div>
                      </div>
                      
                      <div className="cart-item-actions">
                        <button
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.product_id, -1)}
                          data-testid={`decrease-${item.product_id}`}
                        >
                          <Minus size={16} />
                        </button>
                        
                        <span className="quantity" data-testid={`quantity-${item.product_id}`}>
                          {item.quantity}
                        </span>
                        
                        <button
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.product_id, 1)}
                          data-testid={`increase-${item.product_id}`}
                        >
                          <Plus size={16} />
                        </button>
                        
                        <button
                          className="remove-btn"
                          onClick={() => removeFromCart(item.product_id)}
                          data-testid={`remove-${item.product_id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="cart-item-total">
                        {item.total.toFixed(2)} ₺
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="cart-total">
                <div className="total-row">
                  <span>Toplam:</span>
                  <span className="total-amount" data-testid="cart-total">
                    {total.toFixed(2)} ₺
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="payment-section">
                <h4>Ödeme Yöntemi</h4>
                <div className="payment-methods">
                  <button
                    className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                    data-testid="payment-cash"
                  >
                    <DollarSign size={20} />
                    Nakit
                  </button>
                  
                  <button
                    className={`payment-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                    data-testid="payment-card"
                  >
                    <CreditCard size={20} />
                    Kredi Kartı
                  </button>
                  
                  <button
                    className={`payment-btn ${paymentMethod === 'customer' ? 'active' : ''}`}
                    onClick={() => {
                      setPaymentMethod('customer');
                      setShowCustomerModal(true);
                    }}
                    data-testid="payment-customer"
                  >
                    <User size={20} />
                    Cari
                  </button>
                  
                  <button
                    className={`payment-btn ${paymentMethod === 'other' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('other')}
                    data-testid="payment-other"
                  >
                    Diğer
                  </button>
                </div>

                {/* Selected Customer */}
                {selectedCustomer && (
                  <div className="selected-customer">
                    <User size={16} />
                    <span>{selectedCustomer.name}</span>
                    <button onClick={() => setSelectedCustomer(null)}>
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Cash Payment */}
                {paymentMethod === 'cash' && (
                  <>
                    <div className="input-group">
                      <label>Alınan Tutar</label>
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        data-testid="cash-received-input"
                      />
                    </div>

                    <div className="quick-cash">
                      {[5, 10, 20, 50, 100, 200].map((amount) => (
                        <button
                          key={amount}
                          className="cash-btn"
                          onClick={() => handleQuickCash(amount)}
                          data-testid={`quick-cash-${amount}`}
                        >
                          {amount} ₺
                        </button>
                      ))}
                    </div>

                    {cashReceived && (
                      <div className="change-display">
                        <span>Para Üstü:</span>
                        <span className={change >= 0 ? 'change-positive' : 'change-negative'}>
                          {change.toFixed(2)} ₺
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Print Receipt */}
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={printReceipt}
                      onChange={(e) => setPrintReceipt(e.target.checked)}
                      data-testid="print-receipt-checkbox"
                    />
                    <Printer size={16} />
                    <span>Fiş Yazdır</span>
                  </label>
                </div>

                {/* Complete Sale */}
                <button
                  className="btn btn-success btn-lg"
                  onClick={handleCompleteSale}
                  disabled={cart.length === 0}
                  data-testid="complete-sale-button"
                  style={{ width: '100%' }}
                >
                  Satışı Tamamla
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cari Müşteri Seç</h3>
              <button onClick={() => setShowCustomerModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="input-group">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="İsim veya telefon ile ara..."
                  data-testid="customer-search-input"
                  autoFocus
                />
              </div>

              <div className="customer-list">
                {filteredCustomers.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Müşteri bulunamadı
                  </p>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="customer-item"
                      onClick={() => selectCustomer(customer)}
                      data-testid={`customer-${customer.id}`}
                    >
                      <div>
                        <div className="customer-name">{customer.name}</div>
                        <div className="customer-phone">{customer.phone}</div>
                      </div>
                      <div className={`customer-balance ${customer.balance < 0 ? 'positive' : 'negative'}`}>
                        {Math.abs(customer.balance).toFixed(2)} ₺
                        {customer.balance < 0 ? ' Alacak' : ' Borç'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pos-page {
          max-width: 1600px;
          margin: 0 auto;
        }

        .pos-grid {
          display: grid;
          grid-template-columns: 1fr 450px;
          gap: 1.5rem;
        }

        .card h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .barcode-form {
          margin-bottom: 1rem;
        }

        .barcode-input {
          flex: 1;
          font-size: 1.125rem;
        }

        .camera-preview {
          margin-top: 1rem;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .camera-preview video {
          width: 100%;
          display: block;
        }

        .favorite-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .favorite-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .favorite-btn:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px var(--shadow);
        }

        .favorite-name {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .favorite-price {
          font-size: 1rem;
          font-weight: 700;
        }

        .cart-card {
          position: sticky;
          top: 6rem;
          max-height: calc(100vh - 8rem);
          display: flex;
          flex-direction: column;
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .cart-items {
          flex: 1;
          overflow-y: auto;
          max-height: 300px;
          margin-bottom: 1rem;
        }

        .empty-cart {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-secondary);
        }

        .cart-item {
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-bottom: 0.5rem;
          background: var(--bg-tertiary);
        }

        .cart-item-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .cart-item-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .cart-item-price {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .quantity-btn {
          width: 32px;
          height: 32px;
          border: 1px solid var(--border);
          background: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quantity-btn:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .quantity {
          font-weight: 600;
          min-width: 40px;
          text-align: center;
        }

        .remove-btn {
          margin-left: auto;
          width: 32px;
          height: 32px;
          border: 1px solid #ef4444;
          background: white;
          color: #ef4444;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: #ef4444;
          color: white;
        }

        .cart-item-total {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--primary);
          text-align: right;
        }

        .cart-total {
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-amount {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--primary);
        }

        .payment-section h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }

        .payment-methods {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .payment-btn {
          padding: 0.875rem;
          border: 2px solid var(--border);
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .payment-btn:hover {
          border-color: var(--primary);
          background: var(--bg-tertiary);
        }

        .payment-btn.active {
          border-color: var(--primary);
          background: var(--primary);
          color: white;
        }

        .selected-customer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .selected-customer span {
          flex: 1;
          font-weight: 500;
        }

        .selected-customer button {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
        }

        .quick-cash {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin: 1rem 0;
        }

        .cash-btn {
          padding: 0.75rem;
          border: 1px solid var(--border);
          background: white;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cash-btn:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .change-display {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .change-positive {
          color: var(--secondary);
        }

        .change-negative {
          color: #ef4444;
        }

        .checkbox-group {
          margin-bottom: 1rem;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
        }

        .customer-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .customer-item {
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .customer-item:hover {
          background: var(--bg-tertiary);
          border-color: var(--primary);
        }

        .customer-name {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .customer-phone {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .customer-balance {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .customer-balance.positive {
          color: var(--secondary);
        }

        .customer-balance.negative {
          color: #ef4444;
        }

        @media (max-width: 1024px) {
          .pos-grid {
            grid-template-columns: 1fr;
          }

          .cart-card {
            position: static;
            max-height: none;
          }
        }
      `}</style>
    </Layout>
  );
}

export default POSPage;
