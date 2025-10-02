// Customer Management Page - Elite Medya Bilişim
// Customer accounts and cari hesap management

import { getCurrentUserInfo, requirePermission } from 'backend/auth';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  getCustomerAccountSummary,
  getCustomerPurchaseHistory,
  addManualCredit,
  recordPayment,
  generateCustomerReport,
  formatCurrency,
  formatDate,
  logError
} from 'backend/data-adaptor';

// Global variables
let customers = [];
let selectedCustomer = null;
let currentFilters = {
  search: '',
  active_only: true
};

$w.onReady(function () {
  initializeCustomerManagement();
});

// Initialize customer management
async function initializeCustomerManagement() {
  try {
    // Verify permissions
    const userInfo = await getCurrentUserInfo();
    if (!userInfo.success) {
      wixLocation.to('/login');
      return;
    }
    
    await requirePermission(userInfo.user.id, 'MANAGE_CUSTOMERS');
    
    // Load customers
    await loadCustomers();
    
    // Setup interface
    setupCustomerInterface();
    
    console.log('Customer management initialized');
    
  } catch (error) {
    console.error('Customer management initialization error:', error);
    showError('Müşteri yönetimi başlatılamadı: ' + error.message);
  }
}

// Load customers with filters
async function loadCustomers() {
  try {
    showLoadingState(true);
    
    const response = await getCustomers(currentFilters);
    if (response.success) {
      customers = response.data;
      displayCustomers();
      updateCustomerStats();
    } else {
      throw new Error('Müşteriler yüklenemedi');
    }
  } catch (error) {
    logError('loadCustomers', error);
    showError('Müşteriler yüklenirken hata: ' + error.message);
  } finally {
    showLoadingState(false);
  }
}

// Setup customer interface
function setupCustomerInterface() {
  // Search functionality
  $w('#customerSearch').onInput(handleCustomerSearch);
  
  // Filter controls
  $w('#activeOnlyFilter').onChange(handleFilterChange);
  
  // Action buttons
  $w('#addCustomerBtn').onClick(showAddCustomerModal);
  $w('#refreshBtn').onClick(loadCustomers);
  $w('#clearFiltersBtn').onClick(clearFilters);
  
  // Navigation
  $w('#backToDashboard').onClick(() => {
    wixLocation.to('/yonetim/dashboard');
  });
}

// Handle customer search
function handleCustomerSearch() {
  const searchTerm = $w('#customerSearch').value;
  currentFilters.search = searchTerm;
  
  // Debounce search
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    loadCustomers();
  }, 500);
}

// Handle filter changes
function handleFilterChange() {
  currentFilters.active_only = $w('#activeOnlyFilter').checked;
  loadCustomers();
}

// Clear filters
function clearFilters() {
  $w('#customerSearch').value = '';
  $w('#activeOnlyFilter').checked = true;
  currentFilters = {
    search: '',
    active_only: true
  };
  loadCustomers();
}

// Display customers
function displayCustomers() {
  if (customers.length === 0) {
    $w('#customersList').html = `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Müşteri bulunamadı</h3>
        <p>${currentFilters.search ? 'Arama kriterlerinize uygun müşteri yok' : 'Henüz müşteri eklenmemiş'}</p>
        <button id="addFirstCustomer" class="btn-primary">İlk Müşteriyi Ekle</button>
      </div>
    `;
    
    $w('#customersList').querySelector('#addFirstCustomer')
      ?.addEventListener('click', showAddCustomerModal);
    
    return;
  }
  
  const customersHTML = customers.map(customer => {
    const debtStatus = getCustomerDebtStatus(customer);
    
    return `
      <div class="customer-card" data-customer-id="${customer.id}">
        <div class="customer-info">
          <div class="customer-header">
            <h3 class="customer-name">${customer.name}</h3>
            <span class="customer-id">#${customer.id.slice(-6)}</span>
          </div>
          
          <div class="customer-contact">
            ${customer.phone ? `<span class="contact-item">📞 ${customer.phone}</span>` : ''}
            ${customer.email ? `<span class="contact-item">📧 ${customer.email}</span>` : ''}
          </div>
          
          ${customer.address ? `<div class="customer-address">📍 ${customer.address}</div>` : ''}
        </div>
        
        <div class="customer-financial">
          <div class="credit-info">
            <div class="credit-limit">
              <span class="label">Kredi Limiti:</span>
              <span class="value">${formatCurrency(customer.credit_limit || 0)}</span>
            </div>
            <div class="debt-status ${debtStatus.class}">
              <span class="label">Durum:</span>
              <span class="value">${debtStatus.text}</span>
            </div>
          </div>
        </div>
        
        <div class="customer-actions">
          <button class="btn-primary btn-sm" data-action="account" data-customer-id="${customer.id}">
            🏦 Hesap Detayı
          </button>
          <button class="btn-warning btn-sm" data-action="edit" data-customer-id="${customer.id}">
            ✏️ Düzenle
          </button>
          <button class="btn-secondary btn-sm" data-action="payment" data-customer-id="${customer.id}">
            💰 Ödeme Al
          </button>
        </div>
        
        <div class="customer-meta">
          <span class="created-date">
            Kayıt: ${formatDate(customer.created_at)}
          </span>
        </div>
      </div>
    `;
  }).join('');
  
  $w('#customersList').html = customersHTML;
  
  // Add event listeners
  setupCustomerActions();
}

