<?php
// Elit Bilişim - POS Sistemi
// Ürün API Endpoints

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

class ProductAPI {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // Tüm ürünleri getir
    public function getAllProducts() {
        $query = "SELECT u.*, k.ad as kategori_ad, k.renk as kategori_renk
                  FROM urunler u 
                  LEFT JOIN kategoriler k ON u.kategori_id = k.id 
                  WHERE u.aktif = 1 
                  ORDER BY u.ad";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    // Ürün ekle
    public function addProduct($data) {
        $query = "INSERT INTO urunler (ad, barkod, kategori_id, alis_fiyati, satis_fiyati, stok_miktari, min_stok_seviyesi, birim, aciklama) 
                  VALUES (:ad, :barkod, :kategori_id, :alis_fiyati, :satis_fiyati, :stok_miktari, :min_stok_seviyesi, :birim, :aciklama)";
        
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute([
            ':ad' => $data['ad'],
            ':barkod' => $data['barkod'] ?? null,
            ':kategori_id' => $data['kategori_id'],
            ':alis_fiyati' => $data['alis_fiyati'] ?? 0,
            ':satis_fiyati' => $data['satis_fiyati'],
            ':stok_miktari' => $data['stok_miktari'] ?? 0,
            ':min_stok_seviyesi' => $data['min_stok_seviyesi'] ?? 5,
            ':birim' => $data['birim'] ?? 'adet',
            ':aciklama' => $data['aciklama'] ?? ''
        ]);

        if ($result) {
            $urun_id = $this->db->lastInsertId();
            
            // Stok hareketi ekle
            if (!empty($data['stok_miktari']) && $data['stok_miktari'] > 0) {
                $this->addStockMovement($urun_id, 'giris', $data['stok_miktari'], 'İlk stok girişi');
            }
            
            return ['success' => true, 'id' => $urun_id];
        }
        return ['success' => false, 'error' => 'Ürün eklenemedi'];
    }

    // Ürün güncelle
    public function updateProduct($id, $data) {
        $query = "UPDATE urunler SET 
                  ad = :ad, 
                  barkod = :barkod, 
                  kategori_id = :kategori_id, 
                  alis_fiyati = :alis_fiyati, 
                  satis_fiyati = :satis_fiyati,
                  min_stok_seviyesi = :min_stok_seviyesi,
                  birim = :birim,
                  aciklama = :aciklama
                  WHERE id = :id";
        
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute([
            ':id' => $id,
            ':ad' => $data['ad'],
            ':barkod' => $data['barkod'] ?? null,
            ':kategori_id' => $data['kategori_id'],
            ':alis_fiyati' => $data['alis_fiyati'] ?? 0,
            ':satis_fiyati' => $data['satis_fiyati'],
            ':min_stok_seviyesi' => $data['min_stok_seviyesi'] ?? 5,
            ':birim' => $data['birim'] ?? 'adet',
            ':aciklama' => $data['aciklama'] ?? ''
        ]);

        return ['success' => $result];
    }

    // Stok güncelle
    public function updateStock($id, $yeni_stok, $aciklama = 'Manuel stok düzeltmesi') {
        // Mevcut stoğu al
        $query = "SELECT stok_miktari FROM urunler WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);
        $mevcut = $stmt->fetch();
        
        if (!$mevcut) {
            return ['success' => false, 'error' => 'Ürün bulunamadı'];
        }

        $eski_stok = $mevcut['stok_miktari'];
        $fark = $yeni_stok - $eski_stok;
        
        // Stoğu güncelle
        $query = "UPDATE urunler SET stok_miktari = :yeni_stok WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute([':id' => $id, ':yeni_stok' => $yeni_stok]);

        if ($result && $fark != 0) {
            // Stok hareketi ekle
            $hareket_tipi = $fark > 0 ? 'giris' : 'cikis';
            $this->addStockMovement($id, $hareket_tipi, abs($fark), $aciklama);
        }

        return ['success' => $result];
    }

    // Stok hareketi ekle
    private function addStockMovement($urun_id, $hareket_tipi, $miktar, $aciklama) {
        $query = "INSERT INTO stok_hareketleri (urun_id, hareket_tipi, miktar, aciklama, referans_tipi) 
                  VALUES (:urun_id, :hareket_tipi, :miktar, :aciklama, 'manuel')";
        
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            ':urun_id' => $urun_id,
            ':hareket_tipi' => $hareket_tipi,
            ':miktar' => $miktar,
            ':aciklama' => $aciklama
        ]);
    }

    // Ürün sil (soft delete)
    public function deleteProduct($id) {
        $query = "UPDATE urunler SET aktif = 0 WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return ['success' => $stmt->execute([':id' => $id])];
    }

    // Düşük stoklu ürünler
    public function getLowStockProducts() {
        $query = "SELECT u.*, k.ad as kategori_ad 
                  FROM urunler u 
                  LEFT JOIN kategoriler k ON u.kategori_id = k.id 
                  WHERE u.aktif = 1 AND u.stok_miktari <= u.min_stok_seviyesi 
                  ORDER BY (u.stok_miktari - u.min_stok_seviyesi)";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
}

// API routing
$api = new ProductAPI();
$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];

// JSON input'u parse et
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch($method) {
        case 'GET':
            if (strpos($request, '/low-stock') !== false) {
                echo json_encode($api->getLowStockProducts());
            } else {
                echo json_encode($api->getAllProducts());
            }
            break;
            
        case 'POST':
            if ($input) {
                echo json_encode($api->addProduct($input));
            } else {
                echo json_encode(['success' => false, 'error' => 'Geçersiz veri']);
            }
            break;
            
        case 'PUT':
            $path_parts = explode('/', trim($request, '/'));
            $id = end($path_parts);
            
            if (strpos($request, '/stock') !== false) {
                echo json_encode($api->updateStock($id, $input['yeni_stok'], $input['aciklama'] ?? null));
            } else {
                echo json_encode($api->updateProduct($id, $input));
            }
            break;
            
        case 'DELETE':
            $path_parts = explode('/', trim($request, '/'));
            $id = end($path_parts);
            echo json_encode($api->deleteProduct($id));
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Desteklenmeyen metot']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>