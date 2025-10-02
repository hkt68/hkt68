# Wix Editor UI Elements Setup Guide
# Elite Medya Bilişim POS Sistemi

Bu rehber, Wix Editor'de gerekli sayfa ve UI elemanlarının nasıl oluşturulacağını açıklar.

## 1. Sayfa Yapılandırması

### Ana Sayfalar
Wix Editor'de aşağıdaki sayfaları oluşturun:

1. **Yönetim Dashboard** - `/yonetim`
2. **POS Arayüzü** - `/yonetim/pos`
3. **Müşteri Yönetimi** - `/yonetim/customers`
4. **Raporlar** - `/yonetim/reports`
5. **Giriş Sayfası** - `/login`

## 2. Ana Yönetim Dashboard (/yonetim)

### Gerekli UI Elemanları:

#### Header Bölümü
```
ID: welcomeText
Tip: Text
İçerik: "Hoşgeldiniz"

ID: lastUpdate  
Tip: Text
İçerik: "Son güncelleme: ..."

ID: logoutBtn
Tip: Button
Metin: "Çıkış"
```

#### İstatistik Kartları
```
ID: todaySales
Tip: Text
İçerik: "₺0.00"

ID: todayTransactions
Tip: Text  
İçerik: "0"

ID: averageTransaction
Tip: Text
İçerik: "₺0.00"

ID: totalProducts
Tip: Text
İçerik: "0"

ID: lowStockAlerts
Tip: Text
İçerik: "0"

ID: outOfStock
Tip: Text
İçerik: "0"

ID: totalCustomers
Tip: Text
İçerik: "0"

ID: activeCustomers
Tip: Text
İçerik: "0"

ID: totalDebt
Tip: Text
İçerik: "₺0.00"

ID: overdueDebt
Tip: Text
İçerik: "₺0.00"
```

#### Navigasyon Butonları
```
ID: posBtn
Tip: Button
Metin: "💳 POS Sistemi"

ID: productsBtn
Tip: Button
Metin: "📦 Ürünler"

ID: inventoryBtn  
Tip: Button
Metin: "📊 Stok Yönetimi"

ID: customersBtn
Tip: Button
Metin: "👥 Müşteriler"

ID: reportsBtn
Tip: Button
Metin: "📈 Raporlar"

ID: settingsBtn
Tip: Button
Metin: "⚙️ Ayarlar"

ID: refreshBtn
Tip: Button
Metin: "🔄 Yenile"
```

#### Mesaj Elemanları
```
ID: loadingSpinner
Tip: Image/Icon
Görünürlük: Gizli

ID: dashboardContent
Tip: Container
Görünürlük: Görünür

ID: errorMessage
Tip: Text
Görünürlük: Gizli
Renk: Kırmızı

ID: warningMessage
Tip: Text
Görünürlük: Gizli
Renk: Sarı

ID: successMessage
Tip: Text
Görünürlük: Gizli
Renk: Yeşil

ID: lowStockWarning
Tip: Text
Görünürlük: Gizli
Renk: Turuncu
```

## 3. POS Arayüzü (/yonetim/pos)

### Gerekli UI Elemanları:

#### Ürün Arama Bölümü
```
ID: productSearch
Tip: Input
Placeholder: "Barkod tarayın veya ürün adı yazın..."

ID: productSuggestions
Tip: Container/Repeater
Görünürlük: Gizli
```

#### Müşteri Seçimi
```
ID: customerDropdown
Tip: Dropdown
Placeholder: "Müşteri seç..."

ID: selectedCustomerInfo
Tip: Text
Görünürlük: Gizli

ID: newCustomerBtn
Tip: Button
Metin: "+ Yeni Müşteri"
```

#### Sepet Bölümü
```
ID: cartItems
Tip: Container/Repeater
İçerik: "Sepet boş"

ID: itemCount
Tip: Text
İçerik: "0 ürün"

ID: cartTotal
Tip: Text
İçerik: "₺0.00"
Boyut: Büyük font

ID: clearCartBtn
Tip: Button
Metin: "🗑️ Sepeti Temizle"
```

#### Ödeme Butonları
```
ID: cashPaymentBtn
Tip: Button
Metin: "💵 Nakit Ödeme"
Renk: Yeşil

ID: cardPaymentBtn
Tip: Button
Metin: "💳 Kart Ödeme"
Renk: Mavi

ID: creditPaymentBtn
Tip: Button
Metin: "📋 Veresiye"
Renk: Turuncu
Durum: Devre Dışı
```