// Setup customer action buttons
function setupCustomerActions() {
  customers.forEach(customer => {
    const customerCard = $w('#customersList').querySelector(`[data-customer-id="${customer.id}"]`);
    
    // Account details
    customerCard.querySelector('[data-action="account"]')
      ?.addEventListener('click', () => showCustomerAccountModal(customer));
    
    // Edit customer
    customerCard.querySelector('[data-action="edit"]')
      ?.addEventListener('click', () => showEditCustomerModal(customer));
    
    // Payment
    customerCard.querySelector('[data-action="payment"]')
      ?.addEventListener('click', () => showPaymentModal(customer));
  });
}

// Get customer debt status
function getCustomerDebtStatus(customer) {
  // This would be calculated from actual debt data
  // For now, return sample status
  const debt = customer.current_debt || 0;
  
  if (debt === 0) {
    return { class: 'status-clear', text: '✅ Temiz' };
  } else if (debt > 0 && debt <= 1000) {
    return { class: 'status-normal', text: `💰 ${formatCurrency(debt)}` };
  } else {
    return { class: 'status-high', text: `⚠️ ${formatCurrency(debt)}` };
  }
}

// Update customer statistics
function updateCustomerStats() {
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalDebt = customers.reduce((sum, c) => sum + (c.current_debt || 0), 0);
  
  $w('#totalCustomersCount').text = totalCustomers.toString();
  $w('#activeCustomersCount').text = activeCustomers.toString();
  $w('#totalDebtAmount').text = formatCurrency(totalDebt);
}

// Show add customer modal
function showAddCustomerModal() {
  selectedCustomer = null;
  setupCustomerFormModal('Yeni Müşteri Ekle', {});
  $w('#customerFormModal').show();
}

// Show edit customer modal
function showEditCustomerModal(customer) {
  selectedCustomer = customer;
  setupCustomerFormModal('Müşteri Düzenle', customer);
  $w('#customerFormModal').show();
}

// Setup customer form modal
function setupCustomerFormModal(title, customerData) {
  $w('#customerFormTitle').text = title;
  
  // Fill form with customer data
  $w('#customerName').value = customerData.name || '';
  $w('#customerPhone').value = customerData.phone || '';
  $w('#customerEmail').value = customerData.email || '';
  $w('#customerAddress').value = customerData.address || '';
  $w('#customerTaxNumber').value = customerData.tax_number || '';
  $w('#customerCreditLimit').value = customerData.credit_limit?.toString() || '0';
  $w('#customerNotes').value = customerData.notes || '';
  
  // Setup form handlers
  $w('#saveCustomerBtn').onClick(handleSaveCustomer);
  $w('#cancelCustomerBtn').onClick(() => $w('#customerFormModal').hide());
}

// Handle save customer
async function handleSaveCustomer() {
  try {
    // Validate required fields
    const name = $w('#customerName').value.trim();
    if (!name) {
      showError('Müşteri adı gerekli');
      return;
    }
    
    // Prepare customer data
    const customerData = {
      name: name,
      phone: $w('#customerPhone').value.trim(),
      email: $w('#customerEmail').value.trim(),
      address: $w('#customerAddress').value.trim(),
      tax_number: $w('#customerTaxNumber').value.trim(),
      credit_limit: parseFloat($w('#customerCreditLimit').value) || 0,
      notes: $w('#customerNotes').value.trim()
    };
    
    // Validate email format
    if (customerData.email && !isValidEmail(customerData.email)) {
      showError('Geçersiz e-posta formatı');
      return;
    }
    
    // Show loading
    $w('#saveCustomerBtn').disable();
    $w('#saveCustomerBtn').text = 'Kaydediliyor...';
    
    let response;
    if (selectedCustomer) {
      // Update existing customer
      response = await updateCustomer(selectedCustomer.id, customerData);
    } else {
      // Create new customer
      response = await createCustomer(customerData);
    }
    
    if (response.success) {
      showSuccess(selectedCustomer ? 'Müşteri güncellendi' : 'Müşteri eklendi');
      $w('#customerFormModal').hide();
      await loadCustomers();
    } else {
      throw new Error(response.error || 'Müşteri kaydetme hatası');
    }
    
  } catch (error) {
    logError('handleSaveCustomer', error);
    showError('Müşteri kaydedilirken hata: ' + error.message);
  } finally {
    $w('#saveCustomerBtn').enable();
    $w('#saveCustomerBtn').text = selectedCustomer ? 'Güncelle' : 'Kaydet';
  }
}

