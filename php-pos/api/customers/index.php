<?php
// Elite Medya Bilişim POS - Customers API
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
    
    switch ($method) {
        case 'GET':
            if (empty($path[0])) {
                // Get all customers with debt summary
                getCustomers($db);
            } elseif ($path[0] && $path[1] === 'account-summary') {
                // Get customer account summary
                getCustomerAccountSummary($db, $path[0]);
            } elseif ($path[0] && $path[1] === 'purchase-history') {
                // Get customer purchase history  
                getCustomerPurchaseHistory($db, $path[0]);
            } elseif ($path[0] && $path[1] === 'detailed-report') {
                // Get detailed report for customer
                getCustomerDetailedReport($db, $path[0]);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;
            
        case 'POST':
            if (empty($path[0])) {
                // Create new customer
                createCustomer($db);
            } elseif ($path[0] && $path[1] === 'manual-credit') {
                // Add manual credit to customer
                addManualCredit($db, $path[0]);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;
            
        case 'PUT':
            if ($path[0]) {
                // Update customer
                updateCustomer($db, $path[0]);
            } else {
                sendError('Customer ID required', 400);
            }
            break;
            
        case 'DELETE':
            if ($path[0]) {
                // Delete customer (soft delete)
                deleteCustomer($db, $path[0]);
            } else {
                sendError('Customer ID required', 400);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }

} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}

// Get all customers with debt information
function getCustomers($db) {
    $search = $_GET['search'] ?? '';
    $active_only = $_GET['active_only'] ?? 'true';
    
    $sql = "SELECT 
                c.id,
                c.name,
                c.phone,
                c.email,
                c.address,
                c.credit_limit,
                c.notes,
                c.is_active,
                c.created_at,
                cds.total_debt as current_debt,
                cds.overdue_debt,
                cds.available_credit,
                cds.has_overdue
            FROM customers c
            LEFT JOIN customer_debt_summary cds ON c.id = cds.id
            WHERE 1=1";
    
    $params = [];
    
    if ($active_only === 'true') {
        $sql .= " AND c.is_active = 1";
    }
    
    if (!empty($search)) {
        $sql .= " AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $sql .= " ORDER BY c.name ASC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $customers = $stmt->fetchAll();
    
    // Convert numeric strings to proper types
    foreach ($customers as &$customer) {
        $customer['current_debt'] = floatval($customer['current_debt'] ?? 0);
        $customer['overdue_debt'] = floatval($customer['overdue_debt'] ?? 0);
        $customer['available_credit'] = floatval($customer['available_credit'] ?? 0);
        $customer['has_overdue'] = boolval($customer['has_overdue']);
        $customer['credit_limit'] = floatval($customer['credit_limit']);
        $customer['is_active'] = boolval($customer['is_active']);
    }
    
    sendSuccess($customers);
}

// Get customer account summary
function getCustomerAccountSummary($db, $customerId) {
    $sql = "SELECT 
                c.id,
                c.name,
                c.credit_limit,
                cds.total_debt,
                cds.overdue_debt,
                cds.available_credit,
                cds.has_overdue
            FROM customers c
            LEFT JOIN customer_debt_summary cds ON c.id = cds.id
            WHERE c.id = ? AND c.is_active = 1";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$customerId]);
    $summary = $stmt->fetch();
    
    if (!$summary) {
        sendError('Customer not found', 404);
    }
    
    // Get recent payments
    $paymentsSql = "SELECT id, amount, payment_method, created_at, notes 
                   FROM payments 
                   WHERE customer_id = ? 
                   ORDER BY created_at DESC 
                   LIMIT 10";
    
    $paymentsStmt = $db->prepare($paymentsSql);
    $paymentsStmt->execute([$customerId]);
    $recentPayments = $paymentsStmt->fetchAll();
    
    // Get recent credit sales
    $creditSql = "SELECT id, total_amount, remaining_amount, due_date, payment_status, created_at 
                 FROM credit_sales 
                 WHERE customer_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 10";
    
    $creditStmt = $db->prepare($creditSql);
    $creditStmt->execute([$customerId]);
    $recentCredits = $creditStmt->fetchAll();
    
    // Convert types
    $summary['total_debt'] = floatval($summary['total_debt'] ?? 0);
    $summary['overdue_debt'] = floatval($summary['overdue_debt'] ?? 0);
    $summary['available_credit'] = floatval($summary['available_credit'] ?? 0);
    $summary['credit_limit'] = floatval($summary['credit_limit']);
    $summary['has_overdue'] = boolval($summary['has_overdue']);
    
    foreach ($recentPayments as &$payment) {
        $payment['amount'] = floatval($payment['amount']);
    }
    
    foreach ($recentCredits as &$credit) {
        $credit['total_amount'] = floatval($credit['total_amount']);
        $credit['remaining_amount'] = floatval($credit['remaining_amount']);
    }
    
    $summary['recent_payments'] = $recentPayments;
    $summary['recent_credits'] = $recentCredits;
    
    sendSuccess($summary);
}

// Get customer purchase history
function getCustomerPurchaseHistory($db, $customerId) {
    $sql = "SELECT 
                s.id as sale_id,
                p.name as product_name,
                s.quantity,
                s.unit_price,
                s.total_amount,
                s.payment_method,
                s.created_at as date,
                s.notes,
                'sale' as type,
                CASE 
                    WHEN s.payment_method = 'credit' THEN 'credit'
                    ELSE s.payment_method
                END as payment_status
            FROM sales s
            JOIN products p ON s.product_id = p.id
            WHERE s.customer_id = ?
            
            UNION ALL
            
            SELECT 
                cs.id as sale_id,
                'Manuel Borç Girişi' as product_name,
                1 as quantity,
                cs.total_amount as unit_price,
                cs.total_amount,
                'credit' as payment_method,
                cs.created_at as date,
                cs.notes,
                'manual_credit' as type,
                cs.payment_status
            FROM credit_sales cs
            WHERE cs.customer_id = ? 
            AND (cs.sale_ids IS NULL OR JSON_LENGTH(cs.sale_ids) = 0)
            
            ORDER BY date DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$customerId, $customerId]);
    $history = $stmt->fetchAll();
    
    // Convert types
    foreach ($history as &$item) {
        $item['quantity'] = intval($item['quantity']);
        $item['unit_price'] = floatval($item['unit_price']);
        $item['total_amount'] = floatval($item['total_amount']);
    }
    
    sendSuccess($history);
}

