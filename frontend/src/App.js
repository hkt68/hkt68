import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Ana Bileşenler
function Sidebar({ activeMenu, setActiveMenu }) {
  const menuItems = [
    { id: 'sales', name: '🛒 Satış Ekranı', icon: '🛒' },
    { id: 'products', name: '📦 Ürün Yönetimi', icon: '📦' },
    { id: 'customers', name: '👥 Müşteriler', icon: '👥' },
    { id: 'reports', name: '📊 Raporlar', icon: '📊' },
    { id: 'settings', name: '⚙️ Ayarlar', icon: '⚙️' }
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white h-screen fixed left-0 top-0 shadow-xl">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold text-center">Elite Medya POS</h1>
        <p className="text-blue-200 text-sm text-center mt-1">v1.0</p>
      </div>
      
      <nav className="mt-4">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={`w-full text-left px-6 py-4 hover:bg-blue-700 transition-all duration-200 border-l-4 ${
              activeMenu === item.id 
                ? 'bg-blue-700 border-white text-white' 
                : 'border-transparent text-blue-200 hover:text-white'
            }`}
            data-testid={`menu-${item.id}`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 text-center text-blue-300 text-xs">
        © 2024 Elite Medya Bilişim
      </div>
    </div>
  );
}

// Satış Ekranı Bileşeni
function SalesScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);

  // Müşterileri yükle
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
    }
  };

  // Ürün arama
  const searchProducts = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/products/search?q=${term}`);
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Arama yapılamadı:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sepete ekleme
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.sale_price }
          : item
      ));
    } else {
      setCart([...cart, { 
        ...product, 
        quantity: 1, 
        total: product.sale_price 
      }]);
    }
    
    setSearchTerm('');
    setSearchResults([]);
  };

  // Sepetten çıkarma
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Miktar güncelleme
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.sale_price }
        : item
    ));
  };

  // Toplam hesaplama
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  // Satış tamamlama
  const completeSale = async () => {
    if (cart.length === 0) {
      alert('Sepet boş!');
      return;
    }

    const saleData = {
      customer_id: selectedCustomer?.id || null,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.sale_price
      })),
      payment_method: paymentMethod,
      discount_amount: 0,
      tax_amount: 0,
      notes: ''
    };

    try {
      setIsLoading(true);
      const response = await axios.post(`${API}/sales`, saleData);
      
      if (response.data.success) {
        alert(`Satış başarılı! Toplam: ${calculateTotal().toFixed(2)} TL`);
        setCart([]);
        setSelectedCustomer(null);
        setPaymentMethod('cash');
      }
    } catch (error) {
      console.error('Satış tamamlanamadı:', error);
      alert('Satış tamamlanamadı!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        
        {/* Ürün Arama ve Sepet */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🛒 Satış Ekranı</h2>
          
          {/* Arama Kutusu */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ürün Ara (İsim veya Barkod)
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchProducts(e.target.value);
              }}
              placeholder="Ürün adı veya barkod giriniz..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              data-testid="product-search-input"
            />
          </div>

          {/* Arama Sonuçları */}
          {searchResults.length > 0 && (
            <div className="mb-6 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {searchResults.map(product => (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                  data-testid={`search-result-${product.id}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.category_name} - Stok: {product.stock_quantity}</p>
                      {product.barcode && (
                        <p className="text-xs text-gray-500">Barkod: {product.barcode}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600">{product.sale_price.toFixed(2)} TL</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sepet */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sepet</h3>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Sepet boş</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-800">{item.name}</h5>
                      <p className="text-sm text-gray-600">{item.sale_price.toFixed(2)} TL x {item.quantity}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        data-testid={`decrease-quantity-${item.id}`}
                      >
                        -
                      </button>
                      
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                        data-testid={`increase-quantity-${item.id}`}
                      >
                        +
                      </button>
                      
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors ml-2"
                        data-testid={`remove-item-${item.id}`}
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="w-20 text-right">
                      <span className="font-bold text-green-600">{item.total.toFixed(2)} TL</span>
                    </div>
                  </div>
                ))}
                
                {/* Toplam */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>TOPLAM:</span>
                    <span className="text-green-600" data-testid="cart-total">{calculateTotal().toFixed(2)} TL</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ödeme Bölümü */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">💳 Ödeme</h3>
          
          {/* Müşteri Seçimi */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri (Opsiyonel)
            </label>
            <select 
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const customer = customers.find(c => c.id === e.target.value);
                setSelectedCustomer(customer || null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="customer-select"
            >
              <option value="">Müşteri seçiniz...</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.phone && `(${customer.phone})`}
                </option>
              ))}
            </select>
          </div>

          {/* Ödeme Yöntemi */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ödeme Yöntemi
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'cash', name: '💵 Nakit', color: 'green' },
                { id: 'card', name: '💳 Kredi Kartı', color: 'blue' },
                { id: 'other', name: '🏪 Diğer', color: 'purple' },
                { id: 'credit', name: '📋 Cari Hesap', color: 'orange' }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    paymentMethod === method.id
                      ? `border-${method.color}-500 bg-${method.color}-50 text-${method.color}-700`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid={`payment-method-${method.id}`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">{method.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Seçilen Müşteri Bilgisi */}
          {selectedCustomer && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Seçilen Müşteri:</h4>
              <p className="text-blue-700">{selectedCustomer.name}</p>
              {selectedCustomer.phone && (
                <p className="text-blue-600 text-sm">{selectedCustomer.phone}</p>
              )}
              <p className="text-sm text-blue-600 mt-2">
                Mevcut Bakiye: <span className="font-semibold">{selectedCustomer.balance?.toFixed(2) || '0.00'} TL</span>
              </p>
            </div>
          )}

          {/* Özet */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-lg">
              <span>Ürün Sayısı:</span>
              <span className="font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)} adet</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-green-600 mt-2">
              <span>Toplam Tutar:</span>
              <span>{calculateTotal().toFixed(2)} TL</span>
            </div>
          </div>

          {/* Satışı Tamamla Butonu */}
          <button
            onClick={completeSale}
            disabled={isLoading || cart.length === 0}
            className="w-full py-4 bg-green-600 text-white text-xl font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            data-testid="complete-sale-button"
          >
            {isLoading ? 'İşlem Yapılıyor...' : `💰 Satışı Tamamla (${calculateTotal().toFixed(2)} TL)`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Ürün Yönetimi Placeholder
function ProductManagement() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📦 Ürün Yönetimi</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Ürün yönetimi bölümü geliştiriliyor...</p>
      </div>
    </div>
  );
}

// Ana Uygulama
function App() {
  const [activeMenu, setActiveMenu] = useState('sales');

  const renderContent = () => {
    switch (activeMenu) {
      case 'sales':
        return <SalesScreen />;
      case 'products':
        return <ProductManagement />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Geliştiriliyor...</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Bu bölüm geliştiriliyor...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App bg-gray-100 min-h-screen">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="ml-64">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;