// Show customer account modal
async function showCustomerAccountModal(customer) {
  try {
    selectedCustomer = customer;
    
    // Show loading
    $w('#accountModalLoading').show();
    $w('#accountModalContent').hide();
    $w('#customerAccountModal').show();
    
    // Update modal title
    $w('#accountModalTitle').text = `Cari Hesap - ${customer.name}`;
    
    // Load account data
    const [summaryResponse, historyResponse] = await Promise.all([
      getCustomerAccountSummary(customer.id),
      getCustomerPurchaseHistory(customer.id)
    ]);
    
    if (summaryResponse.success && historyResponse.success) {
      displayAccountSummary(summaryResponse.data);
      displayPurchaseHistory(historyResponse.data);
      
      $w('#accountModalLoading').hide();
      $w('#accountModalContent').show();
    } else {
      throw new Error('Hesap bilgileri alınamadı');
    }
    
  } catch (error) {
    logError('showCustomerAccountModal', error);
    showError('Hesap bilgileri yüklenirken hata: ' + error.message);
    $w('#customerAccountModal').hide();
  }
}

// Display account summary
function displayAccountSummary(summary) {
  $w('#totalDebt').text = formatCurrency(summary.total_debt || 0);
  $w('#overdueDebt').text = formatCurrency(summary.overdue_amount || 0);
  $w('#creditLimit').text = formatCurrency(summary.credit_limit || 0);
  $w('#availableCredit').text = formatCurrency(summary.available_credit || 0);
  
  // Setup account action buttons
  $w('#recordPaymentBtn').onClick(() => showPaymentModal(selectedCustomer));
  $w('#addCreditBtn').onClick(() => showManualCreditModal(selectedCustomer));
  $w('#printReportBtn').onClick(() => printCustomerReport(selectedCustomer));
}

// Display purchase history
function displayPurchaseHistory(history) {
  if (!history || history.length === 0) {
    $w('#purchaseHistory').html = '<div class="no-data">Henüz alışveriş yok</div>';
    return;
  }
  
  const historyHTML = `
    <table class="history-table">
      <thead>
        <tr>
          <th>Tarih</th>
          <th>Ürün</th>
          <th>Adet</th>
          <th>Birim Fiyat</th>
          <th>Toplam</th>
          <th>Durum</th>
        </tr>
      </thead>
      <tbody>
        ${history.map(item => `
          <tr>
            <td>${formatDate(item.date)}</td>
            <td>${item.product_name}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unit_price)}</td>
            <td>${formatCurrency(item.total_amount)}</td>
            <td>
              <span class="status ${item.payment_status}">
                ${item.payment_status === 'cash' ? 'Nakit' : item.payment_status === 'credit' ? 'Veresiye' : 'Diğer'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  $w('#purchaseHistory').html = historyHTML;
}

// Show payment modal
function showPaymentModal(customer) {
  selectedCustomer = customer;
  
  $w('#paymentModalTitle').text = `Ödeme Al - ${customer.name}`;
  $w('#paymentAmount').value = '';
  $w('#paymentMethod').value = 'cash';
  $w('#paymentReference').value = '';
  $w('#paymentNotes').value = '';
  
  $w('#paymentModal').show();
  
  // Setup payment form
  $w('#recordPaymentSubmitBtn').onClick(handleRecordPayment);
  $w('#cancelPaymentBtn').onClick(() => $w('#paymentModal').hide());
}

