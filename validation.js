// Main Validation Object
const FormValidator = {
    // Form elements
    form: null,
    inputs: {},
    
    // Initialize validation
    init: function() {
        this.form = document.getElementById('registrationForm');
        this.cacheElements();
        this.bindEvents();
        this.setupRealTimeValidation();
    },
    
    // Cache DOM elements
    cacheElements: function() {
        const fields = ['student_id', 'full_name', 'email', 'password', 
                       'confirm_password', 'cnic', 'phone', 'cgpa', 
                       'department', 'resume'];
        
        fields.forEach(field => {
            this.inputs[field] = document.getElementById(field);
        });
    },
    
    // Bind events
    bindEvents: function() {
        // Real-time validation
        this.inputs.student_id.addEventListener('input', () => this.validateStudentId());
        this.inputs.full_name.addEventListener('input', () => this.validateFullName());
        this.inputs.email.addEventListener('input', () => this.validateEmail());
        this.inputs.email.addEventListener('blur', () => this.checkEmailAvailability());
        this.inputs.password.addEventListener('input', () => this.validatePassword());
        this.inputs.confirm_password.addEventListener('input', () => this.validateConfirmPassword());
        this.inputs.cnic.addEventListener('input', () => this.validateCNIC());
        this.inputs.phone.addEventListener('input', () => this.validatePhone());
        this.inputs.cgpa.addEventListener('input', () => this.validateCGPA());
        this.inputs.department.addEventListener('change', () => this.validateDepartment());
        this.inputs.resume.addEventListener('change', () => this.validateResume());
        
        // Form submit
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    },
    
    // Setup real-time validation on all fields
    setupRealTimeValidation: function() {
        Object.values(this.inputs).forEach(input => {
            if (input && input.type !== 'file') {
                input.addEventListener('input', () => this.updateProgress());
            }
        });
    },
    
    // Validate Student ID (Format: FA21-BCS-001)
    validateStudentId: function() {
        const studentId = this.inputs.student_id.value;
        const pattern = /^[A-Z]{2}[0-9]{2}-[A-Z]{3}-[0-9]{3}$/;
        const errorElement = document.getElementById('student_id_error');
        
        if (!studentId) {
            this.showError(this.inputs.student_id, errorElement, 'Student ID is required');
            return false;
        } else if (!pattern.test(studentId)) {
            this.showError(this.inputs.student_id, errorElement, 'Format must be FA21-BCS-001');
            return false;
        } else {
            this.showSuccess(this.inputs.student_id, errorElement);
            return true;
        }
    },
    
    // Validate Full Name
    validateFullName: function() {
        const fullName = this.inputs.full_name.value.trim();
        const errorElement = document.getElementById('full_name_error');
        
        if (!fullName) {
            this.showError(this.inputs.full_name, errorElement, 'Full name is required');
            return false;
        } else if (fullName.length < 3) {
            this.showError(this.inputs.full_name, errorElement, 'Name must be at least 3 characters');
            return false;
        } else if (!/^[a-zA-Z\s]+$/.test(fullName)) {
            this.showError(this.inputs.full_name, errorElement, 'Name can only contain letters and spaces');
            return false;
        } else {
            this.showSuccess(this.inputs.full_name, errorElement);
            return true;
        }
    },
    
    // Validate Email Format
    validateEmail: function() {
        const email = this.inputs.email.value;
        const errorElement = document.getElementById('email_error');
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showError(this.inputs.email, errorElement, 'Email is required');
            return false;
        } else if (!pattern.test(email)) {
            this.showError(this.inputs.email, errorElement, 'Invalid email format');
            return false;
        } else {
            this.showSuccess(this.inputs.email, errorElement);
            return true;
        }
    },
    
    // Check Email Availability via AJAX
    checkEmailAvailability: function() {
        if (!this.validateEmail()) return;
        
        const email = this.inputs.email.value;
        const spinner = document.getElementById('email_spinner');
        const errorElement = document.getElementById('email_error');
        const successElement = document.getElementById('email_success');
        
        // Show spinner
        spinner.style.display = 'block';
        successElement.textContent = '';
        errorElement.textContent = '';
        
        // Create AJAX request
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'php/check-email.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onload = function() {
            spinner.style.display = 'none';
            
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    if (response.exists) {
                        errorElement.textContent = '❌ Email already registered';
                        successElement.textContent = '';
                        FormValidator.inputs.email.classList.add('invalid');
                        FormValidator.inputs.email.classList.remove('valid');
                    } else {
                        errorElement.textContent = '';
                        successElement.textContent = '✅ Email available';
                        FormValidator.inputs.email.classList.add('valid');
                        FormValidator.inputs.email.classList.remove('invalid');
                    }
                } catch (e) {
                    console.error('Invalid JSON response');
                }
            }
            
            FormValidator.updateProgress();
        };
        
        xhr.onerror = function() {
            spinner.style.display = 'none';
            errorElement.textContent = 'Error checking email';
        };
        
        xhr.send('email=' + encodeURIComponent(email));
    },
    
    // Validate Password Strength
    validatePassword: function() {
        const password = this.inputs.password.value;
        const errorElement = document.getElementById('password_error');
        
        // Password strength requirements
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*]/.test(password)
        };
        
        // Update requirement indicators
        document.getElementById('req_length').className = requirements.length ? 'valid' : '';
        document.getElementById('req_length').textContent = requirements.length ? '✓ Minimum 8 characters' : '❌ Minimum 8 characters';
        
        document.getElementById('req_uppercase').className = requirements.uppercase ? 'valid' : '';
        document.getElementById('req_uppercase').textContent = requirements.uppercase ? '✓ At least 1 uppercase letter' : '❌ At least 1 uppercase letter';
        
        document.getElementById('req_lowercase').className = requirements.lowercase ? 'valid' : '';
        document.getElementById('req_lowercase').textContent = requirements.lowercase ? '✓ At least 1 lowercase letter' : '❌ At least 1 lowercase letter';
        
        document.getElementById('req_number').className = requirements.number ? 'valid' : '';
        document.getElementById('req_number').textContent = requirements.number ? '✓ At least 1 number' : '❌ At least 1 number';
        
        document.getElementById('req_special').className = requirements.special ? 'valid' : '';
        document.getElementById('req_special').textContent = requirements.special ? '✓ At least 1 special character' : '❌ At least 1 special character';
        
        // Calculate strength percentage
        const strength = Object.values(requirements).filter(Boolean).length * 20;
        const strengthBar = document.getElementById('strength_bar');
        strengthBar.style.width = strength + '%';
        
        // Color based on strength
        if (strength <= 40) {
            strengthBar.style.backgroundColor = '#f44336';
        } else if (strength <= 60) {
            strengthBar.style.backgroundColor = '#ff9800';
        } else if (strength <= 80) {
            strengthBar.style.backgroundColor = '#2196F3';
        } else {
            strengthBar.style.backgroundColor = '#4CAF50';
        }
        
        // Validate all requirements
        const isValid = Object.values(requirements).every(Boolean);
        
        if (!password) {
            this.showError(this.inputs.password, errorElement, 'Password is required');
            return false;
        } else if (!isValid) {
            this.showError(this.inputs.password, errorElement, 'Password does not meet requirements');
            return false;
        } else {
            this.showSuccess(this.inputs.password, errorElement);
            return true;
        }
    },
    
    // Validate Confirm Password
    validateConfirmPassword: function() {
        const password = this.inputs.password.value;
        const confirmPassword = this.inputs.confirm_password.value;
        const errorElement = document.getElementById('confirm_password_error');
        
        if (!confirmPassword) {
            this.showError(this.inputs.confirm_password, errorElement, 'Please confirm your password');
            return false;
        } else if (password !== confirmPassword) {
            this.showError(this.inputs.confirm_password, errorElement, 'Passwords do not match');
            return false;
        } else {
            this.showSuccess(this.inputs.confirm_password, errorElement);
            return true;
        }
    },
    
    // Validate CNIC (Format: 12345-1234567-1)
    validateCNIC: function() {
        const cnic = this.inputs.cnic.value;
        const pattern = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
        const errorElement = document.getElementById('cnic_error');
        
        if (!cnic) {
            this.showError(this.inputs.cnic, errorElement, 'CNIC is required');
            return false;
        } else if (!pattern.test(cnic)) {
            this.showError(this.inputs.cnic, errorElement, 'Format must be 12345-1234567-1');
            return false;
        } else {
            this.showSuccess(this.inputs.cnic, errorElement);
            return true;
        }
    },
    
    // Validate Phone (Format: 03XXXXXXXXX)
    validatePhone: function() {
        const phone = this.inputs.phone.value;
        const pattern = /^03[0-9]{9}$/;
        const errorElement = document.getElementById('phone_error');
        
        if (!phone) {
            this.showError(this.inputs.phone, errorElement, 'Phone number is required');
            return false;
        } else if (!pattern.test(phone)) {
            this.showError(this.inputs.phone, errorElement, 'Format must be 03XXXXXXXXX');
            return false;
        } else {
            this.showSuccess(this.inputs.phone, errorElement);
            return true;
        }
    },
    
    // Validate CGPA
    validateCGPA: function() {
        const cgpa = parseFloat(this.inputs.cgpa.value);
        const errorElement = document.getElementById('cgpa_error');
        
        if (isNaN(cgpa)) {
            this.showError(this.inputs.cgpa, errorElement, 'CGPA is required');
            return false;
        } else if (cgpa < 0 || cgpa > 4) {
            this.showError(this.inputs.cgpa, errorElement, 'CGPA must be between 0.00 and 4.00');
            return false;
        } else {
            this.showSuccess(this.inputs.cgpa, errorElement);
            return true;
        }
    },
    
    // Validate Department
    validateDepartment: function() {
        const department = this.inputs.department.value;
        const errorElement = document.getElementById('department_error');
        
        if (!department) {
            this.showError(this.inputs.department, errorElement, 'Please select a department');
            return false;
        } else {
            this.showSuccess(this.inputs.department, errorElement);
            return true;
        }
    },
    
    // Validate Resume
    validateResume: function() {
        const file = this.inputs.resume.files[0];
        const errorElement = document.getElementById('resume_error');
        
        if (!file) {
            this.showError(this.inputs.resume, errorElement, 'Please upload your resume');
            return false;
        }
        
        // Check file type
        if (file.type !== 'application/pdf') {
            this.showError(this.inputs.resume, errorElement, 'Only PDF files are allowed');
            return false;
        }
        
        // Check file size (2MB = 2 * 1024 * 1024 bytes)
        if (file.size > 2 * 1024 * 1024) {
            this.showError(this.inputs.resume, errorElement, 'File size must be less than 2MB');
            return false;
        }
        
        this.showSuccess(this.inputs.resume, errorElement);
        return true;
    },
    
    // Show Error
    showError: function(input, errorElement, message) {
        input.classList.add('invalid');
        input.classList.remove('valid');
        if (errorElement) errorElement.textContent = '❌ ' + message;
    },
    
    // Show Success
    showSuccess: function(input, errorElement) {
        input.classList.add('valid');
        input.classList.remove('invalid');
        if (errorElement) errorElement.textContent = '';
    },
    
    // Update Progress Bar
    updateProgress: function() {
        const validations = [
            this.validateStudentId(),
            this.validateFullName(),
            this.validateEmail(),
            this.validatePassword(),
            this.validateConfirmPassword(),
            this.validateCNIC(),
            this.validatePhone(),
            this.validateCGPA(),
            this.validateDepartment(),
            this.validateResume()
        ];
        
        const completed = validations.filter(Boolean).length;
        const percentage = (completed / validations.length) * 100;
        
        document.getElementById('progress').style.width = percentage + '%';
        
        // Enable/disable submit button
        const allValid = validations.every(Boolean);
        document.getElementById('submitBtn').disabled = !allValid;
        
        // Update button text
        const btn = document.getElementById('submitBtn');
        if (allValid) {
            btn.innerHTML = '✅ Complete Registration';
        } else {
            btn.innerHTML = `📝 Complete ${completed}/${validations.length} fields`;
        }
    },
    
    // Handle Form Submit
    handleSubmit: function(e) {
        e.preventDefault();
        
        // Final validation before submit
        const isValid = [
            this.validateStudentId(),
            this.validateFullName(),
            this.validateEmail(),
            this.validatePassword(),
            this.validateConfirmPassword(),
            this.validateCNIC(),
            this.validatePhone(),
            this.validateCGPA(),
            this.validateDepartment(),
            this.validateResume()
        ].every(Boolean);
        
        if (!isValid) {
            alert('Please fix all errors before submitting');
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳ Processing...';
        submitBtn.disabled = true;
        
        // Submit form via AJAX to prevent page reload
        const formData = new FormData(this.form);
        
        fetch('php/register.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success modal
                document.getElementById('successModal').style.display = 'block';
                this.form.reset();
                
                // Reset validation classes
                document.querySelectorAll('input').forEach(input => {
                    input.classList.remove('valid', 'invalid');
                });
                
                // Reset progress bar
                document.getElementById('progress').style.width = '0%';
                
                // Reset password requirements
                document.querySelectorAll('.password-requirements li').forEach(li => {
                    li.className = '';
                });
                
                // Reset button
                submitBtn.innerHTML = '📝 Register for Internship';
                
                // Close modal handlers
                const modal = document.getElementById('successModal');
                const closeBtn = document.querySelector('.close');
                
                closeBtn.onclick = function() {
                    modal.style.display = 'none';
                };
                
                window.onclick = function(event) {
                    if (event.target == modal) {
                        modal.style.display = 'none';
                    }
                };
            } else {
                alert('Error: ' + (data.message || 'Registration failed'));
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        })
        .catch(error => {
            alert('An error occurred. Please try again.');
            console.error('Error:', error);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    FormValidator.init();
});