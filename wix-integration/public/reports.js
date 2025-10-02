// Reports and Analytics Page - Elite Medya Bilişim
// Business intelligence and reporting dashboard

import { getCurrentUserInfo, requirePermission } from 'backend/auth';
import {
  generateSalesReport,
  getDashboardMetrics,
  getSales,
  formatCurrency,
  formatDate,
  logError
} from 'backend/data-adaptor';

// Global variables
let currentReportType = 'daily_sales';
let reportFilters = {
  start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
  end_date: new Date().toISOString().split('T')[0], // today
  customer_id: null,
  product_category: null
};

$w.onReady(function () {
  initializeReports();
});

// Initialize reports page
async function initializeReports() {
  try {
    // Verify permissions
    const userInfo = await getCurrentUserInfo();
    if (!userInfo.success) {
      wixLocation.to('/login');
      return;
    }
    
    await requirePermission(userInfo.user.id, 'VIEW_FINANCIAL_REPORTS');
    
    // Setup interface
    setupReportsInterface();
    
    // Load initial report
    await loadReport();
    
    console.log('Reports initialized');
    
  } catch (error) {
    console.error('Reports initialization error:', error);
    showError('Raporlar başlatılamadı: ' + error.message);
  }
}

// Setup reports interface
function setupReportsInterface() {
  // Report type selection
  $w('#reportTypeDropdown').onChange(handleReportTypeChange);
  
  // Date filters
  $w('#startDateInput').value = reportFilters.start_date;
  $w('#endDateInput').value = reportFilters.end_date;
  $w('#startDateInput').onChange(handleDateFilterChange);
  $w('#endDateInput').onChange(handleDateFilterChange);
  
  // Quick date filters
  $w('#todayBtn').onClick(() => setDateFilter('today'));
  $w('#thisWeekBtn').onClick(() => setDateFilter('this_week'));
  $w('#thisMonthBtn').onClick(() => setDateFilter('this_month'));
  $w('#lastMonthBtn').onClick(() => setDateFilter('last_month'));
  
  // Action buttons
  $w('#generateReportBtn').onClick(loadReport);
  $w('#exportReportBtn').onClick(exportReport);
  $w('#printReportBtn').onClick(printReport);
  
  // Navigation
  $w('#backToDashboard').onClick(() => {
    wixLocation.to('/yonetim/dashboard');
  });
}

// Handle report type change
function handleReportTypeChange() {
  currentReportType = $w('#reportTypeDropdown').value;
  loadReport();
}

// Handle date filter change
function handleDateFilterChange() {
  reportFilters.start_date = $w('#startDateInput').value;
  reportFilters.end_date = $w('#endDateInput').value;
  
  // Auto-generate if dates are valid
  if (reportFilters.start_date && reportFilters.end_date) {
    loadReport();
  }
}

// Set quick date filters
function setDateFilter(period) {
  const now = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'today':
      startDate = new Date(now);
      endDate = new Date(now);
      break;
      
    case 'this_week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startDate = startOfWeek;
      endDate = new Date(now);
      break;
      
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now);
      break;
      
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
  }
  
  reportFilters.start_date = startDate.toISOString().split('T')[0];
  reportFilters.end_date = endDate.toISOString().split('T')[0];
  
  $w('#startDateInput').value = reportFilters.start_date;
  $w('#endDateInput').value = reportFilters.end_date;
  
  loadReport();
}

// Load report based on current settings
async function loadReport() {
  try {
    showLoadingState(true);
    
    let reportData;
    
    switch (currentReportType) {
      case 'daily_sales':
        reportData = await generateDailySalesReport();
        break;
      case 'product_performance':
        reportData = await generateProductPerformanceReport();
        break;
      case 'customer_analysis':
        reportData = await generateCustomerAnalysisReport();
        break;
      case 'financial_summary':
        reportData = await generateFinancialSummaryReport();
        break;
      default:
        throw new Error('Bilinmeyen rapor tipi');
    }
    
    if (reportData && reportData.success) {
      displayReport(reportData.data);
    } else {
      throw new Error('Rapor oluşturulamadı');
    }
    
  } catch (error) {
    logError('loadReport', error);
    showError('Rapor yüklenirken hata: ' + error.message);
  } finally {
    showLoadingState(false);
  }
}

