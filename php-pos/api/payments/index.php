<?php
// Elite Medya Bilişim POS - Payments API  
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
    
    switch ($method) {
        case 'POST':
            if (empty($path[0])) {
                // Regular payment (credit sale payment)
                createPayment($db);
            } elseif ($path[0] === 'customer') {
                // Customer payment (can exceed debt)
                createCustomerPayment($db);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;
            
        case 'GET':
            if (empty($path[0])) {
                // Get payments with filters
                getPayments($db);
            } else {
                sendError('Invalid endpoint', 404);
            }
            break;
            
        case 'DELETE':
            if ($path[0]) {
                // Delete payment
                deletePayment($db, $path[0]);
            } else {
                sendError('Payment ID required', 400);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }

} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}

// Create customer payment (can exceed debt - creates credit balance)
function createCustomerPayment($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    validateRequired($input, ['customer_id', 'amount']);
    
    $customerId = $input['customer_id'];
    $amount = floatval($input['amount']);
    
    if ($amount <= 0) {
        sendError('Payment amount must be positive');
    }
    
    // Verify customer exists
    $customerSql = "SELECT id, name FROM customers WHERE id = ? AND is_active = 1";
    $customerStmt = $db->prepare($customerSql);
    $customerStmt->execute([$customerId]);
    $customer = $customerStmt->fetch();
    
    if (!$customer) {
        sendError('Customer not found', 404);
    }
    
    // Get current debt
    $debtSql = "SELECT COALESCE(SUM(remaining_amount), 0) as total_debt FROM credit_sales WHERE customer_id = ? AND payment_status != 'paid'";
    $debtStmt = $db->prepare($debtSql);
    $debtStmt->execute([$customerId]);
    $debtResult = $debtStmt->fetch();
    $currentDebt = floatval($debtResult['total_debt']);
    
    // Create payment record
    $paymentId = Database::generateId('pay');
    
    $paymentSql = "INSERT INTO payments (id, customer_id, amount, payment_method, reference_no, notes, payment_type, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?, 'customer_payment', ?)";
    
    $paymentStmt = $db->prepare($paymentSql);
    $result = $paymentStmt->execute([
        $paymentId,
        $customerId,
        $amount,
        sanitizeInput($input['payment_method'] ?? 'cash'),
        sanitizeInput($input['reference_no'] ?? ''),
        sanitizeInput($input['notes'] ?? ''),
        sanitizeInput($input['created_by'] ?? 'POS System')
    ]);
    
    if (!$result) {
        sendError('Failed to create payment record');
    }
    
    // Apply payment to credit sales (FIFO - oldest first)
    $remainingPayment = $amount;
    
    if ($currentDebt > 0) {
        $creditSalesSql = "SELECT id, remaining_amount FROM credit_sales 
                          WHERE customer_id = ? AND payment_status != 'paid' AND remaining_amount > 0 
                          ORDER BY created_at ASC";
        
        $creditStmt = $db->prepare($creditSalesSql);
        $creditStmt->execute([$customerId]);
        $creditSales = $creditStmt->fetchAll();
        
        foreach ($creditSales as $creditSale) {
            if ($remainingPayment <= 0) break;
            
            $creditRemaining = floatval($creditSale['remaining_amount']);
            $paymentForThisCredit = min($remainingPayment, $creditRemaining);
            
            // Update credit sale
            $newPaidAmount = $creditRemaining - $paymentForThisCredit;
            $newStatus = $newPaidAmount <= 0 ? 'paid' : 'partial';
            
            $updateCreditSql = "UPDATE credit_sales 
                               SET remaining_amount = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP 
                               WHERE id = ?";
            
            $updateStmt = $db->prepare($updateCreditSql);
            $updateStmt->execute([$newPaidAmount, $newStatus, $creditSale['id']]);
            
            $remainingPayment -= $paymentForThisCredit;
        }
    }
    
    // Calculate new balances
    $newDebt = max(0, $currentDebt - $amount);
    $creditBalance = $remainingPayment; // If payment exceeds debt, this is the credit balance
    
    $response = [
        'success' => true,
        'payment_id' => $paymentId,
        'amount' => $amount,
        'previous_debt' => $currentDebt,
        'remaining_debt' => $newDebt,
        'credit_balance' => $creditBalance,
        'message' => "Payment of ₺" . number_format($amount, 2) . " recorded successfully"
    ];
    
    sendSuccess($response);
}

