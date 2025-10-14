# POS SİSTEMİ - cPANEL KURULUM REHBERİ

## 🎯 KURULUM ADIMLARı

### ÖN HAZIRLIK

**Gerekli Domain/Subdomain:**
- Ana Domain: `www.satis.elitmedyabilisim.shop` (Frontend için)
- API Subdomain: `api.satis.elitmedyabilisim.shop` (Backend için)

---

## BÖLÜM 1: SUBDOMAIN OLUŞTURMA

### 1. API Subdomain Oluşturun

1. cPanel → **"Subdomains"** (Alt Alan Adları)
2. Subdomain: `api`
3. Domain: `satis.elitmedyabilisim.shop` seçin
4. Document Root: `/home/username/api.satis.elitmedyabilisim.shop`
5. **"Create"** (Oluştur) tıklayın

✅ Subdomain oluşturuldu: `api.satis.elitmedyabilisim.shop`

---

## BÖLÜM 2: BACKEND KURULUMU (Python FastAPI)

### 2.1. Python App Oluşturun

1. cPanel → **"Setup Python App"**
2. **"Create Application"** tıklayın
3. Ayarlar:
   - **Python Version:** 3.11 veya 3.10 (en yüksek sürümü seçin)
   - **Application Root:** `pos_backend`
   - **Application URL:** `api.satis.elitmedyabilisim.shop` seçin
   - **Application Startup File:** `server.py`
   - **Application Entry Point:** `app` yazın

4. **"Create"** tıklayın

✅ Python uygulaması oluşturuldu!

### 2.2. Backend Dosyalarını Yükleyin

1. cPanel → **"File Manager"** (Dosya Yöneticisi)
2. `/home/username/pos_backend` klasörüne gidin
3. **"Upload"** tıklayın
4. `backend-app.tar.gz` dosyasını yükleyin
5. Yüklendikten sonra sağ tıklayın → **"Extract"** (Çıkart)
6. Arşivi çıkartın

Dosya yapısı şöyle olmalı:
```
/home/username/pos_backend/
├── server.py
├── requirements.txt
└── .env.production
```

### 2.3. Environment Variables Ayarlayın

1. `.env.production` dosyasını `.env` olarak yeniden adlandırın
   - Dosya üzerine sağ tıklayın → **"Rename"** → `.env` yazın

2. `.env` dosyasını düzenleyin (sağ tıklayın → **"Edit"**):
   - `MYSQL_HOST=localhost` ✅ (değiştirmeyin)
   - `CORS_ORIGINS` kısmını kontrol edin
   - `SECRET_KEY` için güçlü bir şifre oluşturun

### 2.4. Dependencies Kurun

1. cPanel → **"Setup Python App"** sayfasına dönün
2. Oluşturduğunuz uygulamayı bulun
3. **"Edit"** tıklayın
4. Sayfanın altında **"Configuration Files"** bölümü var
5. Buradan **"Terminal"** açın (veya SSH ile bağlanın)

Terminal'de şu komutları çalıştırın:
```bash
source /home/username/virtualenv/pos_backend/3.11/bin/activate
cd /home/username/pos_backend
pip install -r requirements.txt
```

⏳ Kurulum 2-3 dakika sürer.

### 2.5. Uygulamayı Başlatın

1. "Setup Python App" sayfasında
2. **"Restart"** butonuna tıklayın
3. Uygulama başlatılacak

✅ Backend hazır: `https://api.satis.elitmedyabilisim.shop`

### 2.6. Test Edin

Tarayıcıda açın:
```
https://api.satis.elitmedyabilisim.shop/health
```

Şu yanıtı görmelisiniz:
```json
{"status":"healthy","database":"connected"}
```

---

## BÖLÜM 3: FRONTEND KURULUMU (React Build)

### 3.1. Frontend Dosyalarını Yükleyin

1. cPanel → **"File Manager"**
2. Ana domain klasörüne gidin: `/home/username/public_html` 
   - VEYA domain'e özel klasör: `/home/username/satis.elitmedyabilisim.shop/public_html`
