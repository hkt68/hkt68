# Elite Medya Bilişim POS - Windows Desktop Uygulaması
## Electron + React + SQLite

Bu proje, Elite Medya Bilişim için Windows masaüstü POS uygulamasıdır.

## 🎯 **Özellikler**

### ✅ **Desktop Native Özellikler:**
- 🖥️ **Windows native görünüm** (pencere kontrolü, menüler)
- 💾 **Offline çalışma** (SQLite local database)
- 🔔 **Windows bildirimleri** (vadesi geçmiş borçlar için)
- 📋 **Sistem tepsisi** entegrasyonu
- ⌨️ **Klavye kısayolları** (Ctrl+N: Yeni müşteri, F11: Tam ekran)
- 🚀 **Otomatik güncellemeler** (electron-updater)
- 📦 **Kolay kurulum** (.exe installer)

### ✅ **POS Özellikleri:**
- 👥 **Müşteri yönetimi** (cari hesaplar)
- 💰 **Manuel borç ekleme/silme**
- 💳 **Ödeme kaydetme** (borç üstü ödeme dahil)
- 🚨 **Vadesi geçmiş borç uyarıları**
- 💾 **Yedekleme/Geri yükleme** (JSON dosyası)
- 📊 **Detaylı raporlar**
- 🛒 **POS satış sistemi**
- 📦 **Stok yönetimi**

## 🚀 **Geliştirme Ortamı Kurulumu**

### **Gereksinimler:**
- Node.js 16+ 
- Python 3.7+ (SQLite build için)
- Visual Studio Build Tools (Windows)
- Git

### **Kurulum:**
```bash
# Projeyi klonlayın
git clone <repository-url>
cd electron-pos

# Dependencies yükleyin
npm install

# Renderer (React) dependencies
cd renderer
npm install
cd ..

# Development modunda başlatın
npm run dev
```

## 📦 **Production Build**

### **Windows .exe Oluşturma:**
```bash
# Production build
npm run dist-win

# Build dosyaları dist/ klasöründe oluşacak
# elite-medya-pos Setup 1.0.0.exe
```

### **Build Özellikleri:**
- **NSIS installer** (Next-Next-Finish kurulum)
- **Desktop kısayolu** otomatik oluşur
- **Start Menu** kısayolu
- **Uninstaller** dahil
- **Auto-updater** desteği

## 🗄️ **SQLite Database**

### **Veritabanı Konumu:**
```
Windows: %APPDATA%/elite-medya-pos/elite-pos.db
```

### **Tablolar:**
- `customers` - Müşteri bilgileri
- `products` - Ürün katalogu
- `categories` - Ürün kategorileri
- `credit_sales` - Cari hesap borç kayıtları
- `payments` - Ödeme kayıtları
- `sales` - Satış kayıtları
- `stock_transactions` - Stok hareketleri
- `settings` - Uygulama ayarları

### **Sample Data:**
Uygulama ilk kez açıldığında örnek veriler otomatik eklenir:
- 2 test müşteri
- 3 test ürün
- Temel ayarlar

## ⌨️ **Klavye Kısayolları**

| Kısayol | Fonksiyon |
|---------|-----------|
| `Ctrl+N` | Yeni müşteri |
| `Ctrl+S` | Yeni satış |
| `Ctrl+B` | Yedek al |
| `Ctrl+R` | Yedek geri yükle |
| `F11` | Tam ekran |
| `F12` | Developer tools |
| `Ctrl+Q` | Çıkış |

## 🔄 **Sistem Tepsisi**

**Sağ tık menü seçenekleri:**
- Elite Medya POS'u Aç
- Yeni Satış
- Müşteriler  
- Yedek Al
- Çıkış

**Çift tık:** Ana pencereyi aç

## 📊 **Raporlar**

### **Mevcut Raporlar:**
- Günlük satış raporu
- Müşteri borç raporu  
- Stok durumu raporu
- Vadesi geçmiş borçlar

