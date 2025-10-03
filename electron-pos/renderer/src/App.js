import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Sales from './components/Sales';
import Products from './components/Products';
import Reports from './components/Reports';
import Backup from './components/Backup';

// Electron API check
const isElectron = () => {
  return window.electronAPI !== undefined;
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [appInfo, setAppInfo] = useState(null);

  useEffect(() => {
    // Get app info if in Electron
    if (isElectron()) {
      window.electronAPI.getAppInfo().then(info => {
        setAppInfo(info);
        console.log('Elite Medya POS Desktop:', info);
      });

      // Listen for navigation events from main process
      window.electronAPI.onNavigate((event, route) => {
        setCurrentPage(route.replace('/', '') || 'dashboard');
      });

      // Listen for action events from main process
      window.electronAPI.onAction((event, action) => {
        console.log('Action received:', action);
        handleMainProcessAction(action);
      });

      // Cleanup listeners on unmount
      return () => {
        window.electronAPI.removeAllListeners('navigate-to');
        window.electronAPI.removeAllListeners('action');
      };
    }
  }, []);

  const handleMainProcessAction = (action) => {
    switch (action) {
      case 'new-customer':
        setCurrentPage('customers');
        // Trigger new customer modal if component supports it
        break;
      case 'daily-report':
        setCurrentPage('reports');
        break;
      case 'debt-report':
        setCurrentPage('reports');
        break;
      case 'stock-report':
        setCurrentPage('reports');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <Customers />;
      case 'sales':
        return <Sales />;
      case 'products':
        return <Products />;
      case 'reports':
        return <Reports />;
      case 'backup':
        return <Backup />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      {/* App Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">
              <span className="icon">🏪</span>
              Elite Medya POS
            </h1>
            {appInfo && (
              <span className="version-badge">
                Desktop v{appInfo.version}
              </span>
            )}
          </div>
          
          {isElectron() && (
            <div className="electron-info">
              <span className="platform-badge">
                {appInfo?.platform === 'win32' ? '🪟 Windows' : 
                 appInfo?.platform === 'darwin' ? '🍎 macOS' : 
                 '🐧 Linux'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Application */}
      <div className="app-body">
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={handlePageChange}
          isElectron={isElectron()}
        />
        
        <main className="main-content">
          <div className="content-wrapper">
            {renderCurrentPage()}
          </div>
        </main>
      </div>

      {/* Status Bar */}
      {isElectron() && (
        <footer className="status-bar">
          <div className="status-left">
            <span className="status-item">
              ⚡ Elite Medya POS Desktop
            </span>
          </div>
          <div className="status-right">
            <span className="status-item">
              📅 {new Date().toLocaleDateString('tr-TR')}
            </span>
            <span className="status-item">
              🕐 {new Date().toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;