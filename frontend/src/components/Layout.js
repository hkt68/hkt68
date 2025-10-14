import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Warehouse, 
  Users, 
  FileText, 
  Settings, 
  Barcode,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import TopBar from '@/components/TopBar';

function Layout({ user, onLogout, children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
    { path: '/pos', icon: ShoppingCart, label: 'Satış (POS)', permission: 'pos' },
    { path: '/sales-history', icon: FileText, label: 'Satış Geçmişi', permission: 'sales-history' },
    { path: '/products', icon: Package, label: 'Ürünler', permission: 'products' },
    { path: '/stock', icon: Warehouse, label: 'Stok', permission: 'stock' },
    { path: '/customers', icon: Users, label: 'Cari Müşteri', permission: 'customers' },
    { path: '/reports', icon: FileText, label: 'Raporlama', permission: 'reports' },
    { path: '/price-check', icon: Barcode, label: 'Fiyat Gör', permission: 'price-check' },
    { path: '/settings', icon: Settings, label: 'Ayarlar', permission: 'settings' }
  ];

  const hasPermission = (permission) => {
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  };

  const filteredMenu = menuItems.filter(item => hasPermission(item.permission));

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>POS Sistemi</h2>
          <button className="close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                data-testid={`nav-${item.permission}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="user-name">{user.full_name}</div>
              <div className="user-role">{user.role === 'admin' ? 'Admin' : 'Kullanıcı'}</div>
            </div>
          </div>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={onLogout}
            data-testid="logout-button"
            style={{ width: '100%' }}
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="top-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1>{filteredMenu.find(item => item.path === location.pathname)?.label || 'Dashboard'}</h1>
        </header>

        <main className="content">
          {children}
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <style jsx>{`
        .layout {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 280px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 100;
          transition: transform 0.3s;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary);
        }

        .close-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          margin-bottom: 0.25rem;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--primary);
          color: white;
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .user-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
        }

        .top-header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          padding: 1.25rem 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.5rem;
        }

        .top-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .content {
          padding: 2rem;
        }

        .sidebar-overlay {
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .close-btn {
            display: block;
          }

          .main-content {
            margin-left: 0;
          }

          .menu-btn {
            display: block;
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 99;
          }

          .content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
