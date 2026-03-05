<?php
// register.php - Main registration handler

require_once 'config.php';
session_start();

// Set security headers
setSecurityHeaders();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../index.html');
    exit;
}

// Initialize response array
$response = [
    'success' => false,
    'message' => '',
    'errors' => []
];

try {
    // Get database connection
    $pdo = getDBConnection();
    
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }
    
    // Begin transaction
    $pdo->beginTransaction();
    
    // ========== SERVER-SIDE VALIDATION ==========
    
    // Validate Student ID
    $student_id = trim($_POST['student_id'] ?? '');
    if (empty($student_id)) {
        $response['errors']['student_id'] = 'Student ID is required';
    } elseif (!preg_match('/^[A-Z]{2}[0-9]{2}-[A-Z]{3}-[0-9]{3}$/', $student_id)) {
        $response['errors']['student_id'] = 'Invalid Student ID format';
    } else {
        // Check for duplicate Student ID
        $stmt = $pdo->prepare("SELECT id FROM students WHERE student_id = :student_id");
        $stmt->execute(['student_id' => $student_id]);
        if ($stmt->fetch()) {
            $response['errors']['student_id'] = 'Student ID already exists';
        }
    }
    
    // Validate Full Name
    $full_name = trim($_POST['full_name'] ?? '');
    if (empty($full_name)) {
        $response['errors']['full_name'] = 'Full name is required';
    } elseif (strlen($full_name) < 3) {
        $response['errors']['full_name'] = 'Name must be at least 3 characters';
    } elseif (!preg_match('/^[a-zA-Z\s]+$/', $full_name)) {
        $response['errors']['full_name'] = 'Name can only contain letters and spaces';
    }
    
    // Validate Email
    $email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
    if (empty($email)) {
        $response['errors']['email'] = 'Email is required';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['errors']['email'] = 'Invalid email format';
    } else {
        // Check for duplicate Email
        $stmt = $pdo->prepare("SELECT id FROM students WHERE email = :email");
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            $response['errors']['email'] = 'Email already exists';
        }
    }
    
    // Validate Password
    $password = $_POST['password'] ?? '';
    if (empty($password)) {
        $response['errors']['password'] = 'Password is required';
    } elseif (strlen($password) < 8) {
        $response['errors']['password'] = 'Password must be at least 8 characters';
    } elseif (!preg_match('/[A-Z]/', $password)) {
        $response['errors']['password'] = 'Password must contain at least one uppercase letter';
    } elseif (!preg_match('/[a-z]/', $password)) {
        $response['errors']['password'] = 'Password must contain at least one lowercase letter';
    } elseif (!preg_match('/[0-9]/', $password)) {
        $response['errors']['password'] = 'Password must contain at least one number';
    } elseif (!preg_match('/[!@#$%^&*]/', $password)) {
        $response['errors']['password'] = 'Password must contain at least one special character';
    }
    
    // Validate Confirm Password
    $confirm_password = $_POST['confirm_password'] ?? '';
    if ($password !== $confirm_password) {
        $response['errors']['confirm_password'] = 'Passwords do not match';
    }
    
    // Validate CNIC
    $cnic = trim($_POST['cnic'] ?? '');
    if (empty($cnic)) {
        $response['errors']['cnic'] = 'CNIC is required';
    } elseif (!preg_match('/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/', $cnic)) {
        $response['errors']['cnic'] = 'Invalid CNIC format';
    } else {
        // Check for duplicate CNIC
        $stmt = $pdo->prepare("SELECT id FROM students WHERE cnic = :cnic");
        $stmt->execute(['cnic' => $cnic]);
        if ($stmt->fetch()) {
            $response['errors']['cnic'] = 'CNIC already exists';
        }
    }
    
    // Validate Phone
    $phone = trim($_POST['phone'] ?? '');
    if (empty($phone)) {
        $response['errors']['phone'] = 'Phone number is required';
    } elseif (!preg_match('/^03[0-9]{9}$/', $phone)) {
        $response['errors']['phone'] = 'Invalid phone number format';
    }
    
    // Validate CGPA
    $cgpa = floatval($_POST['cgpa'] ?? 0);
    if ($cgpa < 0 || $cgpa > 4) {
        $response['errors']['cgpa'] = 'CGPA must be between 0.00 and 4.00';
    }
    
    // Validate Department
    $department = $_POST['department'] ?? '';
    $valid_departments = ['Computer Science', 'Software Engineering', 'Information Technology', 'Artificial Intelligence', 'Data Science'];
    if (!in_array($department, $valid_departments)) {
        $response['errors']['department'] = 'Invalid department selection';
    }
    
    // ========== FILE UPLOAD VALIDATION ==========
    
    $resume_path = '';
    if (!isset($_FILES['resume']) || $_FILES['resume']['error'] !== UPLOAD_ERR_OK) {
        $response['errors']['resume'] = 'Please upload your resume';
    } else {
        $file = $_FILES['resume'];
        
        // Check file type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        $allowed_types = ['application/pdf'];
        if (!in_array($mime_type, $allowed_types)) {
            $response['errors']['resume'] = 'Only PDF files are allowed';
        }
        
        // Check file size (2MB max)
        if ($file['size'] > 2 * 1024 * 1024) {
            $response['errors']['resume'] = 'File size must be less than 2MB';
        }
        
        // Check if it's actually a PDF (double-check)
        $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($file_ext !== 'pdf') {
            $response['errors']['resume'] = 'File must have .pdf extension';
        }
        
        // Generate secure filename
        if (empty($response['errors']['resume'])) {
            $timestamp = time();
            $random = bin2hex(random_bytes(8));
            $secure_filename = $timestamp . '_' . $random . '.pdf';
            $upload_path = UPLOAD_DIR . $secure_filename;
            
            // Move uploaded file
            if (move_uploaded_file($file['tmp_name'], $upload_path)) {
                $resume_path = $secure_filename;
                
                // Set proper permissions
                chmod($upload_path, 0644);
            } else {
                $response['errors']['resume'] = 'Failed to upload file';
            }
        }
    }
    
    // ========== INSERT DATA IF NO ERRORS ==========
    
    if (empty($response['errors'])) {
        // Hash password securely
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        // Prepare SQL statement with placeholders
        $sql = "INSERT INTO students (student_id, full_name, email, password, cnic, phone, cgpa, department, resume_path) 
                VALUES (:student_id, :full_name, :email, :password, :cnic, :phone, :cgpa, :department, :resume_path)";
        
        $stmt = $pdo->prepare($sql);
        
        // Execute with parameters
        $result = $stmt->execute([
            'student_id' => $student_id,
            'full_name' => $full_name,
            'email' => $email,
            'password' => $hashed_password,
            'cnic' => $cnic,
            'phone' => $phone,
            'cgpa' => $cgpa,
            'department' => $department,
            'resume_path' => $resume_path
        ]);
        
        if ($result) {
            // Commit transaction
            $pdo->commit();
            
            // Set success message
            $response['success'] = true;
            $response['message'] = 'Registration successful!';
            
            // Log successful registration
            error_log("New registration: " . $email);
        } else {
            throw new Exception("Failed to insert record");
        }
    } else {
        // Rollback transaction if any error
        $pdo->rollBack();
        
        // Delete uploaded file if exists and there were errors
        if (!empty($resume_path) && file_exists(UPLOAD_DIR . $resume_path)) {
            unlink(UPLOAD_DIR . $resume_path);
        }
    }
    
} catch (PDOException $e) {
    // Rollback transaction
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    
    // Log error
    error_log("Registration error: " . $e->getMessage());
    
    $response['message'] = 'Database error occurred';
    $response['errors']['database'] = 'An error occurred. Please try again.';
    
} catch (Exception $e) {
    // Rollback transaction
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    
    error_log("Registration error: " . $e->getMessage());
    $response['message'] = $e->getMessage();
}

// Return JSON response
header('Content-Type: application/json');
echo json_encode($response);
?>