// Create new customer
function createCustomer($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    validateRequired($input, ['name']);
    
    $id = Database::generateId('cust');
    
    $sql = "INSERT INTO customers (id, name, phone, email, address, tax_number, credit_limit, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $db->prepare($sql);
    $result = $stmt->execute([
        $id,
        sanitizeInput($input['name']),
        sanitizeInput($input['phone'] ?? ''),
        sanitizeInput($input['email'] ?? ''),
        sanitizeInput($input['address'] ?? ''),
        sanitizeInput($input['tax_number'] ?? ''),
        floatval($input['credit_limit'] ?? 5000),
        sanitizeInput($input['notes'] ?? '')
    ]);
    
    if ($result) {
        sendSuccess(['id' => $id], 'Customer created successfully');
    } else {
        sendError('Failed to create customer');
    }
}

// Update customer
function updateCustomer($db, $customerId) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    validateRequired($input, ['name']);
    
    $sql = "UPDATE customers 
            SET name = ?, phone = ?, email = ?, address = ?, tax_number = ?, credit_limit = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?";
    
    $stmt = $db->prepare($sql);
    $result = $stmt->execute([
        sanitizeInput($input['name']),
        sanitizeInput($input['phone'] ?? ''),
        sanitizeInput($input['email'] ?? ''),
        sanitizeInput($input['address'] ?? ''),
        sanitizeInput($input['tax_number'] ?? ''),
        floatval($input['credit_limit'] ?? 5000),
        sanitizeInput($input['notes'] ?? ''),
        $customerId
    ]);
    
    if ($result && $stmt->rowCount() > 0) {
        sendSuccess(['id' => $customerId], 'Customer updated successfully');
    } else {
        sendError('Customer not found or no changes made');
    }
}

// Add manual credit to customer
function addManualCredit($db, $customerId) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    validateRequired($input, ['amount', 'notes']);
    
    $amount = floatval($input['amount']);
    if ($amount <= 0) {
        sendError('Amount must be positive');
    }
    
    // Check if customer exists
    $checkSql = "SELECT id, name FROM customers WHERE id = ? AND is_active = 1";
    $checkStmt = $db->prepare($checkSql);
    $checkStmt->execute([$customerId]);
    $customer = $checkStmt->fetch();
    
    if (!$customer) {
        sendError('Customer not found', 404);
    }
    
    $creditId = Database::generateId('credit');
    $dueDate = !empty($input['due_date']) ? $input['due_date'] : null;
    
    $sql = "INSERT INTO credit_sales (id, customer_id, total_amount, remaining_amount, due_date, notes, payment_status) 
            VALUES (?, ?, ?, ?, ?, ?, 'unpaid')";
    
    $stmt = $db->prepare($sql);
    $result = $stmt->execute([
        $creditId,
        $customerId,
        $amount,
        $amount,
        $dueDate,
        sanitizeInput($input['notes'])
    ]);
    
    if ($result) {
        sendSuccess(['id' => $creditId], 'Manual credit added successfully');
    } else {
        sendError('Failed to add manual credit');
    }
}

// Get detailed report for customer
function getCustomerDetailedReport($db, $customerId) {
    // Get customer info
    $customerSql = "SELECT * FROM customers WHERE id = ? AND is_active = 1";
    $customerStmt = $db->prepare($customerSql);
    $customerStmt->execute([$customerId]);
    $customer = $customerStmt->fetch();
    
    if (!$customer) {
        sendError('Customer not found', 404);
    }
    
    // Get account summary
    $summarySql = "SELECT * FROM customer_debt_summary WHERE id = ?";
    $summaryStmt = $db->prepare($summarySql);
    $summaryStmt->execute([$customerId]);
    $summary = $summaryStmt->fetch();
    
    // Get all transactions
    $transactionsSql = "
        SELECT 'payment' as type, amount, payment_method, created_at, notes FROM payments WHERE customer_id = ?
        UNION ALL
        SELECT 'credit' as type, total_amount as amount, 'credit' as payment_method, created_at, notes FROM credit_sales WHERE customer_id = ?
        ORDER BY created_at DESC
    ";
    
    $transStmt = $db->prepare($transactionsSql);
    $transStmt->execute([$customerId, $customerId]);
    $transactions = $transStmt->fetchAll();
    
    $report = [
        'customer' => $customer,
        'summary' => $summary ?: [],
        'transactions' => $transactions,
        'generated_at' => date('Y-m-d H:i:s')
    ];
    
    sendSuccess($report);
}

// Delete customer (soft delete)
function deleteCustomer($db, $customerId) {
    $sql = "UPDATE customers SET is_active = 0 WHERE id = ?";
    $stmt = $db->prepare($sql);
    $result = $stmt->execute([$customerId]);
    
    if ($result && $stmt->rowCount() > 0) {
        sendSuccess(['id' => $customerId], 'Customer deleted successfully');
    } else {
        sendError('Customer not found');
    }
}
?>