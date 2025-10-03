import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import components
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Categories from './components/Categories';
import Sales from './components/Sales';
import StockTransactions from './components/StockTransactions';
import Reports from './components/Reports';
import Alerts from './components/Alerts';
import Customers from './components/Customers';
import Backup from './components/Backup';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.baseURL = API;

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('/alerts?resolved=false');
        setAlertCount(response.data.length);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };
    fetchAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Ürünler', icon: '📦' },
    { path: '/categories', label: 'Kategoriler', icon: '🏷️' },
    { path: '/customers', label: 'Cari Hesaplar', icon: '👥' },
    { path: '/sales', label: 'Satışlar', icon: '💰' },
    { path: '/stock', label: 'Stok İşlemleri', icon: '📋' },
    { path: '/reports', label: 'Raporlar', icon: '📈' },
    { path: '/alerts', label: `Uyarılar ${alertCount > 0 ? `(${alertCount})` : ''}`, icon: '🚨' }
  ];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">📦 Stok & Satış Yönetimi</h1>
          <div className="text-sm text-gray-300">
            {new Date().toLocaleDateString('tr-TR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

// Main Layout Component
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="customers" element={<Customers />} />
                <Route path="sales" element={<Sales />} />
                <Route path="stock" element={<StockTransactions />} />
                <Route path="reports" element={<Reports />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="backup" element={<Backup />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;