#### Diğer Elemanlar
```
ID: processingMessage
Tip: Text
İçerik: "İşlem yapılıyor..."
Görünürlük: Gizli

ID: newProductBtn
Tip: Button
Metin: "+ Yeni Ürün"

ID: backToDashboard
Tip: Button
Metin: "← Ana Sayfa"
```

## 4. Müşteri Yönetimi (/yonetim/customers)

### Gerekli UI Elemanları:

#### Arama ve Filtreler
```
ID: customerSearch
Tip: Input
Placeholder: "Müşteri adı, telefon veya e-posta..."

ID: activeOnlyFilter
Tip: Checkbox
Metin: "Sadece aktif müşteriler"
Değer: true

ID: clearFiltersBtn
Tip: Button
Metin: "Filtreleri Temizle"
```

#### Aksiyon Butonları
```
ID: addCustomerBtn
Tip: Button
Metin: "+ Yeni Müşteri"

ID: refreshBtn
Tip: Button
Metin: "🔄 Yenile"
```

#### Müşteri Listesi
```
ID: customersList
Tip: Container/Repeater

ID: totalCustomersCount
Tip: Text
İçerik: "0"

ID: activeCustomersCount
Tip: Text
İçerik: "0"

ID: totalDebtAmount
Tip: Text
İçerik: "₺0.00"
```

#### Müşteri Formu Modalı
```
ID: customerFormModal
Tip: Lightbox/Modal
Görünürlük: Gizli

ID: customerFormTitle
Tip: Text
İçerik: "Müşteri Bilgileri"

ID: customerName
Tip: Input
Placeholder: "Müşteri adı*"

ID: customerPhone
Tip: Input
Placeholder: "Telefon numarası"

ID: customerEmail
Tip: Input
Placeholder: "E-posta adresi"

ID: customerAddress
Tip: TextArea
Placeholder: "Adres"

ID: customerTaxNumber
Tip: Input
Placeholder: "Vergi numarası"

ID: customerCreditLimit
Tip: Input
Placeholder: "Kredi limiti (₺)"
Tip: number

ID: customerNotes
Tip: TextArea
Placeholder: "Notlar"

ID: saveCustomerBtn
Tip: Button
Metin: "Kaydet"

ID: cancelCustomerBtn
Tip: Button
Metin: "İptal"
```

#### Hesap Detayı Modalı
```
ID: customerAccountModal
Tip: Lightbox/Modal
Görünürlük: Gizli

ID: accountModalTitle
Tip: Text
İçerik: "Cari Hesap Detayı"

ID: accountModalLoading
Tip: Loading Spinner
Görünürlük: Görünür

ID: accountModalContent
Tip: Container
Görünürlük: Gizli

# Hesap Özet Kartları
ID: totalDebt
Tip: Text

ID: overdueDebt
Tip: Text

ID: creditLimit
Tip: Text

ID: availableCredit
Tip: Text

# Aksiyon Butonları
ID: recordPaymentBtn
Tip: Button
Metin: "💰 Ödeme Al"

ID: addCreditBtn
Tip: Button
Metin: "📋 Elle Borç Ekle"

ID: printReportBtn
Tip: Button
Metin: "🖨️ Rapor Yazdır"

# Alışveriş Geçmişi
ID: purchaseHistory
Tip: Container
```

#### Ödeme Modalı
```
ID: paymentModal
Tip: Lightbox/Modal
Görünürlük: Gizli

ID: paymentModalTitle
Tip: Text

ID: paymentAmount
Tip: Input
Placeholder: "Tutar (₺)"
Tip: number

ID: paymentMethod
Tip: Dropdown
Seçenekler: 
- Nakit (cash)
- Kart (card)
- Banka Havalesi (bank_transfer)
- Çek (check)
- Diğer (other)

ID: paymentReference
Tip: Input
Placeholder: "Referans numarası"

ID: paymentNotes
Tip: TextArea
Placeholder: "Notlar"

ID: recordPaymentSubmitBtn
Tip: Button
Metin: "Ödeme Kaydet"

ID: cancelPaymentBtn
Tip: Button
Metin: "İptal"
```

#### Manuel Borç Modalı
```
ID: manualCreditModal
Tip: Lightbox/Modal
Görünürlük: Gizli

ID: creditModalTitle
Tip: Text

ID: creditAmount
Tip: Input
Placeholder: "Tutar (₺)"
Tip: number

ID: creditDueDate
Tip: DatePicker

ID: creditNotes
Tip: TextArea
Placeholder: "Açıklama*"

ID: addCreditSubmitBtn
Tip: Button
Metin: "Borç Ekle"

ID: cancelCreditBtn
Tip: Button
Metin: "İptal"
```

