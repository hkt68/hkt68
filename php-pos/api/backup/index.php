<?php
// Elite Medya Bilişim POS - Backup & Restore API
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
    
    switch ($method) {
        case 'GET':
            if ($path[0] === 'export') {
                // Export system data
                exportSystemData($db);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;
            
        case 'POST':
            if ($path[0] === 'import') {
                // Import system data
                importSystemData($db);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }

} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}

// Export all system data for backup
function exportSystemData($db) {
    $backupData = [
        'export_date' => date('c'),
        'version' => '1.0',
        'system' => 'Elite Medya Bilişim POS',
        'data' => []
    ];
    
    // Collections to backup
    $collections = [
        'categories',
        'products', 
        'customers',
        'sales',
        'credit_sales',
        'payments',
        'stock_transactions'
    ];
    
    foreach ($collections as $table) {
        try {
            $sql = "SELECT * FROM $table";
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $data = $stmt->fetchAll();
            
            $backupData['data'][$table] = $data;
            
        } catch (Exception $e) {
            // Log error but continue with other tables
            error_log("Backup error for table $table: " . $e->getMessage());
            $backupData['data'][$table] = [];
        }
    }
    
    // Set headers for file download
    $filename = 'elite-pos-backup-' . date('Y-m-d-H-i-s') . '.json';
    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen(json_encode($backupData)));
    
    echo json_encode($backupData, JSON_PRETTY_PRINT);
    exit;
}

// Import system data from backup
function importSystemData($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['data']) || !is_array($input['data'])) {
        sendError('Invalid backup format - missing data section');
    }
    
    $db->beginTransaction();
    
    try {
        $importResults = [];
        
        // Define import order (to handle foreign key constraints)
        $importOrder = [
            'categories',
            'customers', 
            'products',
            'sales',
            'credit_sales',
            'payments',
            'stock_transactions'
        ];
        
        foreach ($importOrder as $table) {
            if (!isset($input['data'][$table])) {
                $importResults[$table] = 0;
                continue;
            }
            
            $records = $input['data'][$table];
            
            if (empty($records)) {
                $importResults[$table] = 0;
                continue;
            }
            
            // Clear existing data
            $clearSql = "DELETE FROM $table";
            $clearStmt = $db->prepare($clearSql);
            $clearStmt->execute();
            
            // Get column names from first record
            $columns = array_keys($records[0]);
            $placeholders = str_repeat('?,', count($columns) - 1) . '?';
            
            $insertSql = "INSERT INTO $table (" . implode(',', $columns) . ") VALUES ($placeholders)";
            $insertStmt = $db->prepare($insertSql);
            
            $imported = 0;
            foreach ($records as $record) {
                try {
                    $values = array_values($record);
                    $insertStmt->execute($values);
                    $imported++;
                } catch (Exception $e) {
                    // Log error but continue with next record
                    error_log("Import error for $table record: " . $e->getMessage());
                }
            }
            
            $importResults[$table] = $imported;
        }
        
        $db->commit();
        
        sendSuccess([
            'imported_collections' => $importResults,
            'total_records' => array_sum($importResults)
        ], 'Backup imported successfully');
        
    } catch (Exception $e) {
        $db->rollback();
        sendError('Import failed: ' . $e->getMessage());
    }
}

// Additional utility endpoints

// Get backup statistics
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['stats'])) {
    getBackupStats($db);
}

function getBackupStats($db) {
    $stats = [];
    
    $tables = ['categories', 'products', 'customers', 'sales', 'credit_sales', 'payments', 'stock_transactions'];
    
    foreach ($tables as $table) {
        try {
            $sql = "SELECT COUNT(*) as count FROM $table";
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch();
            $stats[$table] = intval($result['count']);
        } catch (Exception $e) {
            $stats[$table] = 0;
        }
    }
    
    // Calculate total size estimate
    $totalRecords = array_sum($stats);
    $estimatedSizeKB = $totalRecords * 0.5; // Rough estimate
    
    $stats['summary'] = [
        'total_records' => $totalRecords,
        'estimated_size_kb' => round($estimatedSizeKB, 2),
        'last_updated' => date('c'),
        'tables_count' => count($tables)
    ];
    
    sendSuccess($stats);
}
?>