### **Export Seçenekleri:**
- PDF (print)
- Excel/CSV
- JSON backup

## 💾 **Yedekleme Sistemi**

### **Otomatik Yedekleme:**
- Günlük otomatik yedek (opsiyonel)
- `%APPDATA%/elite-medya-pos/backups/` klasörüne

### **Manual Yedekleme:**
- Menü: Dosya → Yedek Al
- Klavye: `Ctrl+B`
- Sistem tepsisi: Yedek Al

### **Backup Format:**
```json
{
  "export_date": "2024-01-01T12:00:00Z",
  "version": "1.0",
  "system": "Elite Medya POS Desktop",
  "data": {
    "customers": [...],
    "products": [...],
    "payments": [...]
  }
}
```

## 🔧 **Ayarlar**

### **Uygulama Ayarları:**
```javascript
// Local storage'da tutulan ayarlar
{
  "company_name": "Elite Medya Bilişim",
  "currency": "TRY", 
  "tax_rate": 18,
  "backup_interval": 24,
  "notifications_enabled": true,
  "theme": "light"
}
```

## 🚨 **Bildrimler**

### **Windows Bildirimleri:**
- Vadesi geçmiş borç uyarıları
- Düşük stok uyarıları  
- Yedekleme hatırlatmaları
- Sistem güncellemeleri

## 🔄 **Web Sync (Opsiyonel)**

Desktop uygulaması, web versiyonu ile senkronize edilebilir:

### **Sync Özellikleri:**
- **İki yönlü senkronizasyon**
- **Çakışma çözümü** (timestamp bazlı)
- **Offline çalışma** - sync beklemede
- **Manual/Otomatik** sync seçenekleri

### **Sync API:**
```javascript
// Sync functions
await window.electronAPI.pos.syncWithWeb();
await window.electronAPI.pos.uploadData();
await window.electronAPI.pos.downloadData();
```

## 📱 **Multi-Instance Desteği**

- Aynı anda sadece **1 instance** çalışabilir
- İkinci açılış girişiminde mevcut pencere focus alır
- SQLite database lock koruması

## 🛠️ **Troubleshooting**

### **Yaygın Sorunlar:**

**1. Uygulama açılmıyor:**
```bash
# Log dosyasını kontrol edin
%APPDATA%/elite-medya-pos/logs/main.log
```

**2. Database hatası:**
```bash
# Database dosyasını sıfırlayın
del "%APPDATA%/elite-medya-pos/elite-pos.db"
# Uygulama yeniden başladığında sample data oluşacak
```

**3. SQLite build hatası (development):**
```bash
# Windows build tools yükleyin
npm install --global windows-build-tools
# Veya Visual Studio Build Tools 2019
```

## 📦 **Dağıtım**

### **İçerik:**
- `elite-medya-pos Setup 1.0.0.exe` (installer)
- `elite-medya-pos 1.0.0.exe` (portable)
- Otomatik güncelleyici dahil

### **Sistem Gereksinimleri:**
- Windows 7/8/10/11 (64-bit)
- 2GB RAM minimum
- 500MB disk alanı
- .NET Framework 4.6+ (otomatik yüklenir)

### **Kurulum:**
1. `elite-medya-pos Setup.exe` dosyasını çalıştırın
2. Kurulum sihirbazını takip edin  
3. Desktop kısayolundan başlatın
4. İlk açılışta sample data otomatik yüklenir

## 🔮 **Gelecek Özellikler**

- [ ] **Touchscreen desteği** (tablet POS)
- [ ] **Barcode scanner** entegrasyonu
- [ ] **Termal yazıcı** desteği  
- [ ] **E-fatura** entegrasyonu
- [ ] **SMS bildirimleri**
- [ ] **Multi-store** desteği
- [ ] **Real-time sync** (WebSocket)
- [ ] **Mobile companion app**

---

**Elite Medya Bilişim** - Profesyonel POS Çözümleri  
**Desktop Version 1.0.0** - Windows Uyumlu