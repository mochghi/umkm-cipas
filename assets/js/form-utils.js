// Import translation function
import { t } from './i18n.js';

// Function to clear all error messages
export function clearErrors() {
    // Remove error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    // Remove aria-invalid attributes and error classes
    document.querySelectorAll('[aria-invalid]').forEach(el => {
        el.removeAttribute('aria-invalid');
        el.classList.remove('field-error');
    });
}

// Function to display errors on form
export function displayErrors(errors) {
    // First, clear all errors
    clearErrors();
    
    // Display each error
    errors.forEach((message, fieldName) => {
        const field = document.getElementById(fieldName);
        const errorDiv = document.getElementById(`${fieldName}Error`);
        
        if (field && errorDiv) {
            field.setAttribute('aria-invalid', 'true');
            field.classList.add('field-error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    });
    
    // Focus first error field
    if (errors.size > 0) {
        const firstErrorField = document.getElementById(Array.from(errors.keys())[0]);
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // Announce errors to screen readers
    const errorCount = errors.size;
    if (errorCount > 0) {
        announceToScreenReader(`${errorCount} kesalahan ditemukan. Silakan perbaiki field yang ditandai.`);
    }
}

// Function to announce messages to screen readers
export function announceToScreenReader(message) {
    let announcer = document.getElementById('announcer');
    if (!announcer) {
        const div = document.createElement('div');
        div.id = 'announcer';
        div.className = 'sr-only';
        div.setAttribute('aria-live', 'polite');
        div.setAttribute('role', 'status');
        document.body.appendChild(div);
        announcer = div;
    }
    
    announcer.textContent = message;
}

// Validate individual field
export function validateField(fieldName, value, formData = {}) {
    switch (fieldName) {
        case 'name':
            if (!value || value.trim().length === 0) {
                return 'Nama harus diisi';
            }
            if (value.trim().length < 3) {
                return 'Nama minimal 3 karakter';
            }
            if (value.trim().length > 100) {
                return 'Nama maksimal 100 karakter';
            }
            if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
                return 'Nama hanya boleh berisi huruf dan spasi';
            }
            break;

        case 'product':
            if (!value) {
                return 'Produk harus dipilih';
            }
            break;
            
        case 'customProduct':
            if (!value || value.trim().length === 0) {
                return 'Produk yang diinginkan harus diisi';
            }
            if (value.trim().length < 3) {
                return 'Nama produk minimal 3 karakter';
            }
            if (value.trim().length > 100) {
                return 'Nama produk maksimal 100 karakter';
            }
            break;

        case 'qty':
            if (!value && value !== 0) {
                return 'Jumlah harus diisi';
            }
            const qty = parseInt(value);
            if (isNaN(qty)) {
                return 'Jumlah harus berupa angka';
            }
            if (qty < 1) {
                return 'Jumlah minimal 1';
            }
            if (qty > 100) {
                return 'Jumlah maksimal 100';
            }
            break;

        case 'address':
            if (!value || value.trim().length === 0) {
                return 'Alamat harus diisi';
            }
            if (value.trim().length < 10) {
                return 'Alamat minimal 10 karakter untuk memastikan kelengkapan';
            }
            if (value.trim().length > 500) {
                return 'Alamat maksimal 500 karakter';
            }
            break;
    }
    return null;
}

// Validate form fields and return Map of errors
export function validateOrderForm(formData) {
    const errors = new Map();
    
    // Validate name
    const nameError = validateField('name', formData.name, formData);
    if (nameError) errors.set('name', nameError);

    // Validate product
    const productError = validateField('product', formData.product, formData);
    if (productError) errors.set('product', productError);

    // Validate quantity
    const qtyError = validateField('qty', formData.qty, formData);
    if (qtyError) errors.set('qty', qtyError);

    // Validate address
    const addressError = validateField('address', formData.address, formData);
    if (addressError) errors.set('address', addressError);

    return errors;
}

// Handle form submission result
export function handleFormResult(success, data = {}) {
    const message = success ?
        `Terima kasih ${data.name}! Pesanan Anda berhasil dibuat dengan ID: ${data.orderId}` :
        data.message || 'Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.';
    
    showNotification(message, success ? 'success' : 'error');
    
    if (success) {
        // Clear form
        const form = document.getElementById('orderForm');
        if (form) form.reset();
        
        // Clear any delivery markers
        if (window.deliveryMap) {
            window.deliveryMap.resetMap?.();
        }
        
        // Focus first field for next order
        setTimeout(() => {
            document.getElementById('name')?.focus();
        }, 100);
        
        // Announce success to screen readers
        announceToScreenReader(message);
    }
}

// Show notification with auto-dismiss
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Tutup notifikasi">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add close handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn?.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Show with animation
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Keyboard support
    notification.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    });
}

// Add keyboard navigation for notification
export function makeNotificationAccessible(notification) {
    // Make notification focusable
    notification.setAttribute('tabindex', '-1');
    notification.setAttribute('role', 'alert');
    
    // Add keyboard dismiss
    notification.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    });
    
    // Focus notification
    notification.focus();
}