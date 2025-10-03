<?php
// Elite Medya Bilişim POS - API Router
// Main API entry point for elitmedyabilisim.shop

require_once 'config/database.php';

// API Router - Route requests to appropriate handlers
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = $_SERVER['SCRIPT_NAME'];

// Remove script name from URI to get clean path
$path = str_replace(dirname($scriptName), '', $requestUri);
$path = trim($path, '/');

// Remove query string
if (($pos = strpos($path, '?')) !== false) {
    $path = substr($path, 0, $pos);
}

// Split path into segments
$pathSegments = explode('/', $path);

// Remove 'api' from path if present
if (!empty($pathSegments[0]) && $pathSegments[0] === 'api') {
    array_shift($pathSegments);
}

// Route to appropriate handler
if (empty($pathSegments[0])) {
    // Root API endpoint - show API info
    showApiInfo();
} else {
    $endpoint = $pathSegments[0];
    
    switch ($endpoint) {
        case 'customers':
            // Set PATH_INFO for customers handler
            $_SERVER['PATH_INFO'] = '/' . implode('/', array_slice($pathSegments, 1));
            include 'customers/index.php';
            break;
            
        case 'payments':
            $_SERVER['PATH_INFO'] = '/' . implode('/', array_slice($pathSegments, 1));
            include 'payments/index.php';
            break;
            
        case 'backup':
            $_SERVER['PATH_INFO'] = '/' . implode('/', array_slice($pathSegments, 1));
            include 'backup/index.php';
            break;
            
        case 'health':
            checkHealth();
            break;
            
        case 'products':
            include 'products/index.php';
            break;
            
        case 'sales':
            include 'sales/index.php';
            break;
            
        default:
            sendError('Endpoint not found: ' . $endpoint, 404);
    }
}

// Show API information
function showApiInfo() {
    $info = [
        'name' => 'Elite Medya Bilişim POS API',
        'version' => '1.0.0',
        'status' => 'active',
        'endpoints' => [
            'GET /api/health' => 'System health check',
            'GET /api/customers' => 'Get all customers',
            'POST /api/customers' => 'Create new customer',
            'GET /api/customers/{id}/account-summary' => 'Get customer account summary',
            'POST /api/customers/{id}/manual-credit' => 'Add manual credit',
            'POST /api/payments/customer' => 'Record customer payment',
            'GET /api/backup/export' => 'Export system data',
            'POST /api/backup/import' => 'Import system data',
        ],
        'documentation' => 'https://elitmedyabilisim.shop/api-docs',
        'timestamp' => date('c')
    ];
    
    sendSuccess($info);
}

// Health check endpoint
function checkHealth() {
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        // Test database connection
        $stmt = $db->query('SELECT 1');
        $dbStatus = $stmt ? 'connected' : 'disconnected';
        
        // Get basic stats
        $customerCount = 0;
        $productCount = 0;
        
        try {
            $stmt = $db->query('SELECT COUNT(*) as count FROM customers WHERE is_active = 1');
            $result = $stmt->fetch();
            $customerCount = $result['count'];
            
            $stmt = $db->query('SELECT COUNT(*) as count FROM products WHERE is_active = 1');
            $result = $stmt->fetch();
            $productCount = $result['count'];
        } catch (Exception $e) {
            // Tables might not exist yet
        }
        
        $health = [
            'status' => 'healthy',
            'timestamp' => date('c'),
            'database' => $dbStatus,
            'stats' => [
                'customers' => $customerCount,
                'products' => $productCount
            ],
            'php_version' => PHP_VERSION,
            'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB'
        ];
        
        sendSuccess($health);
        
    } catch (Exception $e) {
        http_response_code(503);
        sendError('Health check failed: ' . $e->getMessage());
    }
}
?>