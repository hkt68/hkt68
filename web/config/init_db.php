<?php
// Elit Bilişim - POS Sistemi
// Veritabanı Başlangıç Kurulum Dosyası

require_once 'database.php';

function initializeDatabase() {
    $database = new Database();
    $db = $database->getConnection();

    // Kategoriler tablosu
    $query = "CREATE TABLE IF NOT EXISTS kategoriler (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ad VARCHAR(100) NOT NULL,
        aciklama TEXT,
        renk VARCHAR(7) DEFAULT '#3B82F6',
        aktif TINYINT(1) DEFAULT 1,
        olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $db->exec($query);

    // Ürünler tablosu
    $query = "CREATE TABLE IF NOT EXISTS urunler (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ad VARCHAR(200) NOT NULL,
        barkod VARCHAR(50) UNIQUE,
        kategori_id INT,
        alis_fiyati DECIMAL(10,2) DEFAULT 0,
        satis_fiyati DECIMAL(10,2) NOT NULL,
        stok_miktari INT DEFAULT 0,
        min_stok_seviyesi INT DEFAULT 5,
        birim VARCHAR(20) DEFAULT 'adet',
        aciklama TEXT,
        aktif TINYINT(1) DEFAULT 1,
        olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kategori_id) REFERENCES kategoriler(id)
    )";
    $db->exec($query);

    // Müşteriler tablosu
    $query = "CREATE TABLE IF NOT EXISTS musteriler (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ad VARCHAR(100) NOT NULL,
        soyad VARCHAR(100),
        telefon VARCHAR(15),
        email VARCHAR(100),
        adres TEXT,
        borc_limiti DECIMAL(10,2) DEFAULT 0,
        aktif TINYINT(1) DEFAULT 1,
        olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $db->exec($query);

    // Satışlar tablosu
    $query = "CREATE TABLE IF NOT EXISTS satislar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        musteri_id INT NULL,
        toplam_tutar DECIMAL(10,2) NOT NULL,
        odenen_tutar DECIMAL(10,2) DEFAULT 0,
        kalan_borc DECIMAL(10,2) DEFAULT 0,
        odeme_turu ENUM('nakit', 'kart', 'havale', 'veresiye') DEFAULT 'nakit',
        durum ENUM('tamamlandi', 'beklemede', 'iptal') DEFAULT 'tamamlandi',
        vade_tarihi DATE NULL,
        aciklama TEXT,
        olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (musteri_id) REFERENCES musteriler(id)
    )";
    $db->exec($query);

    // Satış detayları tablosu
    $query = "CREATE TABLE IF NOT EXISTS satis_detaylari (
        id INT AUTO_INCREMENT PRIMARY KEY,
        satis_id INT NOT NULL,
        urun_id INT NOT NULL,
        miktar INT NOT NULL,
        birim_fiyat DECIMAL(10,2) NOT NULL,
        toplam_fiyat DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (satis_id) REFERENCES satislar(id) ON DELETE CASCADE,
        FOREIGN KEY (urun_id) REFERENCES urunler(id)
    )";
    $db->exec($query);

    // Ödemeler tablosu (borç takibi için)
    $query = "CREATE TABLE IF NOT EXISTS odemeler (
        id INT AUTO_INCREMENT PRIMARY KEY,
        satis_id INT NOT NULL,
        odeme_tutari DECIMAL(10,2) NOT NULL,
        odeme_turu ENUM('nakit', 'kart', 'havale') DEFAULT 'nakit',
        aciklama TEXT,
        odeme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (satis_id) REFERENCES satislar(id)
    )";
    $db->exec($query);

    // Stok hareketleri tablosu
    $query = "CREATE TABLE IF NOT EXISTS stok_hareketleri (
        id INT AUTO_INCREMENT PRIMARY KEY,
        urun_id INT NOT NULL,
        hareket_tipi ENUM('giris', 'cikis', 'duzeltme') NOT NULL,
        miktar INT NOT NULL,
        aciklama TEXT,
        referans_id INT NULL,
        referans_tipi ENUM('satis', 'manuel', 'duzeltme'),
        olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (urun_id) REFERENCES urunler(id)
    )";
    $db->exec($query);

    // Varsayılan kategoriler ekle
    $query = "INSERT IGNORE INTO kategoriler (id, ad, aciklama, renk) VALUES 
        (1, 'Genel', 'Genel kategorideki ürünler', '#3B82F6'),
        (2, 'Elektronik', 'Elektronik ürünler', '#10B981'),
        (3, 'Gıda', 'Gıda ürünleri', '#F59E0B'),
        (4, 'Tekstil', 'Giyim ve tekstil ürünleri', '#EF4444'),
        (5, 'Kozmetik', 'Kozmetik ve bakım ürünleri', '#8B5CF6')";
    $db->exec($query);

    return true;
}

// Veritabanını başlat
if (initializeDatabase()) {
    echo "✅ Elit Bilişim POS - Veritabanı başarıyla oluşturuldu!";
} else {
    echo "❌ Veritabanı oluşturulurken hata oluştu!";
}
?>