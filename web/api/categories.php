<?php
// Elit Bilişim - POS Sistemi
// Kategori API Endpoints

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

class CategoryAPI {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // Tüm kategorileri getir
    public function getAllCategories() {
        $query = "SELECT k.*, 
                  COUNT(u.id) as urun_sayisi
                  FROM kategoriler k 
                  LEFT JOIN urunler u ON k.id = u.kategori_id AND u.aktif = 1
                  WHERE k.aktif = 1 
                  GROUP BY k.id
                  ORDER BY k.ad";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    // Kategori ekle
    public function addCategory($data) {
        $query = "INSERT INTO kategoriler (ad, aciklama, renk) VALUES (:ad, :aciklama, :renk)";
        
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute([
            ':ad' => $data['ad'],
            ':aciklama' => $data['aciklama'] ?? '',
            ':renk' => $data['renk'] ?? '#3B82F6'
        ]);

        if ($result) {
            return ['success' => true, 'id' => $this->db->lastInsertId()];
        }
        return ['success' => false, 'error' => 'Kategori eklenemedi'];
    }

    // Kategori güncelle
    public function updateCategory($id, $data) {
        $query = "UPDATE kategoriler SET ad = :ad, aciklama = :aciklama, renk = :renk WHERE id = :id";
        
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute([
            ':id' => $id,
            ':ad' => $data['ad'],
            ':aciklama' => $data['aciklama'] ?? '',
            ':renk' => $data['renk'] ?? '#3B82F6'
        ]);

        return ['success' => $result];
    }

    // Kategori sil (soft delete)
    public function deleteCategory($id) {
        // Önce kategoride ürün var mı kontrol et
        $query = "SELECT COUNT(*) as urun_sayisi FROM urunler WHERE kategori_id = :id AND aktif = 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);
        $result = $stmt->fetch();
        
        if ($result['urun_sayisi'] > 0) {
            return ['success' => false, 'error' => 'Bu kategoride ürünler bulunmaktadır. Önce ürünleri başka kategoriye taşıyın.'];
        }
        
        // Kategoriyi sil
        $query = "UPDATE kategoriler SET aktif = 0 WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return ['success' => $stmt->execute([':id' => $id])];
    }
}

// API routing
$api = new CategoryAPI();
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch($method) {
        case 'GET':
            echo json_encode($api->getAllCategories());
            break;
            
        case 'POST':
            if ($input) {
                echo json_encode($api->addCategory($input));
            } else {
                echo json_encode(['success' => false, 'error' => 'Geçersiz veri']);
            }
            break;
            
        case 'PUT':
            $path_parts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
            $id = end($path_parts);
            echo json_encode($api->updateCategory($id, $input));
            break;
            
        case 'DELETE':
            $path_parts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
            $id = end($path_parts);
            echo json_encode($api->deleteCategory($id));
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Desteklenmeyen metot']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>