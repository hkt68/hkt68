<?php
// Elite Medya Bilişim POS - Database Configuration
// elitmedyabilisim.shop hosting configuration

class Database {
    // Hosting database credentials - Bu bilgileri hosting panelinden alacaksınız
    private $host = 'localhost';  // Genellikle localhost
    private $db_name = 'elitmedya_pos';  // Veritabanı adınız
    private $username = 'elitmedya_user';  // MySQL kullanıcı adınız  
    private $password = 'your_password';  // MySQL şifreniz
    private $charset = 'utf8mb4';
    
    public $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed");
        }
        
        return $this->conn;
    }
    
    public static function generateId($prefix = '') {
        return $prefix . '_' . uniqid() . '_' . random_int(1000, 9999);
    }
}

// CORS Headers for API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Error handling function
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $message, 'success' => false]);
    exit;
}

// Success response function
function sendSuccess($data, $message = 'Success') {
    echo json_encode(['data' => $data, 'message' => $message, 'success' => true]);
    exit;
}

// Validate required fields
function validateRequired($data, $required_fields) {
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            sendError("Missing required field: $field");
        }
    }
}

// Sanitize input
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}
?>