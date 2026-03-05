-- database.sql - Complete Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS internship_portal;
USE internship_portal;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    cnic VARCHAR(15) NOT NULL UNIQUE,
    phone VARCHAR(13) NOT NULL,
    cgpa DECIMAL(3,2) NOT NULL,
    department ENUM(
        'Computer Science', 
        'Software Engineering', 
        'Information Technology', 
        'Artificial Intelligence',
        'Data Science'
    ) NOT NULL,
    resume_path VARCHAR(255) NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Constraints
    CONSTRAINT chk_cgpa CHECK (cgpa >= 0.00 AND cgpa <= 4.00),
    CONSTRAINT chk_student_id_format CHECK (
        student_id REGEXP '^[A-Z]{2}[0-9]{2}-[A-Z]{3}-[0-9]{3}$'
    ),
    CONSTRAINT chk_cnic_format CHECK (
        cnic REGEXP '^[0-9]{5}-[0-9]{7}-[0-9]{1}$'
    ),
    CONSTRAINT chk_phone_format CHECK (
        phone REGEXP '^03[0-9]{9}$'
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for faster searches
CREATE INDEX idx_email ON students(email);
CREATE INDEX idx_student_id ON students(student_id);
CREATE INDEX idx_cnic ON students(cnic);
CREATE INDEX idx_registration_date ON students(registration_date);

-- Create a log table for security auditing
CREATE TABLE IF NOT EXISTS registration_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    student_id VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample query to check data
-- SELECT * FROM students;
-- SELECT COUNT(*) FROM students;