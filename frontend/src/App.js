import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Yardımcı Fonksiyonlar
const calculateVAT = (price, vatRate) => {
  return (price * vatRate) / 100;
};

const calculateNetPrice = (price, vatRate) => {
  return price - calculateVAT(price, vatRate);
};

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
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white h-screen fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-xl font-bold text-center">Elite Medya POS</h1>
        <p className="text-blue-200 text-sm text-center mt-1">v2.0 Pro</p>
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

// Favori Ürünler Paneli
function FavoriteProducts({ onAddToCart }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/products/favorites`);
      setFavorites(response.data.data);
    } catch (error) {
      console.error('Favori ürünler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (productId) => {
    try {
      await axios.put(`${API}/products/${productId}/favorite`);
      loadFavorites(); // Listeyi yenile
    } catch (error) {
      console.error('Favori durumu güncellenemedi:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="font-bold text-gray-800 mb-3">⭐ Favori Ürünler</h3>
        <div className="flex items-center justify-center py-8">
          <div className="loading-spinner"></div>
          <span className="text-gray-500">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="font-bold text-gray-800 mb-3">⭐ Favori Ürünler</h3>
      
      {favorites.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          Henüz favori ürün yok. Ürün araması yaparak favorilere ekleyebilirsiniz.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {favorites.map(product => (
            <div 
              key={product.id}
              className="border rounded-lg p-2 hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => onAddToCart(product)}
              data-testid={`favorite-product-${product.id}`}
            >
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-16 object-cover rounded mb-2"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-16 bg-gray-200 rounded mb-2 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Resim Yok</span>
                </div>
              )}
              <h5 className="text-xs font-medium text-gray-800 truncate">{product.name}</h5>
              <p className="text-xs text-green-600 font-bold">{product.sale_price.toFixed(2)} TL</p>
              <p className="text-xs text-gray-500">KDV: %{product.vat_rate}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Arama Önerileri Komponenti
function SearchSuggestions({ query, onSelectProduct, onClose, onAddNewProduct }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length >= 2) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/products/suggestions?q=${query}&limit=8`);
      setSuggestions(response.data.data);
    } catch (error) {
      console.error('Öneriler alınamadı:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (query.trim().length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center">
          <div className="loading-spinner inline-block"></div>
          <span className="ml-2 text-gray-500">Aranıyor...</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div>
          {suggestions.map(product => (
            <div 
              key={product.id}
              onClick={() => {
                onSelectProduct(product);
                onClose();
              }}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex items-center space-x-3"
              data-testid={`suggestion-${product.id}`}
            >
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-400 text-xs">📦</span>
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{product.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-bold">{product.sale_price.toFixed(2)} TL</span>
                  {product.barcode && (
                    <span className="text-xs text-gray-500">{product.barcode}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center">
          <div className="text-gray-500 mb-3">
            <div className="text-lg mb-2">📦 Ürün Bulunamadı</div>
            <div className="text-sm">"{query}" için ürün kaydı yok</div>
          </div>
          
          {/* Barkod formatı kontrolü (en az 8 karakter, sadece rakam) */}
          {query.length >= 8 && /^\d+$/.test(query) && (
            <button
              onClick={() => {
                onAddNewProduct && onAddNewProduct(query);
                onClose();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              data-testid="add-new-product-button"
            >
              ➕ Bu Barkodla Yeni Ürün Ekle
            </button>
          )}
          
          {query.length < 8 && (
            <p className="text-xs text-gray-400 mt-2">
              Yeni ürün eklemek için en az 8 haneli barkod giriniz
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Satış Fişi Komponenti
function SalesReceipt({ sale, onClose, onPrint }) {
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  
  const currentDate = new Date();
  const receiptNumber = sale?.id?.substring(0, 8).toUpperCase() || 'N/A';
  
  const calculateVATBreakdown = () => {
    if (!sale?.items) return {};
    
    return sale.items.reduce((acc, item) => {
      const vatRate = item.vat_rate || 0;
      const itemTotal = item.total || (item.quantity * item.unit_price);
      const vatAmount = (itemTotal * vatRate) / (100 + vatRate);
      const netAmount = itemTotal - vatAmount;

      if (!acc[vatRate]) {
        acc[vatRate] = { net: 0, vat: 0, total: 0 };
      }
      
      acc[vatRate].net += netAmount;
      acc[vatRate].vat += vatAmount;
      acc[vatRate].total += itemTotal;
      
      return acc;
    }, {});
  };

  const vatBreakdown = calculateVATBreakdown();
  const totalNet = Object.values(vatBreakdown).reduce((sum, group) => sum + group.net, 0);
  const totalVAT = Object.values(vatBreakdown).reduce((sum, group) => sum + group.vat, 0);

  const handlePrint = () => {
    // Fiş çıkartılsın mı sorusu
    const shouldPrint = window.confirm("Satış fişi çıkartılsın mı?");
    
    if (shouldPrint) {
      setShowPrintDialog(true);
      setTimeout(() => {
        window.print();
        setShowPrintDialog(false);
        onPrint && onPrint();
      }, 500);
    } else {
      onClose && onClose();
    }
  };

  if (!sale) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-green-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-green-800">✅ Satış Tamamlandı!</h3>
            <button 
              onClick={() => onClose && onClose()}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Fiş No: {receiptNumber} • {currentDate.toLocaleString('tr-TR')}
          </p>
        </div>

        {/* Fiş Önizleme */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div id="receipt-content" className="receipt-format bg-white text-black">
            {/* İşletme Bilgileri */}
            <div className="text-center mb-4 border-b pb-2">
              <div className="font-bold text-lg">ELİTE MEDYA BİLİŞİM</div>
              <div className="text-sm">POS SATIŞ SİSTEMİ</div>
              <div className="text-xs mt-1">www.elitmedyabilisim.shop</div>
            </div>

            {/* Fiş Bilgileri */}
            <div className="text-xs mb-3">
              <div className="flex justify-between">
                <span>FİŞ NO:</span>
                <span>{receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>TARİH:</span>
                <span>{currentDate.toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex justify-between">
                <span>SAAT:</span>
                <span>{currentDate.toLocaleTimeString('tr-TR')}</span>
              </div>
              {sale.customer_name && (
                <div className="flex justify-between">
                  <span>MÜŞTERİ:</span>
                  <span className="truncate ml-2">{sale.customer_name}</span>
                </div>
              )}
            </div>

            {/* Ürün Listesi */}
            <div className="border-t border-b py-2 mb-3">
              <div className="text-xs font-bold mb-1">ÜRÜN LİSTESİ</div>
              {sale.items && sale.items.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span className="truncate flex-1">{item.product_name}</span>
                    <span className="ml-2">{(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{item.quantity} x {item.unit_price.toFixed(2)} TL</span>
                    <span>KDV %{item.vat_rate || 0}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* KDV Dökümü */}
            {Object.keys(vatBreakdown).length > 0 && (
              <div className="text-xs mb-3">
                <div className="font-bold mb-1">KDV DÖKÜMÜ</div>
                {Object.entries(vatBreakdown).map(([rate, amounts]) => (
                  <div key={rate}>
                    <div className="flex justify-between">
                      <span>%{rate} KDV Matrahı:</span>
                      <span>{amounts.net.toFixed(2)} TL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>%{rate} KDV:</span>
                      <span>{amounts.vat.toFixed(2)} TL</span>
                    </div>
                  </div>
                ))}
                <div className="border-t mt-1 pt-1">
                  <div className="flex justify-between">
                    <span>TOPLAM NET:</span>
                    <span>{totalNet.toFixed(2)} TL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TOPLAM KDV:</span>
                    <span>{totalVAT.toFixed(2)} TL</span>
                  </div>
                </div>
              </div>
            )}

            {/* Ödeme Bilgileri */}
            <div className="text-xs mb-3">
              <div className="flex justify-between font-bold text-lg">
                <span>GENEL TOPLAM:</span>
                <span>{sale.total_amount?.toFixed(2) || '0.00'} TL</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>ÖDEME ŞEKLİ:</span>
                <span>
                  {sale.payment_method === 'cash' && 'NAKİT'}
                  {sale.payment_method === 'card' && 'KREDİ KARTI'}
                  {sale.payment_method === 'credit' && 'CARİ HESAP'}
                  {sale.payment_method === 'other' && 'DİĞER'}
                </span>
              </div>
            </div>

            {/* Alt Bilgiler */}
            <div className="text-center text-xs border-t pt-2">
              <div>TEŞEKKÜR EDERİZ</div>
              <div className="mt-2">Bu fiş iade için gereklidir</div>
              <div className="mt-1">İyi günler dileriz</div>
            </div>
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="p-4 border-t bg-gray-50 flex space-x-3">
          <button
            onClick={() => onClose && onClose()}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Kapat
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            data-testid="print-receipt-button"
          >
            🖨️ Fiş Yazdır
          </button>
        </div>
      </div>

    </div>
  );
}

// Para Üstü Hesaplayıcısı
function ChangeCalculator({ total, onAmountChange }) {
  const [receivedAmount, setReceivedAmount] = useState('');
  const [change, setChange] = useState(0);

  useEffect(() => {
    const amount = parseFloat(receivedAmount) || 0;
    const changeAmount = amount - total;
    setChange(changeAmount);
    onAmountChange && onAmountChange(amount, changeAmount);
  }, [receivedAmount, total, onAmountChange]);

  const quickAmounts = [50, 100, 200, 500];

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-yellow-800 mb-3">💵 Para Üstü Hesaplayıcı</h4>
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alınan Para (TL)
        </label>
        <input
          type="number"
          value={receivedAmount}
          onChange={(e) => setReceivedAmount(e.target.value)}
          placeholder="Müşteriden alınan para..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          data-testid="received-amount-input"
        />
      </div>

      {/* Hızlı Tutar Butonları */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {quickAmounts.map(amount => (
          <button
            key={amount}
            onClick={() => setReceivedAmount(amount.toString())}
            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors"
            data-testid={`quick-amount-${amount}`}
          >
            {amount} TL
          </button>
        ))}
      </div>

      {/* Sonuç */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white rounded p-2 text-center">
          <div className="text-gray-600">Toplam</div>
          <div className="font-bold text-red-600">{total.toFixed(2)} TL</div>
        </div>
        <div className={`rounded p-2 text-center ${
          change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="text-sm">{change >= 0 ? 'Para Üstü' : 'Eksik'}</div>
          <div className="font-bold" data-testid="change-amount">
            {Math.abs(change).toFixed(2)} TL
          </div>
        </div>
      </div>
    </div>
  );
}

// KDV Özet Komponenti
function VATSummary({ cart }) {
  const vatBreakdown = cart.reduce((acc, item) => {
    const vatRate = item.vat_rate;
    const itemTotal = item.total;
    const vatAmount = calculateVAT(itemTotal, vatRate);
    const netAmount = itemTotal - vatAmount;

    if (!acc[vatRate]) {
      acc[vatRate] = { net: 0, vat: 0, total: 0 };
    }
    
    acc[vatRate].net += netAmount;
    acc[vatRate].vat += vatAmount;
    acc[vatRate].total += itemTotal;
    
    return acc;
  }, {});

  const grandTotal = Object.values(vatBreakdown).reduce((sum, group) => sum + group.total, 0);
  const totalVAT = Object.values(vatBreakdown).reduce((sum, group) => sum + group.vat, 0);
  const totalNet = grandTotal - totalVAT;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-gray-800 mb-3">📊 KDV Dökümü</h4>
      
      {Object.keys(vatBreakdown).length > 0 ? (
        <div className="space-y-2">
          {Object.entries(vatBreakdown).map(([rate, amounts]) => (
            <div key={rate} className="flex justify-between items-center text-sm border-b pb-1">
              <span className="text-gray-600">%{rate} KDV</span>
              <div className="text-right">
                <div>Net: {amounts.net.toFixed(2)} TL</div>
                <div className="text-red-600">KDV: {amounts.vat.toFixed(2)} TL</div>
              </div>
            </div>
          ))}
          
          <div className="border-t pt-2 font-bold">
            <div className="flex justify-between">
              <span>Toplam Net:</span>
              <span>{totalNet.toFixed(2)} TL</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Toplam KDV:</span>
              <span data-testid="total-vat">{totalVAT.toFixed(2)} TL</span>
            </div>
            <div className="flex justify-between text-lg text-green-600">
              <span>GENEL TOPLAM:</span>
              <span data-testid="grand-total">{grandTotal.toFixed(2)} TL</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center text-sm">Sepette ürün yok</p>
      )}
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [categories, setCategories] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  // Müşterileri ve kategorileri yükle
  useEffect(() => {
    loadCustomers();
    loadCategories();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data.data);
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  const handleAddNewProduct = (barcode) => {
    setNewProductBarcode(barcode);
    setShowAddProduct(true);
    setSearchTerm('');
    setShowSuggestions(false);
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

  // Sepete ekleme (öneri veya arama sonucundan)
  const addToCart = async (product) => {
    // Eğer tam ürün bilgileri yoksa (öneri listesinden geliyorsa) detayları al
    let fullProduct = product;
    if (!product.vat_rate) {
      try {
        const response = await axios.get(`${API}/products/${product.id}`);
        fullProduct = response.data.data;
      } catch (error) {
        console.error('Ürün detayları alınamadı:', error);
        return;
      }
    }

    const existingItem = cart.find(item => item.id === fullProduct.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === fullProduct.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.sale_price }
          : item
      ));
    } else {
      setCart([...cart, { 
        ...fullProduct, 
        quantity: 1, 
        total: fullProduct.sale_price 
      }]);
    }
    
    setSearchTerm('');
    setSearchResults([]);
    setShowSuggestions(false);
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

  // Satışı tamamlama
  const completeSale = async () => {
    if (cart.length === 0) {
      alert('Sepet boş!');
      return;
    }

    // Nakit ödeme için para üstü kontrolü
    if (paymentMethod === 'cash' && changeAmount < 0) {
      alert(`Eksik ödeme! ${Math.abs(changeAmount).toFixed(2)} TL daha gerekli.`);
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
        // Satış verilerini hazırla
        const saleForReceipt = {
          id: response.data.data.id,
          total_amount: calculateTotal(),
          payment_method: paymentMethod,
          customer_name: selectedCustomer?.name || null,
          items: cart.map(item => ({
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.sale_price,
            total: item.total,
            vat_rate: item.vat_rate
          }))
        };
        
        setCompletedSale(saleForReceipt);
        setShowReceipt(true);
        
        // Sepeti temizle
        setCart([]);
        setSelectedCustomer(null);
        setPaymentMethod('cash');
        setReceivedAmount(0);
        setChangeAmount(0);
      }
    } catch (error) {
      console.error('Satış tamamlanamadı:', error);
      alert('Satış tamamlanamadı: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
        
        {/* Sol Panel: Ürün Arama ve Favori Ürünler */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ürün Arama */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🛒 Satış Ekranı</h2>
            
            {/* Arama Kutusu */}
            <div className="mb-6 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Ara (İsim veya Barkod)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                  searchProducts(e.target.value);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ürün adı veya barkod giriniz..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                data-testid="product-search-input"
              />
              
              {/* Arama Önerileri */}
              {showSuggestions && (
                <SearchSuggestions 
                  query={searchTerm}
                  onSelectProduct={addToCart}
                  onClose={() => setShowSuggestions(false)}
                  onAddNewProduct={handleAddNewProduct}
                />
              )}
            </div>

            {/* Arama Sonuçları */}
            {searchResults.length > 0 && (
              <div className="mb-6 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {searchResults.map(product => (
                  <div 
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors flex items-center space-x-3"
                    data-testid={`search-result-${product.id}`}
                  >
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400">📦</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.category_name} - Stok: {product.stock_quantity}</p>
                      {product.barcode && (
                        <p className="text-xs text-gray-500">Barkod: {product.barcode}</p>
                      )}
                      <p className="text-xs text-blue-600">KDV: %{product.vat_rate}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600">{product.sale_price.toFixed(2)} TL</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favori Ürünler */}
          <FavoriteProducts onAddToCart={addToCart} />
        </div>

        {/* Orta Panel: Sepet - Geniş Alan */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🛍️ Sepet</h3>
          
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Sepet boş</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {cart.map(item => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg cart-item">
                  {/* Üst kısım: Ürün adı ve toplam tutar */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 text-lg">{item.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.sale_price.toFixed(2)} TL/birim • KDV %{item.vat_rate}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-green-600">{item.total.toFixed(2)} TL</span>
                    </div>
                  </div>
                  
                  {/* Alt kısım: Miktar kontrolleri */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-9 h-9 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center font-bold"
                        data-testid={`decrease-quantity-${item.id}`}
                      >
                        −
                      </button>
                      
                      <div className="bg-white px-4 py-2 rounded-lg border-2 border-gray-200 min-w-[80px] text-center">
                        <span className="text-lg font-semibold text-gray-800">{item.quantity}</span>
                        <div className="text-xs text-gray-500">adet</div>
                      </div>
                      
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-9 h-9 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center font-bold"
                        data-testid={`increase-quantity-${item.id}`}
                      >
                        +
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                      data-testid={`remove-item-${item.id}`}
                    >
                      <span>🗑️</span>
                      <span className="text-sm font-medium">Kaldır</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* KDV Dökümü */}
          <VATSummary cart={cart} />
        </div>

        {/* Sağ Panel: Ödeme */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
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
                    <div className="text-sm font-semibold">{method.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Para Üstü Hesaplayıcı (Sadece nakit ödemede) */}
          {paymentMethod === 'cash' && cart.length > 0 && (
            <ChangeCalculator 
              total={calculateTotal()}
              onAmountChange={(amount, change) => {
                setReceivedAmount(amount);
                setChangeAmount(change);
              }}
            />
          )}

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
              <span data-testid="cart-total">{calculateTotal().toFixed(2)} TL</span>
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
      
      {/* Satış Fişi Dialog */}
      {showReceipt && completedSale && (
        <SalesReceipt 
          sale={completedSale}
          onClose={() => {
            setShowReceipt(false);
            setCompletedSale(null);
          }}
          onPrint={() => {
            setShowReceipt(false);
            setCompletedSale(null);
          }}
        />
      )}

      {/* Yeni Ürün Ekleme Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  📦 Yeni Ürün Ekle - Barkod: {newProductBarcode}
                </h3>
                <button
                  onClick={() => {
                    setShowAddProduct(false);
                    setNewProductBarcode('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <ProductForm
                product={null}
                categories={categories}
                initialBarcode={newProductBarcode}
                onSave={() => {
                  setShowAddProduct(false);
                  setNewProductBarcode('');
                  // Yeni eklenen ürünü otomatik ara
                  setTimeout(() => {
                    setSearchTerm(newProductBarcode);
                    searchProducts(newProductBarcode);
                  }, 500);
                }}
                onCancel={() => {
                  setShowAddProduct(false);
                  setNewProductBarcode('');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Kategori Yönetimi Komponenti
function CategoryManagement({ categories, onCategoriesChange }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);

  const addCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Kategori adı gerekli!');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API}/categories`, newCategory);
      if (response.data.success) {
        onCategoriesChange();
        setNewCategory({ name: '', description: '' });
        setShowAddForm(false);
        alert('Kategori eklendi!');
      }
    } catch (error) {
      console.error('Kategori eklenemedi:', error);
      alert('Kategori eklenemedi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`"${categoryName}" kategorisini silmek istediğinizden emin misiniz?`)) {
      try {
        await axios.delete(`${API}/categories/${categoryId}`);
        onCategoriesChange();
        alert('Kategori silindi!');
      } catch (error) {
        console.error('Kategori silinemedi:', error);
        alert('Kategori silinemedi: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">📂 Kategoriler</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          data-testid="add-category-button"
        >
          {showAddForm ? '❌ İptal' : '➕ Kategori Ekle'}
        </button>
      </div>

      {/* Kategori Ekleme Formu */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Kategori adı..."
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="category-name-input"
            />
            <input
              type="text"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="Açıklama (opsiyonel)..."
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="category-description-input"
            />
          </div>
          <button
            onClick={addCategory}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
            data-testid="save-category-button"
          >
            {isLoading ? 'Kaydediliyor...' : '💾 Kaydet'}
          </button>
        </div>
      )}

      {/* Kategori Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map(category => (
          <div key={category.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{category.name}</h4>
                {category.description && (
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                )}
              </div>
              <button
                onClick={() => deleteCategory(category.id, category.name)}
                className="text-red-500 hover:text-red-700 ml-2"
                data-testid={`delete-category-${category.id}`}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="text-gray-500 text-center py-8">Henüz kategori eklenmemiş</p>
      )}
    </div>
  );
}

// Ürün Ekleme/Düzenleme Formu
function ProductForm({ product = null, categories, initialBarcode = '', onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    barcode: product?.barcode || initialBarcode,
    category_id: product?.category_id || '',
    purchase_price: product?.purchase_price || 0,
    sale_price: product?.sale_price || 0,
    stock_quantity: product?.stock_quantity || 0,
    min_stock_level: product?.min_stock_level || 0,
    unit: product?.unit || 'adet',
    description: product?.description || '',
    vat_rate: product?.vat_rate || 20,
    image_url: product?.image_url || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.sale_price) {
      alert('Ürün adı ve satış fiyatı gerekli!');
      return;
    }

    try {
      setIsLoading(true);
      let response;
      
      if (product) {
        // Güncelleme
        response = await axios.put(`${API}/products/${product.id}`, formData);
      } else {
        // Yeni ekleme
        response = await axios.post(`${API}/products`, formData);
      }

      if (response.data.success) {
        onSave();
        alert(product ? 'Ürün güncellendi!' : 'Ürün eklendi!');
      }
    } catch (error) {
      console.error('Ürün kaydedilemedi:', error);
      alert('Ürün kaydedilemedi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {product ? '✏️ Ürün Düzenle' : '➕ Yeni Ürün Ekle'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ürün Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ürün Adı *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              data-testid="product-name-input"
            />
          </div>

          {/* Barkod */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barkod
            </label>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="product-barcode-input"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="product-category-select"
            >
              <option value="">Kategori seçiniz...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Birim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birim
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="adet">Adet</option>
              <option value="kg">Kilogram</option>
              <option value="lt">Litre</option>
              <option value="m">Metre</option>
              <option value="kutu">Kutu</option>
            </select>
          </div>

          {/* Alış Fiyatı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alış Fiyatı (TL)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Satış Fiyatı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Satış Fiyatı (TL) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.sale_price}
              onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Stok Miktarı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stok Miktarı
            </label>
            <input
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Minimum Stok */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Stok Seviyesi
            </label>
            <input
              type="number"
              value={formData.min_stock_level}
              onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* KDV Oranı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              KDV Oranı (%)
            </label>
            <select
              value={formData.vat_rate}
              onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>%0</option>
              <option value={1}>%1</option>
              <option value={8}>%8</option>
              <option value={20}>%20</option>
            </select>
          </div>

          {/* Ürün Resmi URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ürün Resmi URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Açıklama */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Açıklama
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Butonlar */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
            data-testid="save-product-button"
          >
            {isLoading ? 'Kaydediliyor...' : '💾 Kaydet'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            data-testid="cancel-product-button"
          >
            ❌ İptal
          </button>
        </div>
      </form>
    </div>
  );
}

// Ana Ürün Yönetimi Komponenti
function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API}/products`);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Ürünler yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data.data);
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error);
    }
  };

  const deleteProduct = async (productId, productName) => {
    if (window.confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) {
      try {
        await axios.delete(`${API}/products/${productId}`);
        loadProducts();
        alert('Ürün silindi!');
      } catch (error) {
        console.error('Ürün silinemedi:', error);
        alert('Ürün silinemedi: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const toggleFavorite = async (productId) => {
    try {
      await axios.put(`${API}/products/${productId}/favorite`);
      loadProducts();
    } catch (error) {
      console.error('Favori durumu güncellenemedi:', error);
    }
  };

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(product => {
    const matchesCategory = !filterCategory || product.category_id === filterCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  // Form işlemleri
  const handleFormSave = () => {
    loadProducts();
    setShowAddForm(false);
    setEditingProduct(null);
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">📦 Ürün Yönetimi</h2>

        {/* Kategori Yönetimi */}
        <CategoryManagement 
          categories={categories} 
          onCategoriesChange={loadCategories}
        />

        {/* Ürün Formu */}
        {(showAddForm || editingProduct) && (
          <div className="mb-6">
            <ProductForm
              product={editingProduct}
              categories={categories}
              onSave={handleFormSave}
              onCancel={handleFormCancel}
            />
          </div>
        )}

        {/* Ürün Listesi Kontrolleri */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800">📋 Ürün Listesi ({filteredProducts.length})</h3>
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              {/* Arama */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün ara..."
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="product-search"
              />
              
              {/* Kategori Filtresi */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="category-filter"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              
              {/* Yeni Ürün Butonu */}
              <button
                onClick={() => setShowAddForm(true)}
                disabled={showAddForm || editingProduct}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors whitespace-nowrap"
                data-testid="add-product-button"
              >
                ➕ Yeni Ürün
              </button>
            </div>
          </div>

          {/* Ürün Tablosu */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="loading-spinner inline-block"></div>
              <span className="ml-2 text-gray-500">Ürünler yükleniyor...</span>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resim</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün Adı</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barkod</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KDV</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">📦</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.unit}</div>
                          </div>
                          {product.is_favorite && (
                            <span className="ml-2 text-yellow-500">⭐</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category_name || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.barcode || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.sale_price.toFixed(2)} TL</div>
                        <div className="text-xs text-gray-500">Alış: {product.purchase_price.toFixed(2)} TL</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          product.stock_quantity <= product.min_stock_level 
                            ? 'text-red-600 font-medium' 
                            : 'text-gray-900'
                        }`}>
                          {product.stock_quantity}
                          {product.stock_quantity <= product.min_stock_level && ' ⚠️'}
                        </div>
                        <div className="text-xs text-gray-500">Min: {product.min_stock_level}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        %{product.vat_rate}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => toggleFavorite(product.id)}
                          className={`${
                            product.is_favorite ? 'text-yellow-500' : 'text-gray-400'
                          } hover:text-yellow-600`}
                          title={product.is_favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                          data-testid={`favorite-toggle-${product.id}`}
                        >
                          ⭐
                        </button>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                          data-testid={`edit-product-${product.id}`}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id, product.name)}
                          className="text-red-600 hover:text-red-900"
                          data-testid={`delete-product-${product.id}`}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm || filterCategory ? 'Filtreye uygun ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Müşteri Detay ve Cari Hesap Komponenti
function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newTransaction, setNewTransaction] = useState({
    transaction_type: 'manual_debt',
    amount: '',
    description: ''
  });
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tax_number: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerDetail = async (customerId) => {
    try {
      setIsLoading(true);
      const [customerResponse, transactionsResponse] = await Promise.all([
        axios.get(`${API}/customers/${customerId}`),
        axios.get(`${API}/customers/${customerId}/transactions`)
      ]);
      
      setSelectedCustomer(customerResponse.data.data);
      setTransactions(transactionsResponse.data.data);
    } catch (error) {
      console.error('Müşteri detayları yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async () => {
    if (!selectedCustomer || !newTransaction.amount) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API}/customers/${selectedCustomer.customer.id}/transactions`,
        {
          ...newTransaction,
          amount: parseFloat(newTransaction.amount)
        }
      );
      
      if (response.data.success) {
        setNewTransaction({ transaction_type: 'manual_debt', amount: '', description: '' });
        setShowAddTransaction(false);
        loadCustomerDetail(selectedCustomer.customer.id);
        loadCustomers(); // Bakiye güncellemesi için
        alert('Hareket başarıyla eklendi!');
      }
    } catch (error) {
      console.error('Hareket eklenemedi:', error);
      alert('Hareket eklenemedi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (transactionId, description) => {
    const confirmMsg = `"${description || 'Bu hareket'}" kaydını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve müşteri bakiyesi güncellenecektir.`;
    
    if (window.confirm(confirmMsg)) {
      try {
        setIsLoading(true);
        await axios.delete(`${API}/customers/${selectedCustomer.customer.id}/transactions/${transactionId}`);
        loadCustomerDetail(selectedCustomer.customer.id);
        loadCustomers();
        alert('Hareket başarıyla silindi!');
      } catch (error) {
        console.error('Hareket silinemedi:', error);
        alert('Hareket silinemedi: ' + (error.response?.data?.detail || error.message));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const addCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert('Müşteri adı gerekli!');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API}/customers`, newCustomer);
      if (response.data.success) {
        setNewCustomer({ name: '', phone: '', email: '', address: '', tax_number: '' });
        setShowAddCustomer(false);
        loadCustomers();
        alert('Müşteri başarıyla eklendi!');
      }
    } catch (error) {
      console.error('Müşteri eklenemedi:', error);
      alert('Müşteri eklenemedi: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCustomer = async (customerId, customerName) => {
    const confirmMsg = `"${customerName}" müşterisini silmek istediğinizden emin misiniz?\n\nBu işlem tüm cari hesap hareketlerini de silecektir ve geri alınamaz.`;
    
    if (window.confirm(confirmMsg)) {
      try {
        setIsLoading(true);
        await axios.delete(`${API}/customers/${customerId}`);
        loadCustomers();
        alert('Müşteri başarıyla silindi!');
      } catch (error) {
        console.error('Müşteri silinemedi:', error);
        alert('Müşteri silinemedi: ' + (error.response?.data?.detail || error.message));
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Filtrelenmiş müşteri listesi
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));
    
    const matchesFilter = filterPriority === 'all' || 
      (filterPriority === 'debt' && customer.balance > 0) ||
      (filterPriority === 'credit' && customer.balance < 0) ||
      (filterPriority === 'zero' && customer.balance === 0);
    
    return matchesSearch && matchesFilter;
  })
  
  // Öncelik sıralama: Borçlular önce, sonra bakiyeye göre
  .sort((a, b) => {
    if (filterPriority === 'debt') return b.balance - a.balance; // Yüksek borç önce
    if (filterPriority === 'credit') return a.balance - b.balance; // Yüksek alacak önce
    return a.name.localeCompare(b.name); // Alfabetik
  });

  const formatTransactionType = (type) => {
    const types = {
      'manual_debt': '📝 Manuel Borç',
      'debt': '💰 Borç',
      'payment': '✅ Ödeme',
      'sale': '🛒 Satış'
    };
    return types[type] || type;
  };

  const printCustomerStatement = (customer, transactions) => {
    const totalDebt = transactions
      .filter(t => ['debt', 'manual_debt', 'sale'].includes(t.transaction_type))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalPayments = transactions
      .filter(t => t.transaction_type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cari Hesap Ekstresi</title>
        <style>
          @media print {
            @page { size: A4; margin: 15mm; }
            body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; margin: 0; }
          }
          body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; margin: 0; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 18px; font-weight: bold; color: #1e40af; }
          .document-title { font-size: 14px; margin: 10px 0; }
          .info-section { margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f5f5f5; font-weight: bold; }
          .amount-positive { color: #dc2626; font-weight: bold; }
          .amount-negative { color: #16a34a; font-weight: bold; }
          .summary { margin-top: 30px; }
          .summary-item { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px; background: #f9f9f9; }
          .total-row { font-size: 14px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">ELİTE MEDYA BİLİŞİM</div>
          <div>www.elitmedyabilisim.shop</div>
          <div class="document-title">CARİ HESAP EKSTRESİ</div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <strong>Müşteri:</strong>
            <span>${customer.name}</span>
          </div>
          ${customer.phone ? `
          <div class="info-row">
            <strong>Telefon:</strong>
            <span>${customer.phone}</span>
          </div>` : ''}
          ${customer.email ? `
          <div class="info-row">
            <strong>E-posta:</strong>
            <span>${customer.email}</span>
          </div>` : ''}
          <div class="info-row">
            <strong>Ekstre Tarihi:</strong>
            <span>${new Date().toLocaleDateString('tr-TR')} - ${new Date().toLocaleTimeString('tr-TR')}</span>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>İşlem Tipi</th>
              <th>Açıklama</th>
              <th>Borç</th>
              <th>Alacak</th>
              <th>Bakiye</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map((t, index) => {
              const isDebit = ['debt', 'manual_debt', 'sale'].includes(t.transaction_type);
              const runningBalance = transactions
                .slice(0, index + 1)
                .reduce((bal, tr) => {
                  return bal + (['debt', 'manual_debt', 'sale'].includes(tr.transaction_type) ? tr.amount : -tr.amount);
                }, 0);
              
              return `
                <tr>
                  <td>${new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                  <td>${formatTransactionType(t.transaction_type)}</td>
                  <td>${t.description || '-'}</td>
                  <td class="amount-positive">${isDebit ? t.amount.toFixed(2) + ' TL' : '-'}</td>
                  <td class="amount-negative">${!isDebit ? t.amount.toFixed(2) + ' TL' : '-'}</td>
                  <td>${runningBalance.toFixed(2)} TL</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-item">
            <strong>Toplam Borç:</strong>
            <span class="amount-positive">${totalDebt.toFixed(2)} TL</span>
          </div>
          <div class="summary-item">
            <strong>Toplam Ödeme:</strong>
            <span class="amount-negative">${totalPayments.toFixed(2)} TL</span>
          </div>
          <div class="summary-item total-row">
            <strong>GÜNCEL BAKİYE:</strong>
            <span class="${customer.balance >= 0 ? 'amount-positive' : 'amount-negative'}">
              ${customer.balance.toFixed(2)} TL ${customer.balance >= 0 ? '(BORÇLU)' : '(ALACAKLI)'}
            </span>
          </div>
        </div>

        <div class="footer">
          <p>Bu ekstre ${new Date().toLocaleDateString('tr-TR')} tarihinde Elite Medya POS sistemi tarafından oluşturulmuştur.</p>
          <p>Herhangi bir sorunuz için: www.elitmedyabilisim.shop</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (!selectedCustomer) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <h2 className="text-3xl font-bold text-gray-800">👥 Müşteri ve Cari Hesap Yönetimi</h2>
            
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={() => setShowAddCustomer(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                data-testid="add-customer-button"
              >
                ➕ Yeni Müşteri
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Arama ve Filtreleme */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Müşteri Ara
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ad, telefon ile ara..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  data-testid="customer-search"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum Filtresi
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  data-testid="customer-filter"
                >
                  <option value="all">Tüm Müşteriler ({customers.length})</option>
                  <option value="debt">Borçlu Müşteriler ({customers.filter(c => c.balance > 0).length})</option>
                  <option value="credit">Alacaklı Müşteriler ({customers.filter(c => c.balance < 0).length})</option>
                  <option value="zero">Sıfır Bakiye ({customers.filter(c => c.balance === 0).length})</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <div>Toplam: {filteredCustomers.length} müşteri</div>
                  <div>Toplam Borç: {customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0).toFixed(2)} TL</div>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Müşteri Listesi</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner inline-block"></div>
                <span className="ml-2 text-gray-500">Müşteriler yükleniyor...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map(customer => (
                  <div 
                    key={customer.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
                    data-testid={`customer-card-${customer.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div 
                        onClick={() => loadCustomerDetail(customer.id)}
                        className="flex-1 cursor-pointer"
                      >
                        <h4 className="font-semibold text-gray-800">{customer.name}</h4>
                        {customer.phone && (
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <span className={`text-lg font-bold ${
                            customer.balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {customer.balance.toFixed(2)} TL
                          </span>
                          <div className="text-xs text-gray-500">
                            {customer.balance > 0 ? 'Borç' : customer.balance < 0 ? 'Alacak' : 'Sıfır'}
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCustomer(customer);
                              setNewCustomer(customer);
                            }}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                            title="Müşteri düzenle"
                            data-testid={`edit-customer-${customer.id}`}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCustomer(customer.id, customer.name);
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Müşteri sil"
                            data-testid={`delete-customer-${customer.id}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredCustomers.length === 0 && !isLoading && (
              <p className="text-gray-500 text-center py-8">
                {searchTerm || filterPriority !== 'all' ? 'Filtreye uygun müşteri bulunamadı' : 'Henüz müşteri kaydı yok'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Müşteri detay sayfası
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ← Geri
            </button>
            <h2 className="text-3xl font-bold text-gray-800">
              {selectedCustomer.customer.name} - Cari Hesap
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setNewTransaction({ transaction_type: 'manual_debt', amount: '', description: '' });
                setShowAddTransaction(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="add-debt-button"
            >
              📝 Manuel Borç Ekle
            </button>
            <button
              onClick={() => {
                setNewTransaction({ transaction_type: 'payment', amount: '', description: '' });
                setShowAddTransaction(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              data-testid="add-payment-button"
            >
              💵 Tahsilat Yap
            </button>
            <button
              onClick={() => printCustomerStatement(selectedCustomer.customer, transactions)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              data-testid="print-statement-button"
            >
              🖨️ A4 Ekstre Yazdır
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Müşteri Bilgileri */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Müşteri Bilgileri</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Ad Soyad:</span>
                <p className="font-medium">{selectedCustomer.customer.name}</p>
              </div>
              {selectedCustomer.customer.phone && (
                <div>
                  <span className="text-sm text-gray-600">Telefon:</span>
                  <p className="font-medium">{selectedCustomer.customer.phone}</p>
                </div>
              )}
              {selectedCustomer.customer.email && (
                <div>
                  <span className="text-sm text-gray-600">E-posta:</span>
                  <p className="font-medium">{selectedCustomer.customer.email}</p>
                </div>
              )}
              <div className="border-t pt-3">
                <span className="text-sm text-gray-600">Mevcut Bakiye:</span>
                <p className={`text-2xl font-bold ${
                  selectedCustomer.customer.balance > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {selectedCustomer.customer.balance.toFixed(2)} TL
                </p>
                <p className="text-sm text-gray-500">
                  {selectedCustomer.customer.balance > 0 ? 'Borçlu' : 'Alacaklı'}
                </p>
              </div>
            </div>
          </div>

          {/* Hareket Geçmişi */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Hareket Geçmişi</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner inline-block"></div>
                <span className="ml-2 text-gray-500">Hareketler yükleniyor...</span>
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map(transaction => (
                  <div key={transaction.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {formatTransactionType(transaction.transaction_type)}
                          </span>
                          <span className={`text-lg font-bold ${
                            ['debt', 'manual_debt', 'sale'].includes(transaction.transaction_type) 
                              ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {['debt', 'manual_debt', 'sale'].includes(transaction.transaction_type) ? '+' : '-'}
                            {transaction.amount.toFixed(2)} TL
                          </span>
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(transaction.created_at).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      
                      {/* Manuel borç ve ödeme kayıtları silinebilir */}
                      {['manual_debt', 'payment'].includes(transaction.transaction_type) && (
                        <button
                          onClick={() => deleteTransaction(transaction.id, transaction.description)}
                          className="ml-3 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hareketi sil"
                          data-testid={`delete-transaction-${transaction.id}`}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Henüz hareket kaydı yok</p>
            )}
          </div>
        </div>

        {/* Müşteri Ekleme/Düzenleme Modal */}
        {(showAddCustomer || editingCustomer) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {editingCustomer ? '✏️ Müşteri Düzenle' : '➕ Yeni Müşteri Ekle'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Müşteri Adı *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Müşteri adı..."
                      data-testid="customer-name-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="text"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0555 123 45 67"
                      data-testid="customer-phone-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="ornek@email.com"
                      data-testid="customer-email-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adres
                    </label>
                    <textarea
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Müşteri adresi..."
                      data-testid="customer-address-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vergi No
                    </label>
                    <input
                      type="text"
                      value={newCustomer.tax_number}
                      onChange={(e) => setNewCustomer({...newCustomer, tax_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1234567890"
                      data-testid="customer-tax-input"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={() => {
                      setShowAddCustomer(false);
                      setEditingCustomer(null);
                      setNewCustomer({ name: '', phone: '', email: '', address: '', tax_number: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    İptal
                  </button>
                  <button
                    onClick={addCustomer}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                    data-testid="save-customer-button"
                  >
                    {isLoading ? 'Kaydediliyor...' : editingCustomer ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manuel Borç Ekleme Modal */}
        {showAddTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {newTransaction.transaction_type === 'payment' ? '💵 Tahsilat Yap' : '📝 Manuel Borç Ekle'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hareket Tipi
                    </label>
                    <select
                      value={newTransaction.transaction_type}
                      onChange={(e) => setNewTransaction({...newTransaction, transaction_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manual_debt">📝 Manuel Borç</option>
                      <option value="payment">✅ Ödeme</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tutar (TL)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      data-testid="transaction-amount-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <textarea
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="İşlem açıklaması..."
                      data-testid="transaction-description-input"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={() => setShowAddTransaction(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    İptal
                  </button>
                  <button
                    onClick={addTransaction}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                    data-testid="save-transaction-button"
                  >
                    {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
      case 'customers':
        return <CustomerManagement />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Geliştirilecek...</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Bu bölüm geliştirilecek...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App bg-gray-100 min-h-screen">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="ml-64 transition-all duration-300">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;