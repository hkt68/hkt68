# 🏢 Elit Bilişim - POS & Stok Yönetim Sistemi

**Web Hosting Uyumlu PHP/MySQL Tabanlı Satış Noktası Sistemi**

## 📋 Sistem Özellikleri

### 🎯 Ana Özellikler
- **Dashboard** - Anlık satış ve stok takibi
- **Ürün Yönetimi** - Ürün ekleme, düzenleme, stok kontrolü  
- **Kategori Yönetimi** - Ürün kategorileri
- **POS Sistemi** - Hızlı satış işlemleri
- **Müşteri Yönetimi** - Müşteri kayıtları ve borç takibi
- **Borç Yönetimi** - Vadeli satış ve ödeme takibi
- **Raporlama** - Satış raporları ve analizler
- **Stok Uyarıları** - Düşük stok bildirimleri

### 💡 Özellikler
- ✅ **Vadesi Geçmiş Borç Takibi** (kırmızı renk ile)
- ✅ **Borç Üstü Ödeme Alma**
- ✅ **Manuel Borç/Satış Silme**
- ✅ **Otomatik Stok Takibi**
- ✅ **Çoklu Ödeme Türü** (Nakit, Kart, Havale, Veresiye)
- ✅ **Responsive Tasarım** (Mobil uyumlu)
- ✅ **Türkçe Arayüz**

## 🛠 Teknik Özellikler

### 🖥 Sistem Gereksinimleri
- **PHP:** 7.4+ (PHP 8.0+ önerilen)
- **MySQL:** 5.7+ veya MariaDB 10.2+
- **Web Sunucu:** Apache (mod_rewrite aktif)
- **Disk Alanı:** Minimum 10MB
- **RAM:** 64MB+

### 📁 Dosya Yapısı
```
/web/
├── config/
│   ├── database.php      # Veritabanı bağlantı ayarları
│   └── init_db.php       # Veritabanı kurulum dosyası
├── api/
│   ├── products.php      # Ürün API'leri
│   ├── categories.php    # Kategori API'leri  
│   ├── customers.php     # Müşteri API'leri
│   └── sales.php         # Satış API'leri
├── js/
│   └── app.js           # Ana JavaScript dosyası
├── index.php            # Ana sayfa
├── .htaccess           # Apache yapılandırması
└── README.md           # Bu dosya
```

## ⚡ Kurulum (hostingdunyam.com.tr)

### 1️⃣ Dosya Yükleme
1. Web hosting cPanel'inize giriş yapın
2. **File Manager** bölümüne girin  
3. **public_html** klasörüne gidin
4. Tüm `/web/` klasörü içeriğini buraya yükleyin

### 2️⃣ Veritabanı Kurulumu  
1. cPanel'de **MySQL Databases** bölümüne gidin
2. Veritabanı oluşturun: `elitmedy_pos`
3. Kullanıcı oluşturun: `elitmedy_user` 
4. Güçlü şifre ayarlayın: `vT7#pLx9@QmZ!2rW$eB6^uJfA1&nK3*XyC0+gHsMd8~oIqVzEtRbYlUwNjD`
5. Kullanıcıyı veritabanına atayın (tüm yetkiler)

### 3️⃣ Veritabanı Yapısını Oluşturma
1. Tarayıcıda `https://www.elitmedyabilisim.shop/config/init_db.php` adresine gidin
2. "✅ Elit Bilişim POS - Veritabanı başarıyla oluşturuldu!" mesajını görün
3. Bu adımdan sonra `init_db.php` dosyasını güvenlik için silin

### 4️⃣ Sistem Testi
1. Ana sayfayı açın: `https://www.elitmedyabilisim.shop`
2. Dashboard'ın yüklendiğini kontrol edin
3. Test ürünü ekleyerek sistemi deneyin

## 🔧 Yapılandırma

### Veritabanı Ayarları
`config/database.php` dosyasındaki ayarlar:
```php
private $host = "localhost";              // Genelde değişmez
private $db_name = "elitmedy_pos";        // Veritabanı adınız
private $username = "elitmedy_user";      // MySQL kullanıcı adınız
private $password = "vT7#pLx9@QmZ!2rW$eB6^uJfA1&nK3*XyC0+gHsMd8~oIqVzEtRbYlUwNjD"; // MySQL şifreniz
```

### Güvenlik Notları
- ✅ `.htaccess` dosyası config dosyalarını korur
- ✅ SQL injection koruması aktif
- ✅ XSS koruması mevcut
- ⚠️ Kurulum sonrası `config/init_db.php` dosyasını silin!

## 📊 Veritabanı Tabloları

### Tablolar
- **kategoriler** - Ürün kategorileri
- **urunler** - Ürün bilgileri ve stok
- **musteriler** - Müşteri kayıtları  
- **satislar** - Satış işlemleri
- **satis_detaylari** - Satış ürün detayları
- **odemeler** - Ödeme kayıtları
- **stok_hareketleri** - Stok giriş/çıkış hareketleri

## 🚀 Kullanım

### Dashboard
- Anlık satış ve stok bilgileri
- Hızlı erişim menüleri
- Düşük stok uyarıları
- Vadesi geçmiş borç bildirimleri

### Ürün İşlemleri
1. **Ürün Ekleme:** Sol menüden "Ürünler" → "Yeni Ürün Ekle"
2. **Stok Güncelleme:** Ürün listesinden "Stok Güncelle"
3. **Kategori Yönetimi:** "Kategoriler" menüsünden

### Satış İşlemleri
1. **Yeni Satış:** "Satış Yap" menüsünden
2. **Ödeme Alma:** "Borç Takibi" → "Ödeme Al"
3. **Satış İptali:** "Satış İşlemleri" → "Sil" butonu

## 🎨 Marka Özellikleri

### Elit Bilişim Teması
- 🎯 **Ana Renkler:** Mavi (#1e40af), Turuncu (#F59E0B)
- 🏢 **Logo:** Elit Bilişim branding
- 📱 **Responsive:** Tüm cihazlarda uyumlu
- 🇹🇷 **Türkçe:** Tam Türkçe arayüz

## 🔧 Sorun Giderme

### Yaygın Sorunlar

**1. "Bağlantı hatası" Mesajı**
- Veritabanı bilgilerini kontrol edin
- MySQL servisinin çalıştığından emin olun

**2. API Çalışmıyor**  
- `.htaccess` dosyasının yüklendiğinden emin olun
- Apache `mod_rewrite` modülünün aktif olduğunu kontrol edin

**3. Türkçe Karakterler Bozuk**
- Veritabanı charset'inin `utf8` olduğunu kontrol edin
- PHP dosyalarının UTF-8 kodlamasında kaydedildiğinden emin olun

### Destek
📧 **E-posta:** [Destek talebi için hosting sağlayıcınıza başvurun]
🌐 **Web:** www.elitmedyabilisim.shop

## 📜 Lisans

Bu yazılım Elit Bilişim tarafından geliştirilmiştir. Ticari kullanım için lisans gereklidir.

---

**🎉 Elit Bilişim POS Sistemi - Başarılı Satışlar Dileriz!**