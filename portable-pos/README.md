# 🏪 Elite Medya Bilişim POS - Portable Edition

Modern, kurulum gerektirmeyen Windows masaüstü POS uygulaması.

## ✨ Özellikler

### 👥 Müşteri Yönetimi
- Müşteri ekleme, düzenleme ve arama
- Kredi limiti takibi
- Telefon ve e-posta bilgileri
- Adres ve notlar

### 💰 Borç & Ödeme Takibi  
- Manuel borç ekleme
- Ödeme kaydetme (Nakit, Kart, Banka Havalesi)
- Vadesi geçmiş borç uyarıları
- Müşteri hesap detayları

### 🛒 Satış İşlemleri
- Hızlı satış (Nakit, Kart, Veresiye)
- Barkod ile ürün arama  
- Miktar ve fiyat hesaplama
- Otomatik borç kaydı (veresiye satışlarda)

### 📦 Ürün Yönetimi
- Ürün ekleme ve stok takibi
- Barkod sistemi
- Fiyat güncelleme
- Kategori düzenleme

### 📊 Raporlar
- Müşteri borç raporu
- Ödeme geçmişi 
- Özet finansal rapor
- Rapor yazdırma özelliği

### 💾 Veri Yönetimi
- **Yerel Yedekleme**: JSON formatında dışa/içe aktarma
- **Web Senkronizasyonu**: Web POS uygulamasından veri çekme
- Güvenli veri saklama
- Otomatik yedekleme

## 🚀 Kurulum & Kullanım

### Hazır .exe Dosyası
1. `Elite_Medya_POS.exe` dosyasını indirin
2. Herhangi bir klasöre koyun
3. Çift tıklayarak çalıştırın
4. **Kurulum gerektirmez!**

### Geliştirici Kurulumu
```bash
# Repository'yi klonlayın
git clone <repo-url>
cd portable-pos

# Gereksinimler
pip install -r requirements.txt

# Uygulamayı çalıştır
python main.py

# .exe oluştur (Windows)
python build_exe.py
```

## 📁 Dosya Yapısı

```
Elite_Medya_POS.exe          # Ana uygulama
data/                        # Veri klasörü (otomatik oluşur)
├── customers.json           # Müşteri bilgileri
├── products.json            # Ürün bilgileri  
├── credit_sales.json        # Borç kayıtları
├── payments.json            # Ödeme kayıtları
└── settings.json            # Uygulama ayarları
```

## 🌐 Web Entegrasyonu

Bu portable uygulama, web tabanlı POS sisteminizden veri çekebilir:

1. **Yedekleme** sekmesine gidin
2. **Web'den Veri Çek** butonuna tıklayın
3. Web API URL'nizi girin
4. Tüm verileri otomatik olarak senkronize edin

**Desteklenen Web API:** `https://pos-crm-elite.preview.emergentagent.com/api`

## 🔧 Özellik Detayları

### Barkod Sistemi
- Manuel barkod girişi desteklenir
- Ürün arama ve seçme
- Hızlı satış işlemleri

### Kredi Sistemi
- Müşteri bazlı kredi limitleri
- Vade takibi
- Fazla ödeme desteği
- Otomatik borç hesaplama

### Raporlama
- Gerçek zamanlı finansal durum
- Müşteri bazlı borç analizi
- Ödeme geçmişi tracking
- Excel uyumlu rapor çıktısı

## 🛡️ Veri Güvenliği

- **Yerel Depolama**: Veriler bilgisayarınızda güvenle saklanır
- **Şifreleme**: Hassas bilgiler korunur
- **Yedekleme**: Düzenli yedekleme önerilir
- **Gizlilik**: İnternet bağlantısı opsiyoneldir

## 📞 Destek

**Elite Medya Bilişim**
- Web: https://pos-crm-elite.preview.emergentagent.com
- E-posta: destek@elitmedyabilisim.com
- Telefon: 0532 XXX XXXX

## 📋 Sistem Gereksinimleri

- **İşletim Sistemi**: Windows 7/8/10/11
- **RAM**: Minimum 2GB  
- **Disk Alanı**: 100MB
- **Çözünürlük**: 1024x768 minimum
- **İnternet**: Sadece web sync için (opsiyonel)

## 🔄 Güncellemeler

**v2.0 (Mevcut)**
- Modern CustomTkinter arayüzü
- Web senkronizasyon özelliği
- Gelişmiş raporlama
- Barkod sistemi desteği
- Otomatik yedekleme

**v1.0**
- Temel POS işlevleri
- Müşteri ve ürün yönetimi
- Basit raporlar

## 📄 Lisans

Bu yazılım Elite Medya Bilişim tarafından geliştirilmiştir.
Ticari kullanım için lisans gereklidir.

---

**🏪 Elite Medya Bilişim POS - Portable Edition v2.0**