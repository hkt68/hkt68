// Management Dashboard Page - Elite Medya Bilişim POS
// Main admin interface for business management

import { getCurrentUserInfo, requirePermission } from 'backend/auth';
import { 
  getDashboardMetrics,
  checkSystemHealth,
  formatCurrency,
  formatDate 
} from 'backend/data-adaptor';

// Page elements
$w.onReady(function () {
  initializeDashboard();
});

// Initialize dashboard
async function initializeDashboard() {
  try {
    // Show loading state
    showLoadingState();
    
    // Verify user authentication and permissions
    const userInfo = await getCurrentUserInfo();
    if (!userInfo.success) {
      redirectToLogin();
      return;
    }
    
    // Check admin access
    await requirePermission(userInfo.user.id, 'ADMIN_ACCESS');
    
    // Update user welcome message
    $w('#welcomeText').text = `Hoşgeldiniz, ${userInfo.user.email}`;
    
    // Load dashboard data
    await loadDashboardData();
    
    // Setup navigation
    setupNavigation();
    
    // Setup real-time updates
    setupRealTimeUpdates();
    
    // Hide loading state
    hideLoadingState();
    
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showError('Yönetim paneli yüklenirken hata oluştu: ' + error.message);
  }
}

// Load dashboard metrics
async function loadDashboardData() {
  try {
    // Check system health first
    const healthCheck = await checkSystemHealth();
    if (!healthCheck.success) {
      showWarning('Sistem bağlantısında sorun var');
      return;
    }
    
    // Load dashboard metrics
    const metricsResponse = await getDashboardMetrics();
    if (metricsResponse.success) {
      updateDashboardMetrics(metricsResponse.data);
    } else {
      throw new Error('Dashboard verileri alınamadı');
    }
    
  } catch (error) {
    console.error('Dashboard data loading error:', error);
    showError('Dashboard verileri yüklenirken hata: ' + error.message);
  }
}

// Update dashboard metrics display
function updateDashboardMetrics(metrics) {
  try {
    // Update sales metrics
    if (metrics.sales) {
      $w('#todaySales').text = formatCurrency(metrics.sales.todayTotal || 0);
      $w('#todayTransactions').text = (metrics.sales.todayCount || 0).toString();
      $w('#averageTransaction').text = formatCurrency(metrics.sales.averageAmount || 0);
      
      // Update sales chart if available
      if (metrics.sales.hourlyData) {
        updateSalesChart(metrics.sales.hourlyData);
      }
    }
    
    // Update inventory metrics
    if (metrics.inventory) {
      $w('#totalProducts').text = (metrics.inventory.totalProducts || 0).toString();
      $w('#lowStockAlerts').text = (metrics.inventory.lowStockCount || 0).toString();
      $w('#outOfStock').text = (metrics.inventory.outOfStockCount || 0).toString();
      
      // Show/hide low stock warning
      if (metrics.inventory.lowStockCount > 0) {
        $w('#lowStockWarning').show();
        $w('#lowStockWarning').text = `${metrics.inventory.lowStockCount} ürün stoku azalıyor!`;
      } else {
        $w('#lowStockWarning').hide();
      }
    }
    
    // Update customer metrics
    if (metrics.customers) {
      $w('#totalCustomers').text = (metrics.customers.totalCount || 0).toString();
      $w('#activeCustomers').text = (metrics.customers.activeCount || 0).toString();
      $w('#totalDebt').text = formatCurrency(metrics.customers.totalDebt || 0);
      $w('#overdueDebt').text = formatCurrency(metrics.customers.overdueDebt || 0);
    }
    
    // Update last refresh time
    $w('#lastUpdate').text = 'Son güncelleme: ' + formatDate(new Date());
    
  } catch (error) {
    console.error('Error updating dashboard metrics:', error);
  }
}

// Setup navigation
function setupNavigation() {
  // POS System
  $w('#posBtn').onClick(() => {
    wixLocation.to('/yonetim/pos');
  });
  
  // Products Management
  $w('#productsBtn').onClick(() => {
    wixLocation.to('/yonetim/products');
  });
  
  // Inventory Management
  $w('#inventoryBtn').onClick(() => {
    wixLocation.to('/yonetim/inventory');
  });
  
  // Customer Management
  $w('#customersBtn').onClick(() => {
    wixLocation.to('/yonetim/customers');
  });
  
  // Sales Reports
  $w('#reportsBtn').onClick(() => {
    wixLocation.to('/yonetim/reports');
  });
  
  // Settings
  $w('#settingsBtn').onClick(() => {
    wixLocation.to('/yonetim/settings');
  });
  
  // Refresh button
  $w('#refreshBtn').onClick(() => {
    loadDashboardData();
  });
  
  // Logout button
  $w('#logoutBtn').onClick(async () => {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      try {
        await handleLogout();
        wixLocation.to('/');
      } catch (error) {
        showError('Çıkış yapılırken hata oluştu');
      }
    }
  });
}

// Setup real-time updates
function setupRealTimeUpdates() {
  // Refresh dashboard data every 30 seconds
  setInterval(() => {
    loadDashboardData();
  }, 30000);
}

// Update sales chart
function updateSalesChart(hourlyData) {
  // This would integrate with Wix's chart elements
  // For now, we'll just log the data
  console.log('Sales chart data:', hourlyData);
}

// Utility functions
function showLoadingState() {
  $w('#loadingSpinner').show();
  $w('#dashboardContent').hide();
}

function hideLoadingState() {
  $w('#loadingSpinner').hide();
  $w('#dashboardContent').show();
}

function showError(message) {
  $w('#errorMessage').text = message;
  $w('#errorMessage').show();
  
  // Hide error after 5 seconds
  setTimeout(() => {
    $w('#errorMessage').hide();
  }, 5000);
}

function showWarning(message) {
  $w('#warningMessage').text = message;
  $w('#warningMessage').show();
  
  // Hide warning after 3 seconds
  setTimeout(() => {
    $w('#warningMessage').hide();
  }, 3000);
}

function showSuccess(message) {
  $w('#successMessage').text = message;
  $w('#successMessage').show();
  
  // Hide success after 3 seconds
  setTimeout(() => {
    $w('#successMessage').hide();
  }, 3000);
}

function redirectToLogin() {
  wixLocation.to('/login');
}

// Export functions for use in other pages
export {
  showError,
  showWarning,
  showSuccess,
  formatCurrency,
  formatDate
};