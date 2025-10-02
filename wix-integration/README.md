# Elite Medya Bilişim - Wix Velo POS Entegrasyonu

Bu proje, Elite Medya Bilişim için Wix Velo platformunda çalışan hibrit POS sistemi entegrasyonudur.

## Sistem Mimarisi

### Hibrit Yaklaşım
- **Frontend**: Wix Velo (JavaScript)
- **Backend**: Mevcut FastAPI (Python) + Wix Velo Backend Fonksiyonları
- **Veritabanı**: External Database Connection ile FastAPI entegrasyonu
- **Özellikleri**: Wix'in ödeme sistemleri, kullanıcı yönetimi ve UI küladeğiflerinden faydalanma

## Dosya Yapısı

```
wix-integration/
├── backend/
│   ├── data-adaptor.jsw      # FastAPI backend ile entegrasyon
│   └── auth.jsw              # Kullanıcı kimlik doğrulama ve yetkilendirme
├── public/
│   ├── yonetim.js            # Ana yönetim dashboardı
│   ├── pos.js                # POS satış arayüzü
│   ├── customers.js          # Müşteri yönetimi ve cari hesaplar
│   └── reports.js            # Raporlar ve analitik
└── README.md
```

## Özellikler

### 1. Ana Dashboard (/yonetim)
- Gerçek zamanlı satış metrikleri
- Stok durumu ve uyarılar
- Müşteri borç özeti
- Sistem sağlık durumu

### 2. POS Sistemi (/yonetim/pos)
- Barkod tarama ve ürün arama
- Sepet yönetimi
- Müşteri seçimi
- Nakit, kart ve veresiye ödeme seçenekleri
- Fiş yazdırma

### 3. Müşteri Yönetimi (/yonetim/customers)
- Müşteri ekleme/düzenleme
- Cari hesap detayları
- Alışveriş geçmişi
- Manuel borç ekleme
- Ödeme kaydetme
- Müşteri raporu yazdırma

### 4. Raporlar (/yonetim/reports)
- Günlük satış raporları
- Ürün performans analizi
- Müşteri analizi
- Finansal özet raporları
- Rapor dışa aktarma ve yazdırma

## Kurulum Talimatları

### 1. Wix Editor'de Yapılandırma

1. Wix Editor'de Dev Mode'u etkinleştirin
2. Velo Özellikleri'ni açın
3. Members & Permissions'u etkinleştirin
4. Wix Data'yı etkinleştirin

### 2. Backend Dosyalarını Yükleyin

1. `backend/` klasöründeki dosyaları Wix Editor'de Backend bölümüne yükleyin:
   - `data-adaptor.jsw`
   - `auth.jsw`

2. `data-adaptor.jsw` dosyasındaki `API_BASE_URL` değişkenini kendi FastAPI URL'niz ile güncelleyin:
   ```javascript
   const API_BASE_URL = 'https://your-fastapi-url.com/api';
   ```

### 3. Sayfa Yapılandırması

1. Aşağıdaki sayfaları oluşturun:
   - `/yonetim` - Ana yönetim dashboardı
   - `/yonetim/pos` - POS arayüzü
   - `/yonetim/customers` - Müşteri yönetimi
   - `/yonetim/reports` - Raporlar

2. Her sayfaya karşılık gelen JavaScript dosyasını Page Code bölümüne kopyalayın

### 4. UI Elemanlarını Ekleyin

Her sayfa için gerekli UI elemanlarını ekleyin. Element ID'leri JavaScript dosyalarındaki `$w('#elementId')` çağrıları ile eşleşmelidir.

#### Ana Dashboard Elemanları (/yonetim)
```
#welcomeText - Hoşgeldin mesajı
#todaySales - Bugünkü satış toplamı
#todayTransactions - Bugünkü işlem sayısı
#totalProducts - Toplam ürün sayısı
#lowStockAlerts - Düşük stok uyarıları
#totalCustomers - Toplam müşteri sayısı
#totalDebt - Toplam müşteri borcu
#posBtn, #productsBtn, #customersBtn, #reportsBtn - Navigasyon butonları
```

#### POS Arayüzü (/yonetim/pos)
```
#productSearch - Ürün arama girişi
#productSuggestions - Ürün öneri listesi
#customerDropdown - Müşteri seçim dropdownı
#cartItems - Sepet öğeleri listesi
#cartTotal - Sepet toplam tutarı
#cashPaymentBtn, #cardPaymentBtn, #creditPaymentBtn - Ödeme butonları
```

#### Müşteri Yönetimi (/yonetim/customers)
```
#customerSearch - Müşteri arama
#customersList - Müşteri listesi
#addCustomerBtn - Müşteri ekleme butonu
#customerFormModal - Müşteri formu modalı
#customerAccountModal - Hesap detay modalı
```

### 5. Kullanıcı Rolleri Yapılandırması

`auth.jsw` dosyasında sahip e-postasını güncelleyin:
```javascript
const ownerEmails = ['your-email@example.com']; // Kendi e-postanızı ekleyin
```

### 6. Site Yayınlama

1. Tüm kodları test edin
2. Site'i yayınlayın
## Kullanım

### Giriş Yapma
1. elitmedyabilisim.com/yonetim adresine gidin
2. Wix üye girişi ile giriş yapın
### POS Kullanımı
1. Ürün arama çubuğuna barkod tarayın veya ürün adı yazın
2. Ürünleri sepete ekleyin
3. Müşteri seçin (veresiye için)
4. Ödeme yöntemini seçin ve işlemi tamamlayın
### Müşteri Yönetimi
1. Yeni müşteri eklemek için "+" butonunu kullanın
2. Hesap detaylarını görmek için "Hesap Detayı" butonuna tıklayın
3. Manuel borç eklemek veya ödeme kaydetmek için ilgili butonları kullanın
## Destek ve Geliştirme

### Hata Ayıklama
- Browser Developer Console'da JavaScript hatalarını kontrol edin
- Network sekmesinde API çağrılarını kontrol edin
- FastAPI backend loglarını kontrol edin

### Yeni Özellik Ekleme
1. Önce backend'e gerekli endpoint'leri ekleyin
2. `data-adaptor.jsw` dosyasına yeni fonksiyonlar ekleyin
3. Frontend sayfa kodlarına yeni özellikleri implement edin
4. Gerekli UI elemanlarını ekleyin

### Önemli Notlar
- API URL'lerini doğru yapılandırdığınızdan emin olun
- Wix Premium plan gereklidir (Velo özellikleri için)
- HTTPS zorunludur (Wix otomatik sağlar)
- CORS ayarlarını FastAPI'de doğru yapılandırın

## Lisans

Bu kod Elite Medya Bilişim için özel olarak geliştirilmiştir.