// Handle record payment
async function handleRecordPayment() {
  try {
    const amount = parseFloat($w('#paymentAmount').value);
    
    if (!amount || amount <= 0) {
      showError('Geçerli bir tutar girin');
      return;
    }
    
    const paymentData = {
      customer_id: selectedCustomer.id,
      amount: amount,
      payment_method: $w('#paymentMethod').value,
      reference_no: $w('#paymentReference').value,
      notes: $w('#paymentNotes').value,
      created_by: 'Customer Management'
    };
    
    // Show loading
    $w('#recordPaymentSubmitBtn').disable();
    $w('#recordPaymentSubmitBtn').text = 'Kaydediliyor...';
    
    const response = await recordPayment(paymentData);
    
    if (response.success) {
      showSuccess('Ödeme kaydedildi');
      $w('#paymentModal').hide();
      
      // Refresh account data if modal is open
      if ($w('#customerAccountModal').isVisible) {
        await showCustomerAccountModal(selectedCustomer);
      }
      
      // Refresh customer list
      await loadCustomers();
    } else {
      throw new Error(response.error || 'Ödeme kaydetme hatası');
    }
    
  } catch (error) {
    logError('handleRecordPayment', error);
    showError('Ödeme kaydedilirken hata: ' + error.message);
  } finally {
    $w('#recordPaymentSubmitBtn').enable();
    $w('#recordPaymentSubmitBtn').text = 'Ödeme Kaydet';
  }
}

// Show manual credit modal
function showManualCreditModal(customer) {
  selectedCustomer = customer;
  
  $w('#creditModalTitle').text = `Manuel Borç Ekle - ${customer.name}`;
  $w('#creditAmount').value = '';
  $w('#creditDueDate').value = '';
  $w('#creditNotes').value = '';
  
  $w('#manualCreditModal').show();
  
  // Setup credit form
  $w('#addCreditSubmitBtn').onClick(handleAddManualCredit);
  $w('#cancelCreditBtn').onClick(() => $w('#manualCreditModal').hide());
}

// Handle add manual credit
async function handleAddManualCredit() {
  try {
    const amount = parseFloat($w('#creditAmount').value);
    
    if (!amount || amount <= 0) {
      showError('Geçerli bir tutar girin');
      return;
    }
    
    const notes = $w('#creditNotes').value.trim();
    if (!notes) {
      showError('Açıklama gerekli');
      return;
    }
    
    const creditData = {
      amount: amount,
      due_date: $w('#creditDueDate').value || null,
      notes: notes
    };
    
    // Show loading
    $w('#addCreditSubmitBtn').disable();
    $w('#addCreditSubmitBtn').text = 'Ekleniyor...';
    
    const response = await addManualCredit(selectedCustomer.id, creditData);
    
    if (response.success) {
      showSuccess('Manuel borç eklendi');
      $w('#manualCreditModal').hide();
      
      // Refresh account data if modal is open
      if ($w('#customerAccountModal').isVisible) {
        await showCustomerAccountModal(selectedCustomer);
      }
      
      // Refresh customer list
      await loadCustomers();
    } else {
      throw new Error(response.error || 'Borç ekleme hatası');
    }
    
  } catch (error) {
    logError('handleAddManualCredit', error);
    showError('Borç eklenirken hata: ' + error.message);
  } finally {
    $w('#addCreditSubmitBtn').enable();
    $w('#addCreditSubmitBtn').text = 'Borç Ekle';
  }
}

// Print customer report
async function printCustomerReport(customer) {
  try {
    const response = await generateCustomerReport(customer.id);
    
    if (response.success) {
      const report = response.data;
      
      const printContent = `
        <div class="customer-report">
          <h1>CARİ HESAP ÖZETİ</h1>
          <h2>Elite Medya Bilişim</h2>
          
          <div class="customer-info">
            <h3>Müşteri Bilgileri</h3>
            <p><strong>Ad:</strong> ${report.customer.name}</p>
            <p><strong>Telefon:</strong> ${report.customer.phone || '-'}</p>
            <p><strong>E-posta:</strong> ${report.customer.email || '-'}</p>
            <p><strong>Adres:</strong> ${report.customer.address || '-'}</p>
          </div>
          
          <div class="financial-summary">
            <h3>Finansal Özet</h3>
            <p><strong>Kredi Limiti:</strong> ${formatCurrency(report.summary.credit_limit)}</p>
            <p><strong>Toplam Borç:</strong> ${formatCurrency(report.summary.current_balance)}</p>
            <p><strong>Rapor Tarihi:</strong> ${formatDate(new Date())}</p>
          </div>
        </div>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      
    } else {
      throw new Error('Rapor oluşturulamadı');
    }
    
  } catch (error) {
    logError('printCustomerReport', error);
    showError('Rapor yazdırılırken hata: ' + error.message);
  }
}

// Utility functions
function showLoadingState(loading) {
  if (loading) {
    $w('#loadingSpinner').show();
    $w('#customersContent').hide();
  } else {
    $w('#loadingSpinner').hide();
    $w('#customersContent').show();
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

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}