<?php
// check-email.php - AJAX endpoint for email availability check

require_once 'config.php';

// Set JSON header
header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['exists' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get and validate email
if (!isset($_POST['email']) || empty($_POST['email'])) {
    echo json_encode(['exists' => false, 'error' => 'Email is required']);
    exit;
}

$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['exists' => false, 'error' => 'Invalid email format']);
    exit;
}

// Check database
try {
    $pdo = getDBConnection();
    
    if (!$pdo) {
        throw new PDOException("Database connection failed");
    }
    
    // Use prepared statement to prevent SQL injection
    $stmt = $pdo->prepare("SELECT id FROM students WHERE email = :email");
    $stmt->execute(['email' => $email]);
    
    $exists = $stmt->fetch() ? true : false;
    
    echo json_encode(['exists' => $exists]);
    
} catch (PDOException $e) {
    error_log("Email check error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['exists' => false, 'error' => 'Database error']);
}
?>