3. **Mevcut dosyaları temizleyin** (varsa default index.html vs.)
4. **"Upload"** tıklayın
5. `frontend-build.tar.gz` dosyasını yükleyin
6. Yüklendikten sonra sağ tıklayın → **"Extract"**
7. Arşivi çıkartın

### 3.2. Dosyaları Taşıyın

Build klasörü içindeki dosyaları public_html'e taşıyın:

```
/home/username/public_html/build/
```

İçindeki tüm dosyaları (`index.html`, `static/`, `manifest.json` vs.) bir üst klasöre taşıyın:

```
/home/username/public_html/
├── index.html
├── static/
├── manifest.json
├── service-worker.js
└── ...
```

`build` klasörünü silin.

### 3.3. API URL'ini Güncelleyin

⚠️ **ÖNEMLİ:** Frontend build'de API URL'si kodlanmıştır.

**Çözüm:** `index.html` dosyasını düzenleyin ve şu script'i `</body>` etiketinden önce ekleyin:

```html
<script>
  window.REACT_APP_BACKEND_URL = 'https://api.satis.elitmedyabilisim.shop';
</script>
```

VEYA: JavaScript dosyalarını düzenlemek gerekebilir (biraz teknik).

**Alternatif (Daha Kolay):**
- Frontend'i tekrar build edin ama `.env.production` dosyasında API URL'ini ayarlayın
- Ben size güncellenmiş build verebilirim

---

## BÖLÜM 4: SSL SERTİFİKASI

### 4.1. Let's Encrypt SSL

1. cPanel → **"SSL/TLS Status"**
2. `satis.elitmedyabilisim.shop` ve `api.satis.elitmedyabilisim.shop` için
3. **"Run AutoSSL"** tıklayın
4. SSL otomatik kurulur (1-2 dakika)

✅ HTTPS aktif!

---

## BÖLÜM 5: .HTACCESS AYARLARI (Frontend için)

Frontend'de React Router kullanıldığı için `.htaccess` dosyası gerekli:

1. `/home/username/public_html/.htaccess` dosyası oluşturun
2. İçeriği:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # HTTPS yönlendirmesi
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # React Router için
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## TEST VE KONTROL

### ✅ Backend Test:
```
https://api.satis.elitmedyabilisim.shop/health
```
Sonuç: `{"status":"healthy","database":"connected"}`

### ✅ Frontend Test:
```
https://www.satis.elitmedyabilisim.shop
```
Login sayfası açılmalı!

### ✅ Login Test:
- Username: `admin`
- Password: `admin123`

---

## SORUN GİDERME

### Backend Çalışmıyorsa:

1. Python App sayfasında **Error Logs** kontrol edin
2. `.env` dosyası doğru mu kontrol edin
3. MySQL bağlantısı çalışıyor mu: `MYSQL_HOST=localhost`
4. Dependencies kurulu mu: `pip freeze` ile kontrol edin

### Frontend Boş Sayfa Gösteriyorsa:

1. Tarayıcı Console'u açın (F12)
2. API URL'si doğru mu kontrol edin
3. CORS hatası varsa Backend'deki `.env` dosyasında `CORS_ORIGINS` ayarlayın

### 404 Hatası Alıyorsanız:

1. `.htaccess` dosyasını kontrol edin
2. Dosya yollarını kontrol edin

---

## GÜVENLİK ÖNERİLERİ

1. **Admin şifresini değiştirin:**
   - Settings → Users → admin → Edit

2. **SECRET_KEY değiştirin:**
   - `.env` dosyasında güçlü random string kullanın

3. **CORS ayarlarını sıkılaştırın:**
   - Sadece kendi domain'lerinize izin verin

4. **Yedekleme yapın:**
   - Settings sayfasından JSON export
   - cPanel Backup ile full backup

---

## DESTEK

Sorun yaşarsanız:
1. Python App error logs kontrol edin
2. Browser console logs kontrol edin
3. MySQL bağlantısını test edin

**Başarılar! 🚀**
