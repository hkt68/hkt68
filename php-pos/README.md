# Elite Medya Bilişim POS Sistemi
## PHP + MySQL + React Implementation

Bu proje, `elitmedyabilisim.shop` hosting'inde çalışacak şekilde PHP + MySQL teknolojileri ile geliştirilmiştir.

## 📋 Sistem Gereksinimleri

### Hosting Özellikleri:
- **PHP 7.4+** (PHP 8.x tercih edilir)
- **MySQL 5.7+** veya **MariaDB 10.3+**
- **SSL Sertifikası** (HTTPS)
- **cPanel** erişimi
- **Subdomain** oluşturma imkanı

### Özellikler:
- ✅ **Müşteri Yönetimi** (Cari Hesaplar)
- ✅ **Manuel Borç Ekleme**
- ✅ **Ödeme Kaydetme** (Borç üstü ödeme dahil)
- ✅ **Vadesi Geçmiş Borç İşaretleme**
- ✅ **Sistem Yedekleme/Geri Yükleme**
- ✅ **İşlem Silme** (Manuel borç, ödeme)
- ✅ **Detaylı Raporlama**

## 🚀 Kurulum Adımları

### 1. MySQL Veritabanı Oluşturma

**cPanel → MySQL Databases:**
1. **Veritabanı Adı:** `elitmedya_pos`
2. **Kullanıcı Oluştur:** `elitmedya_user`
3. **Şifre:** Güçlü şifre belirleyin
4. **Kullanıcıyı veritabanına ekle** (Tüm yetkiler)

### 2. Veritabanı Şeması Kurulumu

**phpMyAdmin'e gidin:**
1. `elitmedya_pos` veritabanını seçin
2. **SQL** sekmesine tıklayın
3. `/database/schema.sql` dosyasının içeriğini yapıştırın
4. **Go** butonuna tıklayın

### 3. PHP API Dosyalarını Yükleme

**cPanel File Manager:**
```
public_html/
├── api/
│   ├── config/
│   │   └── database.php
│   ├── customers/
│   │   └── index.php
│   ├── payments/
│   │   └── index.php
│   ├── backup/
│   │   └── index.php
│   └── index.php
└── pos/
    ├── static/
    ├── index.html
    └── diğer React build dosyaları
```

### 4. Database Connection Ayarları

**`/api/config/database.php` dosyasını düzenleyin:**
```php
private $host = 'localhost';
private $db_name = 'elitmedya_pos';  // Oluşturduğunuz veritabanı adı
private $username = 'elitmedya_user'; // Oluşturduğunuz kullanıcı
private $password = 'your_password';  // Belirlediğiniz şifre
```

### 5. React Frontend Build

**Yerel bilgisayarınızda:**
```bash
cd frontend
npm install
npm run build
```

**Build dosyalarını** `public_html/pos/` klasörüne yükleyin.

### 6. Subdomain Oluşturma (Opsiyonel)

**cPanel → Subdomains:**
- **Subdomain:** `pos`
- **Document Root:** `public_html/pos`
- **URL:** `pos.elitmedyabilisim.shop`

## 🔧 API Endpoints

### Müşteri Yönetimi:
- `GET /api/customers` - Tüm müşteriler (vadesi geçmiş borç bilgili)
- `POST /api/customers` - Yeni müşteri oluştur
- `GET /api/customers/{id}/account-summary` - Hesap özeti
- `POST /api/customers/{id}/manual-credit` - Manuel borç ekle

### Ödeme İşlemleri:
- `POST /api/payments/customer` - Müşteri ödemesi (borç üstü ödeme)
- `DELETE /api/payments/{id}` - Ödeme sil

### Sistem Yedekleme:
- `GET /api/backup/export` - Veri dışa aktarma
- `POST /api/backup/import` - Veri içe aktarma

### Sistem Durumu:
- `GET /api/health` - Sistem sağlık kontrolü

## 🧪 Test Etme

### 1. API Test:
```bash
curl https://elitmedyabilisim.shop/api/health
```

**Beklenen sonuç:**
```json
{
  "data": {
    "status": "healthy",
    "database": "connected"
  },
  "success": true
}
```

### 2. Frontend Test:
- `https://elitmedyabilisim.shop/pos` adresine gidin
- Müşteri listesini kontrol edin
- Manuel borç ekleme testi yapın

## 📊 Veritabanı Yapısı

### Ana Tablolar:
- **customers** - Müşteri bilgileri
- **products** - Ürün katalogu  
- **sales** - Satış kayıtları
- **credit_sales** - Cari hesap borç kayıtları
- **payments** - Ödeme kayıtları
- **stock_transactions** - Stok hareketleri

### Görünümler (Views):
- **customer_debt_summary** - Müşteri borç özeti
- **stock_alerts** - Stok uyarıları

## 🔒 Güvenlik

### API Güvenliği:
- **SQL Injection** koruması (PDO Prepared Statements)
- **XSS** koruması (Input sanitization)
- **CORS** ayarları
- **HTTPS** zorunluluğu

### Veritabanı Güvenliği:
- Güçlü şifreler
- Sınırlı kullanıcı yetkileri
- Düzenli yedekleme

## 📱 Kullanım

### Müşteri Ekleme:
1. **Müşteriler** sekmesine gidin
2. **"Yeni Müşteri"** butonuna tıklayın
3. Bilgileri doldurun
4. **Kaydet**

### Manuel Borç Ekleme:
1. Müşteri listesinden **"Hesap"** butonuna tıklayın
2. **"Elle Borç Ekle"** butonuna tıklayın
3. Tutarı ve açıklamayı girin
4. **Kaydet**

### Ödeme Alma:
1. Müşteri hesap detayında **"Ödeme Al"** butonuna tıklayın
2. Ödeme tutarını girin (borç tutarını aşabilir)
3. Ödeme yöntemini seçin
4. **Kaydet**

### Sistem Yedekleme:
1. **Yedekleme** sekmesine gidin
2. **"Yedek Oluştur"** butonuna tıklayın
3. JSON dosyası otomatik indirilir
4. Geri yüklemek için **"Yedek Geri Yükle"** kullanın

## 🆘 Sorun Giderme

### Yaygın Sorunlar:

**1. "Database connection failed"**
- `database.php` ayarlarını kontrol edin
- MySQL kullanıcı yetkilerini kontrol edin

**2. "404 Not Found" API hatası**
- `.htaccess` dosyası gerekli olabilir
- Hosting URL rewrite desteğini kontrol edin

**3. Frontend boş görünüyor**
- `REACT_APP_BACKEND_URL` ayarını kontrol edin
- Browser Console'da JavaScript hatalarını kontrol edin

### Log Kontrolü:
```php
// API hatalarını görmek için
error_log("Debug: " . $variable);
```

### .htaccess Dosyası:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ /api/index.php [QSA,L]
```

## 📞 Destek

Kurulum sırasında sorun yaşarsanız:
1. Hosting sağlayıcınızın desteğine başvurun
2. PHP error loglarını kontrol edin
3. MySQL connection testlerini yapın

## 🔄 Güncellemeler

### Version 1.0.0:
- İlk stabil sürüm
- Tüm temel özellikler çalışıyor
- MySQL optimizasyonları

### Gelecek Güncellemeler:
- Ürün yönetimi API'ları
- Satış raporları
- SMS bildirimleri
- E-fatura entegrasyonu

---

**Elite Medya Bilişim** - Profesyonel POS Çözümleri