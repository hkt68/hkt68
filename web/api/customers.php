<?php
// Elit Bilişim - POS Sistemi
// Müşteri API Endpoints

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

class CustomerAPI {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // Tüm müşterileri getir
    public function getAllCustomers() {
        $query = "SELECT m.*, 
                  COALESCE(SUM(s.kalan_borc), 0) as toplam_borc,
                  COUNT(s.id) as toplam_satis
                  FROM musteriler m 
                  LEFT JOIN satislar s ON m.id = s.musteri_id
                  WHERE m.aktif = 1 
                  GROUP BY m.id
                  ORDER BY m.ad, m.soyad";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    // Müşteri ekle
    public function addCustomer($data) {
        $query = "INSERT INTO musteriler (ad, soyad, telefon, email, adres, borc_limiti) 
                  VALUES (:ad, :soyad, :telefon, :email, :adres, :borc_limiti)";
        
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute([
            ':ad' => $data['ad'],
            ':soyad' => $data['soyad'] ?? '',
            ':telefon' => $data['telefon'] ?? '',
            ':email' => $data['email'] ?? '',
            ':adres' => $data['adres'] ?? '',
            ':borc_limiti' => $data['borc_limiti'] ?? 0
        ]);

        if ($result) {
            return ['success' => true, 'id' => $this->db->lastInsertId()];
        }
        return ['success' => false, 'error' => 'Müşteri eklenemedi'];
    }

    // Müşteri güncelle
    public function updateCustomer($id, $data) {
        $query = "UPDATE musteriler SET 
                  ad = :ad, 
                  soyad = :soyad, 
                  telefon = :telefon, 
                  email = :email, 
                  adres = :adres,
                  borc_limiti = :borc_limiti
                  WHERE id = :id";
        
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute([
            ':id' => $id,
            ':ad' => $data['ad'],
            ':soyad' => $data['soyad'] ?? '',
            ':telefon' => $data['telefon'] ?? '',
            ':email' => $data['email'] ?? '',
            ':adres' => $data['adres'] ?? '',
            ':borc_limiti' => $data['borc_limiti'] ?? 0
        ]);

        return ['success' => $result];
    }

    // Müşteri sil (soft delete)
    public function deleteCustomer($id) {
        // Önce müşteriye ait bekleyen borç var mı kontrol et
        $query = "SELECT SUM(kalan_borc) as toplam_borc FROM satislar WHERE musteri_id = :id AND kalan_borc > 0";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        
        if ($result['toplam_borc'] > 0) {
            return ['success' => false, 'error' => 'Bu müşterinin bekleyen borcu bulunmaktadır.'];
        }
        
        // Müşteriyi sil
        $query = "UPDATE musteriler SET aktif = 0 WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return ['success' => $stmt->execute([':id' => $id])];
    }

    // Müşteri arama
    public function searchCustomers($query) {
        $search = "%{$query}%";
        $sql = "SELECT * FROM musteriler 
                WHERE aktif = 1 AND (
                  ad LIKE :search1 OR 
                  soyad LIKE :search2 OR 
                  telefon LIKE :search3
                )
                ORDER BY ad, soyad
                LIMIT 20";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':search1' => $search,
            ':search2' => $search, 
            ':search3' => $search
        ]);
        
        return $stmt->fetchAll();
    }

    // Müşteri detayları (satış geçmişi ile)
    public function getCustomerDetails($id) {
        // Müşteri bilgileri
        $query = "SELECT m.*, 
                  COALESCE(SUM(s.kalan_borc), 0) as toplam_borc,
                  COUNT(s.id) as toplam_satis,
                  COALESCE(SUM(s.toplam_tutar), 0) as toplam_alisveris
                  FROM musteriler m 
                  LEFT JOIN satislar s ON m.id = s.musteri_id
                  WHERE m.id = :id AND m.aktif = 1";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);
        $musteri = $stmt->fetch();

        if (!$musteri) {
            return ['success' => false, 'error' => 'Müşteri bulunamadı'];
        }

        // Son satışlar
        $query = "SELECT s.*, 
                  CASE 
                    WHEN s.kalan_borc > 0 THEN 'Beklemede'
                    ELSE 'Tamamlandı'
                  END as durum_text
                  FROM satislar s 
                  WHERE s.musteri_id = :id 
                  ORDER BY s.olusturma_tarihi DESC 
                  LIMIT 10";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);
        $satislar = $stmt->fetchAll();

        return [
            'success' => true,
            'musteri' => $musteri,
            'satislar' => $satislar
        ];
    }
}

// API routing
$api = new CustomerAPI();
$method = $_SERVER['REQUEST_METHOD'];
$request = $_SERVER['REQUEST_URI'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch($method) {
        case 'GET':
            if (strpos($request, '/search') !== false) {
                $q = $_GET['q'] ?? '';
                echo json_encode($api->searchCustomers($q));
            } elseif (strpos($request, '/details/') !== false) {
                $path_parts = explode('/', trim($request, '/'));
                $id = end($path_parts);
                echo json_encode($api->getCustomerDetails($id));
            } else {
                echo json_encode($api->getAllCustomers());
            }
            break;
            
        case 'POST':
            if ($input) {
                echo json_encode($api->addCustomer($input));
            } else {
                echo json_encode(['success' => false, 'error' => 'Geçersiz veri']);
            }
            break;
            
        case 'PUT':
            $path_parts = explode('/', trim($request, '/'));
            $id = end($path_parts);
            echo json_encode($api->updateCustomer($id, $input));
            break;
            
        case 'DELETE':
            $path_parts = explode('/', trim($request, '/'));
            $id = end($path_parts);
            echo json_encode($api->deleteCustomer($id));
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Desteklenmeyen metot']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>