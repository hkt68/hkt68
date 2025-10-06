<?php
// Elit Bilişim - POS Sistemi
// Satış API Endpoints

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

class SalesAPI {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // Satış oluştur
    public function createSale($data) {
        try {
            $this->db->beginTransaction();

            // Satış kaydı oluştur
            $query = "INSERT INTO satislar (musteri_id, toplam_tutar, odenen_tutar, kalan_borc, odeme_turu, durum, vade_tarihi, aciklama) 
                      VALUES (:musteri_id, :toplam_tutar, :odenen_tutar, :kalan_borc, :odeme_turu, :durum, :vade_tarihi, :aciklama)";
            
            $stmt = $this->db->prepare($query);
            $kalan_borc = $data['toplam_tutar'] - $data['odenen_tutar'];
            
            $stmt->execute([
                ':musteri_id' => $data['musteri_id'] ?? null,
                ':toplam_tutar' => $data['toplam_tutar'],
                ':odenen_tutar' => $data['odenen_tutar'],
                ':kalan_borc' => $kalan_borc,
                ':odeme_turu' => $data['odeme_turu'] ?? 'nakit',
                ':durum' => $kalan_borc > 0 ? 'beklemede' : 'tamamlandi',
                ':vade_tarihi' => $data['vade_tarihi'] ?? null,
                ':aciklama' => $data['aciklama'] ?? ''
            ]);

            $satis_id = $this->db->lastInsertId();

            // Satış detaylarını ekle ve stokları güncelle
            foreach ($data['urunler'] as $urun) {
                // Satış detayı ekle
                $query = "INSERT INTO satis_detaylari (satis_id, urun_id, miktar, birim_fiyat, toplam_fiyat) 
                          VALUES (:satis_id, :urun_id, :miktar, :birim_fiyat, :toplam_fiyat)";
                
                $stmt = $this->db->prepare($query);
                $stmt->execute([
                    ':satis_id' => $satis_id,
                    ':urun_id' => $urun['id'],
                    ':miktar' => $urun['miktar'],
                    ':birim_fiyat' => $urun['fiyat'],
                    ':toplam_fiyat' => $urun['miktar'] * $urun['fiyat']
                ]);

                // Stoku güncelle
                $query = "UPDATE urunler SET stok_miktari = stok_miktari - :miktar WHERE id = :urun_id";
                $stmt = $this->db->prepare($query);
                $stmt->execute([':miktar' => $urun['miktar'], ':urun_id' => $urun['id']]);

                // Stok hareketi ekle
                $this->addStockMovement($urun['id'], 'cikis', $urun['miktar'], 'Satış - #' . $satis_id, $satis_id);
            }

            // İlk ödeme kaydı (eğer ödeme yapıldıysa)
            if ($data['odenen_tutar'] > 0) {
                $query = "INSERT INTO odemeler (satis_id, odeme_tutari, odeme_turu, aciklama) 
                          VALUES (:satis_id, :odeme_tutari, :odeme_turu, :aciklama)";
                
                $stmt = $this->db->prepare($query);
                $stmt->execute([
                    ':satis_id' => $satis_id,
                    ':odeme_tutari' => $data['odenen_tutar'],
                    ':odeme_turu' => $data['odeme_turu'] ?? 'nakit',
                    ':aciklama' => 'İlk ödeme'
                ]);
            }

            $this->db->commit();
            return ['success' => true, 'satis_id' => $satis_id];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    // Tüm satışları getir
    public function getAllSales($limit = 50) {
        $query = "SELECT s.*, m.ad as musteri_ad, m.soyad as musteri_soyad
                  FROM satislar s 
                  LEFT JOIN musteriler m ON s.musteri_id = m.id 
                  ORDER BY s.olusturma_tarihi DESC 
                  LIMIT :limit";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    // Satış detaylarını getir
    public function getSaleDetails($satis_id) {
        // Satış bilgileri
        $query = "SELECT s.*, m.ad as musteri_ad, m.soyad as musteri_soyad, m.telefon as musteri_telefon
                  FROM satislar s 
                  LEFT JOIN musteriler m ON s.musteri_id = m.id 
                  WHERE s.id = :satis_id";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':satis_id' => $satis_id]);
        $satis = $stmt->fetch();

        if (!$satis) {
            return ['success' => false, 'error' => 'Satış bulunamadı'];
        }

        // Satış detayları
        $query = "SELECT sd.*, u.ad as urun_ad, u.birim
                  FROM satis_detaylari sd 
                  JOIN urunler u ON sd.urun_id = u.id 
                  WHERE sd.satis_id = :satis_id";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':satis_id' => $satis_id]);
        $detaylar = $stmt->fetchAll();

        // Ödemeler
        $query = "SELECT * FROM odemeler WHERE satis_id = :satis_id ORDER BY odeme_tarihi DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':satis_id' => $satis_id]);
        $odemeler = $stmt->fetchAll();

        return [
            'success' => true,
            'satis' => $satis,
            'detaylar' => $detaylar,
            'odemeler' => $odemeler
        ];
    }

    // Ödeme ekle
    public function addPayment($data) {
        try {
            $this->db->beginTransaction();

            // Satış bilgilerini al
            $query = "SELECT kalan_borc FROM satislar WHERE id = :satis_id";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':satis_id' => $data['satis_id']]);
            $satis = $stmt->fetch();

            if (!$satis) {
                throw new Exception('Satış bulunamadı');
            }

            if ($satis['kalan_borc'] <= 0) {
                throw new Exception('Bu satışın borcu bulunmamaktadır');
            }

            // Ödeme kaydı ekle
            $query = "INSERT INTO odemeler (satis_id, odeme_tutari, odeme_turu, aciklama) 
                      VALUES (:satis_id, :odeme_tutari, :odeme_turu, :aciklama)";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':satis_id' => $data['satis_id'],
                ':odeme_tutari' => $data['odeme_tutari'],
                ':odeme_turu' => $data['odeme_turu'] ?? 'nakit',
                ':aciklama' => $data['aciklama'] ?? ''
            ]);

            // Satışı güncelle
            $yeni_kalan_borc = max(0, $satis['kalan_borc'] - $data['odeme_tutari']);
            $yeni_durum = $yeni_kalan_borc > 0 ? 'beklemede' : 'tamamlandi';
            
            $query = "UPDATE satislar SET 
                      odenen_tutar = odenen_tutar + :odeme_tutari, 
                      kalan_borc = :yeni_kalan_borc, 
                      durum = :yeni_durum 
                      WHERE id = :satis_id";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':odeme_tutari' => $data['odeme_tutari'],
                ':yeni_kalan_borc' => $yeni_kalan_borc,
                ':yeni_durum' => $yeni_durum,
                ':satis_id' => $data['satis_id']
            ]);

            $this->db->commit();
            return ['success' => true];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    // Bekleyen borçları getir
    public function getPendingDebts() {
        $query = "SELECT s.*, m.ad as musteri_ad, m.soyad as musteri_soyad, m.telefon as musteri_telefon,
                  DATEDIFF(CURDATE(), s.vade_tarihi) as geciken_gun
                  FROM satislar s 
                  LEFT JOIN musteriler m ON s.musteri_id = m.id 
                  WHERE s.kalan_borc > 0 
                  ORDER BY 
                    CASE 
                      WHEN s.vade_tarihi IS NOT NULL AND s.vade_tarihi < CURDATE() THEN 0
                      ELSE 1 
                    END,
                    s.vade_tarihi ASC, 
                    s.olusturma_tarihi DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    // Dashboard istatistikleri
    public function getDashboardStats() {
        $stats = [];

        // Bugünkü satışlar
        $query = "SELECT COUNT(*) as sayi, COALESCE(SUM(toplam_tutar), 0) as tutar 
                  FROM satislar 
                  WHERE DATE(olusturma_tarihi) = CURDATE()";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $stats['bugun'] = $stmt->fetch();

        // Bu ay satışlar
        $query = "SELECT COUNT(*) as sayi, COALESCE(SUM(toplam_tutar), 0) as tutar 
                  FROM satislar 
                  WHERE YEAR(olusturma_tarihi) = YEAR(CURDATE()) 
                  AND MONTH(olusturma_tarihi) = MONTH(CURDATE())";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $stats['bu_ay'] = $stmt->fetch();

        // Toplam borç
        $query = "SELECT COALESCE(SUM(kalan_borc), 0) as toplam_borc 
                  FROM satislar 
                  WHERE kalan_borc > 0";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $stats['toplam_borc'] = $stmt->fetch();

        // Vadesi geçmiş borçlar
        $query = "SELECT COUNT(*) as sayi, COALESCE(SUM(kalan_borc), 0) as tutar 
                  FROM satislar 
                  WHERE kalan_borc > 0 
                  AND vade_tarihi IS NOT NULL 
                  AND vade_tarihi < CURDATE()";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $stats['vadesi_gecmis'] = $stmt->fetch();

        return $stats;
    }

    // Stok hareketi ekle
    private function addStockMovement($urun_id, $hareket_tipi, $miktar, $aciklama, $referans_id = null) {
        $query = "INSERT INTO stok_hareketleri (urun_id, hareket_tipi, miktar, aciklama, referans_id, referans_tipi) 
                  VALUES (:urun_id, :hareket_tipi, :miktar, :aciklama, :referans_id, 'satis')";
        
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            ':urun_id' => $urun_id,
            ':hareket_tipi' => $hareket_tipi,
            ':miktar' => $miktar,
            ':aciklama' => $aciklama,
            ':referans_id' => $referans_id
        ]);
    }

    // Satış sil
    public function deleteSale($id) {
        try {
            $this->db->beginTransaction();

            // Önce satış detaylarını al (stok iadesi için)
            $query = "SELECT sd.urun_id, sd.miktar 
                      FROM satis_detaylari sd 
                      WHERE sd.satis_id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':id' => $id]);
            $detaylar = $stmt->fetchAll();

            // Stokları iade et
            foreach ($detaylar as $detay) {
                $query = "UPDATE urunler SET stok_miktari = stok_miktari + :miktar WHERE id = :urun_id";
                $stmt = $this->db->prepare($query);
                $stmt->execute([
                    ':miktar' => $detay['miktar'], 
                    ':urun_id' => $detay['urun_id']
                ]);

                // Stok hareketi ekle
                $this->addStockMovement($detay['urun_id'], 'giris', $detay['miktar'], 'Satış iptali - #' . $id, $id);
            }

            // Satışı sil (cascade delete detayları da siler)
            $query = "DELETE FROM satislar WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':id' => $id]);

            // Ödemeleri sil
            $query = "DELETE FROM odemeler WHERE satis_id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':id' => $id]);

            $this->db->commit();
            return ['success' => true];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}

// API routing
$api = new SalesAPI();
$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch($method) {
        case 'GET':
            if (strpos($request, '/details/') !== false) {
                $path_parts = explode('/', trim($request, '/'));
                $id = end($path_parts);
                echo json_encode($api->getSaleDetails($id));
            } elseif (strpos($request, '/debts') !== false) {
                echo json_encode($api->getPendingDebts());
            } elseif (strpos($request, '/stats') !== false) {
                echo json_encode($api->getDashboardStats());
            } else {
                $limit = $_GET['limit'] ?? 50;
                echo json_encode($api->getAllSales($limit));
            }
            break;
            
        case 'POST':
            if (strpos($request, '/payment') !== false) {
                echo json_encode($api->addPayment($input));
            } else {
                echo json_encode($api->createSale($input));
            }
            break;
            
        case 'DELETE':
            $path_parts = explode('/', trim($request, '/'));
            $id = end($path_parts);
            echo json_encode($api->deleteSale($id));
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Desteklenmeyen metot']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>