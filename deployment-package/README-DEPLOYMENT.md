# Elite Medya Bilişim POS - Deployment Rehberi
## elitmedyabilisim.shop Hosting Yükleme

Bu rehber, React POS uygulamasını hosting'inize yüklemek için hazırlanmıştır.

## 📋 **Yükleme Adımları**

### 1️⃣ **Dosyaları İndirin**
GitHub'dan proje dosyalarını indirin ve zip'i açın.

### 2️⃣ **cPanel File Manager'da Yükleme**

**Ana sayfa için (elitmedyabilisim.shop):**
```
public_html/
├── pos/                 ← Buraya React build dosyalarını koyun
│   ├── index.html
│   ├── static/
│   └── ...
├── api/                 ← API dosyalarını buraya (zaten yüklendi)
│   ├── config/
│   ├── customers/
│   └── ...
└── test.php            ← Test dosyası (silebilirsiniz)
```

**VEYA subdomain için (pos.elitmedyabilisim.shop):**
```
public_html/pos/         ← Tüm React build dosyaları buraya
├── index.html
├── static/
└── asset-manifest.json
```

### 3️⃣ **File Manager'da Yapılacaklar**

1. **public_html/pos/** klasörü oluşturun (yoksa)
2. **build/** klasöründeki TÜM dosyaları **pos/** klasörüne kopyalayın:
   - `index.html`
   - `static/` klasörü (js, css dosyaları)
   - `asset-manifest.json`
   - Diğer tüm dosyalar

### 4️⃣ **Test Etme**

**Ana domain testi:**
- `https://elitmedyabilisim.shop/pos/` → POS uygulaması açılmalı

**VEYA subdomain testi:**
- `https://pos.elitmedyabilisim.shop/` → POS uygulaması açılmalı

## 🔧 **Sorun Giderme**

### **Problem 1: Beyaz ekran**
**Çözüm:** `index.html` dosyasındaki path'leri kontrol edin:
```html
<script src="./static/js/main.js"></script>  ✅ Doğru
<script src="/static/js/main.js"></script>   ❌ Yanlış (subdomain için)
```

### **Problem 2: API bağlantı hatası**
**Çözüm:** Browser console'da (F12) API URL'ini kontrol edin:
- `https://elitmedyabilisim.shop/api/customers` erişilebilir olmalı

### **Problem 3: CORS hatası**
**Çözüm:** `api/config/database.php` dosyasında CORS ayarları zaten var

## 🎯 **Beklenen Sonuç**

**Başarılı yükleme sonrası:**
- ✅ POS ana sayfası açılacak
- ✅ Müşteriler listesi görünecek (Ahmet Yılmaz, Fatma Kaya)
- ✅ Manuel borç ekleme çalışacak
- ✅ Ödeme kaydetme çalışacak
- ✅ Vadesi geçmiş borçlar kırmızı görünecek

## 📞 **Destek**

Yükleme sırasında sorun yaşarsanız:
1. Browser Console (F12) hatalarını kontrol edin
2. cPanel Error Logs'a bakın
3. API health check'i test edin: `/api/health`

---

**Elite Medya Bilişim POS v1.0**  
**Hosting: elitmedyabilisim.shop**