// Generate daily sales report
async function generateDailySalesReport() {
  try {
    const salesResponse = await getSales({
      start_date: reportFilters.start_date,
      end_date: reportFilters.end_date
    });
    
    if (!salesResponse.success) {
      throw new Error('Satış verileri alınamadı');
    }
    
    const sales = salesResponse.data;
    const dailyData = {};
    let totalSales = 0;
    let totalTransactions = 0;
    
    // Group sales by day
    sales.forEach(sale => {
      const dateKey = new Date(sale.created_at).toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          totalSales: 0,
          transactionCount: 0,
          averageTransaction: 0
        };
      }
      
      dailyData[dateKey].totalSales += sale.total_amount;
      dailyData[dateKey].transactionCount += 1;
      
      totalSales += sale.total_amount;
      totalTransactions += 1;
    });
    
    // Calculate averages
    Object.values(dailyData).forEach(day => {
      day.averageTransaction = day.transactionCount > 0 ? day.totalSales / day.transactionCount : 0;
    });
    
    return {
      success: true,
      data: {
        type: 'daily_sales',
        title: 'Günlük Satış Raporu',
        period: `${reportFilters.start_date} - ${reportFilters.end_date}`,
        summary: {
          totalSales: totalSales,
          totalTransactions: totalTransactions,
          averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
          dailyAverage: Object.keys(dailyData).length > 0 ? totalSales / Object.keys(dailyData).length : 0
        },
        dailyData: Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date))
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Generate product performance report
async function generateProductPerformanceReport() {
  try {
    const response = await generateSalesReport('PRODUCT_PERFORMANCE', reportFilters);
    
    if (response.success) {
      return {
        success: true,
        data: {
          type: 'product_performance',
          title: 'Ürün Performans Raporu',
          period: `${reportFilters.start_date} - ${reportFilters.end_date}`,
          ...response.data
        }
      };
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Generate customer analysis report
async function generateCustomerAnalysisReport() {
  try {
    const response = await generateSalesReport('CUSTOMER_ANALYSIS', reportFilters);
    
    if (response.success) {
      return {
        success: true,
        data: {
          type: 'customer_analysis',
          title: 'Müşteri Analiz Raporu',
          period: `${reportFilters.start_date} - ${reportFilters.end_date}`,
          ...response.data
        }
      };
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Generate financial summary report
async function generateFinancialSummaryReport() {
  try {
    const response = await generateSalesReport('PROFITABILITY', reportFilters);
    
    if (response.success) {
      return {
        success: true,
        data: {
          type: 'financial_summary',
          title: 'Finansal Özet Raporu',
          period: `${reportFilters.start_date} - ${reportFilters.end_date}`,
          ...response.data
        }
      };
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Display report
function displayReport(reportData) {
  $w('#reportTitle').text = reportData.title;
  $w('#reportPeriod').text = `Dönem: ${reportData.period}`;
  
  switch (reportData.type) {
    case 'daily_sales':
      displayDailySalesReport(reportData);
      break;
    case 'product_performance':
      displayProductPerformanceReport(reportData);
      break;
    case 'customer_analysis':
      displayCustomerAnalysisReport(reportData);
      break;
    case 'financial_summary':
      displayFinancialSummaryReport(reportData);
      break;
  }
}

// Display daily sales report
function displayDailySalesReport(data) {
  // Display summary cards
  $w('#summaryCards').html = `
    <div class="report-summary">
      <div class="summary-card">
        <div class="card-value">${formatCurrency(data.summary.totalSales)}</div>
        <div class="card-label">Toplam Satış</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${data.summary.totalTransactions}</div>
        <div class="card-label">Toplam İşlem</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${formatCurrency(data.summary.averageTransaction)}</div>
        <div class="card-label">Ortalama İşlem</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${formatCurrency(data.summary.dailyAverage)}</div>
        <div class="card-label">Günlük Ortalama</div>
      </div>
    </div>
  `;
  
  // Display daily data table
  if (data.dailyData.length > 0) {
    const tableHTML = `
      <table class="report-table">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Satış Tutarı</th>
            <th>İşlem Sayısı</th>
            <th>Ortalama İşlem</th>
          </tr>
        </thead>
        <tbody>
          ${data.dailyData.map(day => `
            <tr>
              <td>${formatDate(day.date)}</td>
              <td>${formatCurrency(day.totalSales)}</td>
              <td>${day.transactionCount}</td>
              <td>${formatCurrency(day.averageTransaction)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    $w('#reportContent').html = tableHTML;
  } else {
    $w('#reportContent').html = '<div class="no-data">Seçilen dönemde veri bulunamadı</div>';
  }
}

// Display product performance report
function displayProductPerformanceReport(data) {
  $w('#summaryCards').html = `
    <div class="report-summary">
      <div class="summary-card">
        <div class="card-value">${data.topProducts?.length || 0}</div>
        <div class="card-label">Satılan Ürün</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${formatCurrency(data.totalRevenue || 0)}</div>
        <div class="card-label">Toplam Gelir</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${data.totalQuantity || 0}</div>
        <div class="card-label">Satılan Adet</div>
      </div>
    </div>
  `;
  
  if (data.topProducts && data.topProducts.length > 0) {
    const tableHTML = `
      <table class="report-table">
        <thead>
          <tr>
            <th>Ürün Adı</th>
            <th>Satılan Adet</th>
            <th>Toplam Gelir</th>
            <th>Ortalama Fiyat</th>
          </tr>
        </thead>
        <tbody>
          ${data.topProducts.map(product => `
            <tr>
              <td>${product.name}</td>
              <td>${product.quantity}</td>
              <td>${formatCurrency(product.revenue)}</td>
              <td>${formatCurrency(product.averagePrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    $w('#reportContent').html = tableHTML;
  } else {
    $w('#reportContent').html = '<div class="no-data">Seçilen dönemde ürün satışı bulunamadı</div>';
  }
}

// Display customer analysis report
function displayCustomerAnalysisReport(data) {
  $w('#summaryCards').html = `
    <div class="report-summary">
      <div class="summary-card">
        <div class="card-value">${data.activeCustomers || 0}</div>
        <div class="card-label">Aktif Müşteri</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${formatCurrency(data.totalCustomerValue || 0)}</div>
        <div class="card-label">Toplam Müşteri Değeri</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${formatCurrency(data.averageCustomerValue || 0)}</div>
        <div class="card-label">Ortalama Müşteri Değeri</div>
      </div>
    </div>
  `;
  
  if (data.topCustomers && data.topCustomers.length > 0) {
    const tableHTML = `
      <table class="report-table">
        <thead>
          <tr>
            <th>Müşteri Adı</th>
            <th>Alışveriş Sayısı</th>
            <th>Toplam Harcama</th>
            <th>Ortalama İşlem</th>
          </tr>
        </thead>
        <tbody>
          ${data.topCustomers.map(customer => `
            <tr>
              <td>${customer.name}</td>
              <td>${customer.transactionCount}</td>
              <td>${formatCurrency(customer.totalSpent)}</td>
              <td>${formatCurrency(customer.averageTransaction)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    $w('#reportContent').html = tableHTML;
  } else {
    $w('#reportContent').html = '<div class="no-data">Seçilen dönemde müşteri verisi bulunamadı</div>';
  }
}

// Display financial summary report
function displayFinancialSummaryReport(data) {
  $w('#summaryCards').html = `
    <div class="report-summary">
      <div class="summary-card">
        <div class="card-value">${formatCurrency(data.totalRevenue || 0)}</div>
        <div class="card-label">Toplam Gelir</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${formatCurrency(data.totalCost || 0)}</div>
        <div class="card-label">Toplam Maliyet</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${formatCurrency(data.grossProfit || 0)}</div>
        <div class="card-label">Brüt Kar</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${((data.profitMargin || 0) * 100).toFixed(1)}%</div>
        <div class="card-label">Kar Marjı</div>
      </div>
    </div>
  `;
  
  $w('#reportContent').html = `
    <div class="financial-breakdown">
      <h3>Finansal Detay</h3>
      <div class="breakdown-item">
        <span class="label">Toplam Satış:</span>
        <span class="value">${formatCurrency(data.totalRevenue || 0)}</span>
      </div>
      <div class="breakdown-item">
        <span class="label">Nakit Satışlar:</span>
        <span class="value">${formatCurrency(data.cashSales || 0)}</span>
      </div>
      <div class="breakdown-item">
        <span class="label">Kredi Kartı:</span>
        <span class="value">${formatCurrency(data.cardSales || 0)}</span>
      </div>
      <div class="breakdown-item">
        <span class="label">Veresiye Satışlar:</span>
        <span class="value">${formatCurrency(data.creditSales || 0)}</span>
      </div>
    </div>
  `;
}

// Export report
function exportReport() {
  try {
    const reportContent = $w('#reportContent').html;
    const reportTitle = $w('#reportTitle').text;
    const reportPeriod = $w('#reportPeriod').text;
    
    // Create CSV content (simplified)
    const csvContent = `${reportTitle}\n${reportPeriod}\n\n${reportContent.replace(/<[^>]*>/g, '')}\n`;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showSuccess('Rapor dışa aktarıldı');
    
  } catch (error) {
    logError('exportReport', error);
    showError('Rapor dışa aktarılırken hata: ' + error.message);
  }
}

// Print report
function printReport() {
  try {
    const reportTitle = $w('#reportTitle').text;
    const reportPeriod = $w('#reportPeriod').text;
    const summaryContent = $w('#summaryCards').html;
    const reportContent = $w('#reportContent').html;
    
    const printContent = `
      <div class="print-report">
        <h1>Elite Medya Bilişim</h1>
        <h2>${reportTitle}</h2>
        <p>${reportPeriod}</p>
        <div class="generated-date">Oluşturulma Tarihi: ${formatDate(new Date())}</div>
        
        <div class="summary-section">
          ${summaryContent}
        </div>
        
        <div class="content-section">
          ${reportContent}
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .print-report { max-width: 800px; margin: 0 auto; }
            h1, h2 { text-align: center; }
            .generated-date { text-align: right; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .summary-section { margin: 20px 0; }
            .summary-card { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; text-align: center; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
  } catch (error) {
    logError('printReport', error);
    showError('Rapor yazdırılırken hata: ' + error.message);
  }
}

// Utility functions
function showLoadingState(loading) {
  if (loading) {
    $w('#loadingSpinner').show();
    $w('#reportResults').hide();
  } else {
    $w('#loadingSpinner').hide();
    $w('#reportResults').show();
  }
}

function showError(message) {
  $w('#errorMessage').text = message;
  $w('#errorMessage').show();
  setTimeout(() => $w('#errorMessage').hide(), 5000);
}

function showSuccess(message) {
  $w('#successMessage').text = message;
  $w('#successMessage').show();
  setTimeout(() => $w('#successMessage').hide(), 3000);
}