# 📋 Elite Medya POS - Kurulum Rehberi

## 🎯 Hızlı Başlangıç

### 1️⃣ Hazır .exe Kullanımı (ÖNERİLEN)
```
1. Elite_Medya_POS.exe dosyasını masaüstüne kopyalayın
2. Çift tıklayarak çalıştırın  
3. İlk çalışmada "data" klasörü otomatik oluşur
4. Kurulum tamamlandı! 🎉
```

### 2️⃣ Web'den Veri Aktarma
```
1. Uygulamayı açın
2. "Yedekleme" sekmesine gidin
3. "Web'den Veri Çek" butonuna tıklayın
4. Web API URL'nizi girin ve "Veri Çekmeyi Başlat"
5. Tüm müşteri ve borç bilgileri otomatik gelir
```

## 🛠️ Geliştirici Kurulumu

### Gereksinimler
- Python 3.8+ 
- Windows 10/11
- Git (opsiyonel)

### Adım adım
```bash
# 1. Kodu indirin
git clone <repo>
cd portable-pos

# 2. Sanal ortam oluşturun (opsiyonel)
python -m venv venv
venv\Scripts\activate

# 3. Gerekli paketleri yükleyin
pip install -r requirements.txt

# 4. Web'den veri çekin (ilk kurulumda)
python test_data_import.py

# 5. Uygulamayı çalıştırın
python main.py

# 6. .exe oluşturun (isteğe bağlı)
python build_exe.py
```

## 📁 Dosya Yapısı

```
Elite_Medya_POS.exe          # ✅ Ana uygulama (çalıştırılabilir)
│
data/                        # 📁 Veri klasörü (otomatik oluşur)
├── customers.json           # 👥 Müşteri bilgileri
├── products.json            # 📦 Ürün kataloğu  
├── credit_sales.json        # 💳 Veresiye satışlar
├── payments.json            # 💰 Ödeme kayıtları
└── settings.json            # ⚙️ Uygulama ayarları
│
geliştirici/                 # 👨‍💻 Kaynak dosyalar (opsiyonel)
├── main.py                  # Ana kod
├── requirements.txt         # Python paketleri
├── test_data_import.py      # Veri çekme aracı
└── build_exe.py             # .exe oluşturucu
```

## 🔧 Sorun Giderme

### ❌ "Elite_Medya_POS.exe başlatılamıyor"
**Çözüm:**
- Windows Defender'ı geçici olarak kapatın
- Dosyayı farklı klasöre taşıyın  
- Yönetici olarak çalıştırın
- Anti-virüs yazılımını kontrol edin

### ❌ "Data klasörü oluşturulamıyor"
**Çözüm:**
- Yazma izni olan klasöre taşıyın
- C:\ yerine Documents kullanın
- Klasör adında Türkçe karakter olmayan yer seçin

### ❌ "Web'den veri çekilemiyor" 
**Çözüm:**
- İnternet bağlantınızı kontrol edin
- Firewall ayarlarını kontrol edin
- Web API URL'nin doğru olduğundan emin olun
- VPN kullanıyorsanız kapatmayı deneyin

### ❌ "Müşteri eklenmiyor"
**Çözüm:**
- Müşteri adı boş olamaz
- Kredi limiti sayı olmalıdır
- data/customers.json dosyası yazılabilir olmalıdır

## 🚀 İleri Seviye Kullanım

### Web API Entegrasyonu
```
Web API URL: https://pos-crm-elite.preview.emergentagent.com/api
Endpoint: /backup/export
Method: GET
Format: JSON
```

### Veri Yedekleme
- **Manuel**: Yedekleme sekmesi → "Verileri Dışa Aktar"
- **Otomatik**: Her çıkışta data klasörü yedeklenir
- **Format**: JSON (Excel'e aktarılabilir)

### Özelleştirme
- `data/settings.json` dosyasını düzenleyerek ayarları değiştirin
- Tema renkleri ve font boyutu ayarlanabilir
- Web API URL'i değiştirilebilir

## 📞 Teknik Destek

**Elite Medya Bilişim**
- 🌐 Web: https://pos-crm-elite.preview.emergentagent.com  
- 📧 E-posta: destek@elitmedyabilisim.com
- 📱 WhatsApp: +90 532 XXX XXXX

### Hata Raporlama
Bir hata ile karşılaştığınızda şu bilgileri paylaşın:
1. Hata mesajının ekran görüntüsü
2. Ne yapmaya çalıştığınız
3. Windows sürümünüz
4. data klasöründeki log dosyaları (varsa)

---
**🏪 Elite Medya POS v2.0 - Portable Edition**