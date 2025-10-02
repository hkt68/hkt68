// POS Interface Page - Elite Medya Bilişim
// Point of Sale system for processing transactions

import { getCurrentUserInfo, requirePermission } from 'backend/auth';
import {
  getProducts,
  processSale,
  getCustomers,
  formatCurrency,
  logError
} from 'backend/data-adaptor';

// Global variables
let currentCart = [];
let selectedCustomer = null;
let products = [];
let customers = [];

$w.onReady(function () {
  initializePOS();
});

// Initialize POS system
async function initializePOS() {
  try {
    // Verify user permissions
    const userInfo = await getCurrentUserInfo();
    if (!userInfo.success) {
      wixLocation.to('/login');
      return;
    }
    
    await requirePermission(userInfo.user.id, 'PROCESS_SALES');
    
    // Load initial data
    await loadProducts();
    await loadCustomers();
    
    // Setup interface
    setupPOSInterface();
    
    // Clear cart
    clearCart();
    
    console.log('POS system initialized successfully');
    
  } catch (error) {
    console.error('POS initialization error:', error);
    showError('POS sistemi başlatılamadı: ' + error.message);
  }
}

// Load products
async function loadProducts() {
  try {
    const response = await getProducts({ active_only: true });
    if (response.success) {
      products = response.data;
      updateProductSearch();
    } else {
      throw new Error('Ürünler yüklenemedi');
    }
  } catch (error) {
    logError('loadProducts', error);
    showError('Ürünler yüklenirken hata: ' + error.message);
  }
}

// Load customers
async function loadCustomers() {
  try {
    const response = await getCustomers({ active_only: true });
    if (response.success) {
      customers = response.data;
      updateCustomerDropdown();
    } else {
      throw new Error('Müşteriler yüklenemedi');
    }
  } catch (error) {
    logError('loadCustomers', error);
    showError('Müşteriler yüklenirken hata: ' + error.message);
  }
}

// Setup POS interface
function setupPOSInterface() {
  // Barcode/product search
  $w('#productSearch').onInput(handleProductSearch);
  $w('#productSearch').onKeyPress((event) => {
    if (event.key === 'Enter') {
      handleBarcodeEntry();
    }
  });
  
  // Customer selection
  $w('#customerDropdown').onChange(handleCustomerSelection);
  
  // Payment buttons
  $w('#cashPaymentBtn').onClick(() => processPayment('CASH'));
  $w('#cardPaymentBtn').onClick(() => processPayment('CARD'));
  $w('#creditPaymentBtn').onClick(() => processPayment('CREDIT'));
  
  // Cart management
  $w('#clearCartBtn').onClick(clearCart);
  
  // Quick actions
  $w('#newCustomerBtn').onClick(showNewCustomerModal);
  $w('#newProductBtn').onClick(showNewProductModal);
  
  // Navigation
  $w('#backToDashboard').onClick(() => {
    wixLocation.to('/yonetim/dashboard');
  });
}

// Handle product search
function handleProductSearch() {
  const searchTerm = $w('#productSearch').value.toLowerCase();
  
  if (searchTerm.length < 2) {
    $w('#productSuggestions').hide();
    return;
  }
  
  const suggestions = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.barcode?.includes(searchTerm)
  ).slice(0, 10);
  
  displayProductSuggestions(suggestions);
}

// Display product suggestions
function displayProductSuggestions(suggestions) {
  if (suggestions.length === 0) {
    $w('#productSuggestions').hide();
    return;
  }
  
  const suggestionHTML = suggestions.map(product => `
    <div class="suggestion-item" data-product-id="${product.id}">
      <div class="product-name">${product.name}</div>
      <div class="product-info">
        <span class="price">${formatCurrency(product.price)}</span>
        <span class="stock">Stok: ${product.stock || 0}</span>
      </div>
    </div>
  `).join('');
  
  $w('#productSuggestions').html = suggestionHTML;
  $w('#productSuggestions').show();
  
  // Add click handlers to suggestions
  suggestions.forEach(product => {
    $w('#productSuggestions').querySelector(`[data-product-id="${product.id}"]`)
      ?.addEventListener('click', () => addProductToCart(product));
  });
}