// Create regular payment (for specific credit sale)
function createPayment($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    validateRequired($input, ['customer_id', 'credit_sale_id', 'amount']);
    
    $customerId = $input['customer_id'];
    $creditSaleId = $input['credit_sale_id'];
    $amount = floatval($input['amount']);
    
    if ($amount <= 0) {
        sendError('Payment amount must be positive');
    }
    
    // Verify credit sale exists and get details
    $creditSql = "SELECT cs.*, c.name as customer_name 
                 FROM credit_sales cs 
                 JOIN customers c ON cs.customer_id = c.id 
                 WHERE cs.id = ? AND cs.customer_id = ?";
    
    $creditStmt = $db->prepare($creditSql);
    $creditStmt->execute([$creditSaleId, $customerId]);
    $creditSale = $creditStmt->fetch();
    
    if (!$creditSale) {
        sendError('Credit sale not found', 404);
    }
    
    $remainingAmount = floatval($creditSale['remaining_amount']);
    
    if ($amount > $remainingAmount) {
        sendError("Payment amount cannot exceed remaining debt of ₺" . number_format($remainingAmount, 2));
    }
    
    // Create payment record
    $paymentId = Database::generateId('pay');
    
    $paymentSql = "INSERT INTO payments (id, customer_id, credit_sale_id, amount, payment_method, reference_no, notes, payment_type) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'credit_payment')";
    
    $paymentStmt = $db->prepare($paymentSql);
    $result = $paymentStmt->execute([
        $paymentId,
        $customerId,
        $creditSaleId,
        $amount,
        sanitizeInput($input['payment_method'] ?? 'cash'),
        sanitizeInput($input['reference_no'] ?? ''),
        sanitizeInput($input['notes'] ?? '')
    ]);
    
    if (!$result) {
        sendError('Failed to create payment');
    }
    
    // Update credit sale
    $newRemaining = $remainingAmount - $amount;
    $newPaidAmount = floatval($creditSale['paid_amount']) + $amount;
    $newStatus = $newRemaining <= 0 ? 'paid' : 'partial';
    
    $updateSql = "UPDATE credit_sales 
                 SET paid_amount = ?, remaining_amount = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?";
    
    $updateStmt = $db->prepare($updateSql);
    $updateStmt->execute([$newPaidAmount, $newRemaining, $newStatus, $creditSaleId]);
    
    sendSuccess([
        'payment_id' => $paymentId,
        'amount' => $amount,
        'remaining_debt' => $newRemaining
    ], 'Payment recorded successfully');
}

// Get payments with filters
function getPayments($db) {
    $customerId = $_GET['customer_id'] ?? '';
    $creditSaleId = $_GET['credit_sale_id'] ?? '';
    $startDate = $_GET['start_date'] ?? '';
    $endDate = $_GET['end_date'] ?? '';
    
    $sql = "SELECT p.*, c.name as customer_name 
            FROM payments p 
            JOIN customers c ON p.customer_id = c.id 
            WHERE 1=1";
    
    $params = [];
    
    if (!empty($customerId)) {
        $sql .= " AND p.customer_id = ?";
        $params[] = $customerId;
    }
    
    if (!empty($creditSaleId)) {
        $sql .= " AND p.credit_sale_id = ?";
        $params[] = $creditSaleId;
    }
    
    if (!empty($startDate)) {
        $sql .= " AND DATE(p.created_at) >= ?";
        $params[] = $startDate;
    }
    
    if (!empty($endDate)) {
        $sql .= " AND DATE(p.created_at) <= ?";
        $params[] = $endDate;
    }
    
    $sql .= " ORDER BY p.created_at DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $payments = $stmt->fetchAll();
    
    // Convert types
    foreach ($payments as &$payment) {
        $payment['amount'] = floatval($payment['amount']);
    }
    
    sendSuccess($payments);
}

// Delete payment
function deletePayment($db, $paymentId) {
    // Get payment details first
    $paymentSql = "SELECT * FROM payments WHERE id = ?";
    $paymentStmt = $db->prepare($paymentSql);
    $paymentStmt->execute([$paymentId]);
    $payment = $paymentStmt->fetch();
    
    if (!$payment) {
        sendError('Payment not found', 404);
    }
    
    $db->beginTransaction();
    
    try {
        // If this was a credit sale payment, update the credit sale
        if (!empty($payment['credit_sale_id'])) {
            $creditSql = "SELECT * FROM credit_sales WHERE id = ?";
            $creditStmt = $db->prepare($creditSql);
            $creditStmt->execute([$payment['credit_sale_id']]);
            $creditSale = $creditStmt->fetch();
            
            if ($creditSale) {
                $newPaidAmount = floatval($creditSale['paid_amount']) - floatval($payment['amount']);
                $newRemainingAmount = floatval($creditSale['total_amount']) - $newPaidAmount;
                
                $newStatus = $newRemainingAmount <= 0 ? 'paid' : 
                           ($newPaidAmount > 0 ? 'partial' : 'unpaid');
                
                $updateCreditSql = "UPDATE credit_sales 
                                  SET paid_amount = ?, remaining_amount = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP 
                                  WHERE id = ?";
                
                $updateCreditStmt = $db->prepare($updateCreditSql);
                $updateCreditStmt->execute([
                    max(0, $newPaidAmount),
                    $newRemainingAmount,
                    $newStatus,
                    $payment['credit_sale_id']
                ]);
            }
        }
        
        // Delete the payment
        $deleteSql = "DELETE FROM payments WHERE id = ?";
        $deleteStmt = $db->prepare($deleteSql);
        $deleteStmt->execute([$paymentId]);
        
        $db->commit();
        sendSuccess(['id' => $paymentId], 'Payment deleted successfully');
        
    } catch (Exception $e) {
        $db->rollback();
        sendError('Failed to delete payment: ' . $e->getMessage());
    }
}
?>