## 5. Raporlar Sayfası (/yonetim/reports)

### Gerekli UI Elemanları:

#### Rapor Seçimi ve Filtreler
```
ID: reportTypeDropdown
Tip: Dropdown
Seçenekler:
- Günlük Satışlar (daily_sales)
- Ürün Performans (product_performance)
- Müşteri Analizi (customer_analysis)
- Finansal Özet (financial_summary)

ID: startDateInput
Tip: DatePicker

ID: endDateInput
Tip: DatePicker

# Hızlı Tarih Seçimleri
ID: todayBtn
Tip: Button
Metin: "Bugün"

ID: thisWeekBtn
Tip: Button
Metin: "Bu Hafta"

ID: thisMonthBtn
Tip: Button
Metin: "Bu Ay"

ID: lastMonthBtn
Tip: Button
Metin: "Geçen Ay"
```

#### Aksiyon Butonları
```
ID: generateReportBtn
Tip: Button
Metin: "Rapor Oluştur"

ID: exportReportBtn
Tip: Button
Metin: "Dışa Aktar"

ID: printReportBtn
Tip: Button
Metin: "Yazdır"
```

#### Rapor Gösterimi
```
ID: loadingSpinner
Tip: Loading Element
Görünürlük: Gizli

ID: reportResults
Tip: Container

ID: reportTitle
Tip: Text (H2)

ID: reportPeriod
Tip: Text

ID: summaryCards
Tip: Container

ID: reportContent
Tip: Container
```

## 6. Giriş Sayfası (/login)

### Gerekli UI Elemanları:
```
ID: loginEmail
Tip: Input
Placeholder: "E-posta"
Tip: email

ID: loginPassword
Tip: Input
Placeholder: "Şifre"
Tip: password

ID: loginBtn
Tip: Button
Metin: "Giriş Yap"

ID: loginError
Tip: Text
Görünürlük: Gizli
Renk: Kırmızı
```

## 7. Ortak Mesaj Elemanları

Tüm sayfalarda aşağıdaki elemanları ekleyin:

```
ID: errorMessage
Tip: Text
Görünürlük: Gizli
Renk: Kırmızı

ID: successMessage
Tip: Text
Görünürlük: Gizli
Renk: Yeşil

ID: warningMessage
Tip: Text
Görünürlük: Gizli
Renk: Turuncu
```

## 8. CSS Stili Önerileri

Wix Editor'de Custom CSS kullanarak aşağıdaki stilleri ekleyebilirsiniz:

```css
/* Genel Stiller */
.pos-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Stat Kartları */
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #2c5aa0;
}

.stat-label {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
}

/* Buton Stiller */
.btn-primary {
  background: #2c5aa0;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

/* Sepet Stiller */
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.cart-total {
  font-size: 1.5em;
  font-weight: bold;
  color: #2c5aa0;
  text-align: right;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

/* Form Stiller */
.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

/* Modal Stiller */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
}

/* Tablo Stiller */
.report-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.report-table th,
.report-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.report-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

/* Responsive Tasarim */
@media (max-width: 768px) {
  .pos-container {
    padding: 10px;
  }
  
  .stat-card {
    margin-bottom: 10px;
  }
  
  .cart-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

## 9. Kurulum Adımları

1. **Sayfaları Oluşturun**: Yukarıdaki sayfa yapısına göre yeni sayfalar ekleyin

2. **UI Elemanlarını Ekleyin**: Her sayfaya karşılık gelen elemanları sürükle-bırak ile ekleyin

3. **ID'leri Ayarlayın**: Her elemanın Properties panel'inde ID alanını yukarıdaki listeye göre ayarlayın

4. **JavaScript Kodlarını Ekleyin**: Her sayfanın Page Code bölümüne karşılık gelen .js dosyasının içeriğini kopyalayın

5. **Backend Kodlarını Yükleyin**: Velo Backend bölümüne .jsw dosyalarını ekleyin

6. **Test Edin**: Her sayfayı teker teker test edin

## 10. Önemli Notlar

- **Element ID'leri** JavaScript kodundaki `$w('#elementId')` çağrılarıyla tam olarak eşleşmelidir
- **Görünürlük ayarları** doğru yapılmalıdır (bazı elemanlar başlangıçta gizli)
- **Input tipleri** doğru seçilmelidir (email, password, number, date)
- **Dropdown seçenekleri** önceden tanımlanmalıdır
- **Mobile responsive** tasarim için elemanların mobile görünümünü de test edin

Bu rehberi takip ederek Elite Medya Bilişim POS sisteminin tüm UI elemanlarını doğru şekilde oluşturabilirsiniz.