// Handle barcode entry
function handleBarcodeEntry() {
  const barcode = $w('#productSearch').value.trim();
  
  if (!barcode) return;
  
  const product = products.find(p => p.barcode === barcode);
  
  if (product) {
    addProductToCart(product);
    $w('#productSearch').value = '';
    $w('#productSuggestions').hide();
  } else {
    showError('Ürün bulunamadı: ' + barcode);
    // Could offer to create new product here
  }
}

// Add product to cart
function addProductToCart(product) {
  try {
    // Check stock availability
    if (product.stock <= 0) {
      showError('Ürün stokta yok: ' + product.name);
      return;
    }
    
    // Check if product already in cart
    const existingItem = currentCart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        showError('Yetersiz stok: ' + product.name);
        return;
      }
      existingItem.quantity += 1;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        barcode: product.barcode
      });
    }
    
    updateCartDisplay();
    showSuccess(`Eklendi: ${product.name}`);
    
  } catch (error) {
    logError('addProductToCart', error);
    showError('Ürün sepete eklenirken hata oluştu');
  }
}

// Update cart display
function updateCartDisplay() {
  if (currentCart.length === 0) {
    $w('#cartItems').html = '<div class="empty-cart">Sepet boş</div>';
    $w('#cartTotal').text = formatCurrency(0);
    $w('#itemCount').text = '0 ürün';
    return;
  }
  
  let total = 0;
  let itemCount = 0;
  
  const cartHTML = currentCart.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    itemCount += item.quantity;
    
    return `
      <div class="cart-item" data-product-id="${item.id}">
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-price">${formatCurrency(item.price)}</div>
        </div>
        <div class="item-controls">
          <button class="qty-btn minus" data-action="decrease">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="qty-btn plus" data-action="increase">+</button>
        </div>
        <div class="item-total">${formatCurrency(itemTotal)}</div>
        <button class="remove-btn" data-action="remove">×</button>
      </div>
    `;
  }).join('');
  
  $w('#cartItems').html = cartHTML;
  $w('#cartTotal').text = formatCurrency(total);
  $w('#itemCount').text = `${itemCount} ürün`;
  
  // Add event listeners to cart controls
  setupCartControls();
}

// Setup cart controls
function setupCartControls() {
  currentCart.forEach(item => {
    const itemElement = $w('#cartItems').querySelector(`[data-product-id="${item.id}"]`);
    
    // Quantity controls
    itemElement.querySelector('.minus')?.addEventListener('click', () => {
      adjustCartItemQuantity(item.id, -1);
    });
    
    itemElement.querySelector('.plus')?.addEventListener('click', () => {
      adjustCartItemQuantity(item.id, 1);
    });
    
    // Remove item
    itemElement.querySelector('.remove-btn')?.addEventListener('click', () => {
      removeCartItem(item.id);
    });
  });
}

// Adjust cart item quantity
function adjustCartItemQuantity(productId, change) {
  const item = currentCart.find(i => i.id === productId);
  if (!item) return;
  
  item.quantity += change;
  
  if (item.quantity <= 0) {
    removeCartItem(productId);
  } else {
    // Check stock limits
    const product = products.find(p => p.id === productId);
    if (product && item.quantity > product.stock) {
      item.quantity = product.stock;
      showWarning('Stok limiti: ' + product.stock);
    }
    
    updateCartDisplay();
  }
}

// Remove cart item
function removeCartItem(productId) {
  currentCart = currentCart.filter(item => item.id !== productId);
  updateCartDisplay();
}

// Clear cart
function clearCart() {
  currentCart = [];
  selectedCustomer = null;
  updateCartDisplay();
  $w('#customerDropdown').value = '';
}

// Handle customer selection
function handleCustomerSelection() {
  const customerId = $w('#customerDropdown').value;
  
  if (customerId) {
    selectedCustomer = customers.find(c => c.id === customerId);
    
    if (selectedCustomer) {
      $w('#selectedCustomerInfo').text = `${selectedCustomer.name} - Kredi: ${formatCurrency(selectedCustomer.credit_limit || 0)}`;
      $w('#selectedCustomerInfo').show();
      $w('#creditPaymentBtn').enable();
    }
  } else {
    selectedCustomer = null;
    $w('#selectedCustomerInfo').hide();
    $w('#creditPaymentBtn').disable();
  }
}

// Process payment
async function processPayment(paymentMethod) {
  try {
    if (currentCart.length === 0) {
      showError('Sepet boş');
      return;
    }
    
    // Validate payment method
    if (paymentMethod === 'CREDIT' && !selectedCustomer) {
      showError('Veresiye satış için müşteri seçiniz');
      return;
    }
    
    // Calculate total
    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Prepare sale data
    const saleData = {
      items: currentCart,
      total_amount: total,
      payment_method: paymentMethod.toLowerCase(),
      customer_id: selectedCustomer?.id || null,
      created_by: 'POS_SYSTEM'
    };
    
    // Show processing state
    showProcessingPayment(true);
    
    // Process the sale
    const response = await processSale(saleData);
    
    if (response.success) {
      // Show success and receipt
      showSuccess(`Satış tamamlandı! Toplam: ${formatCurrency(total)}`);
      
      // Print receipt (if available)
      printReceipt(response.data, saleData);
      
      // Clear cart
      clearCart();
      
      // Reload products to update stock
      await loadProducts();
      
    } else {
      throw new Error(response.error || 'Satış işlemi başarısız');
    }
    
  } catch (error) {
    logError('processPayment', error);
    showError('Ödeme işlemi hatası: ' + error.message);
  } finally {
    showProcessingPayment(false);
  }
}

// Show processing payment state
function showProcessingPayment(processing) {
  if (processing) {
    $w('#cashPaymentBtn').disable();
    $w('#cardPaymentBtn').disable();
    $w('#creditPaymentBtn').disable();
    $w('#processingMessage').show();
  } else {
    $w('#cashPaymentBtn').enable();
    $w('#cardPaymentBtn').enable();
    if (selectedCustomer) $w('#creditPaymentBtn').enable();
    $w('#processingMessage').hide();
  }
}

// Print receipt
function printReceipt(saleData, originalData) {
  // Generate receipt content
  const receiptContent = `
    <div class="receipt">
      <h2>Elite Medya Bilişim</h2>
      <p>Fiş No: ${saleData.id}</p>
      <p>Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
      <p>Saat: ${new Date().toLocaleTimeString('tr-TR')}</p>
      <hr>
      ${originalData.items.map(item => `
        <div class="receipt-item">
          <span>${item.name}</span>
          <span>${item.quantity} x ${formatCurrency(item.price)}</span>
          <span>${formatCurrency(item.quantity * item.price)}</span>
        </div>
      `).join('')}
      <hr>
      <div class="receipt-total">
        <strong>TOPLAM: ${formatCurrency(originalData.total_amount)}</strong>
      </div>
      <p>Ödeme: ${originalData.payment_method.toUpperCase()}</p>
      ${selectedCustomer ? `<p>Müşteri: ${selectedCustomer.name}</p>` : ''}
      <hr>
      <p>Teşekkürler!</p>
    </div>
  `;
  
  // Open print dialog
  const printWindow = window.open('', '_blank');
  printWindow.document.write(receiptContent);
  printWindow.document.close();
  printWindow.print();
}

// Utility functions
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

function showWarning(message) {
  $w('#warningMessage').text = message;
  $w('#warningMessage').show();
  setTimeout(() => $w('#warningMessage').hide(), 3000);
}

// Update product search dropdown
function updateProductSearch() {
  // This would populate product search suggestions
}

// Update customer dropdown
function updateCustomerDropdown() {
  const options = [{ label: 'Müşteri seç...', value: '' }];
  
  customers.forEach(customer => {
    options.push({
      label: `${customer.name} ${customer.phone ? '(' + customer.phone + ')' : ''}`,
      value: customer.id
    });
  });
  
  $w('#customerDropdown').options = options;
}

// Modal functions (placeholder)
function showNewCustomerModal() {
  // This would show a modal to create new customer
  console.log('Show new customer modal');
}

function showNewProductModal() {
  // This would show a modal to create new product
  console.log('Show new product modal');
}