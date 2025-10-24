// Import modules
import { t } from './i18n.js';
import { validateOrderForm, validateField, handleFormResult, clearErrors, displayErrors } from './form-utils.js';
import DeliveryMap from './map.js';
import AddressAutocomplete from './autocomplete.js';

// Inisialisasi AOS setelah DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true
    });
});

// Update tahun copyright
document.getElementById('year').textContent = new Date().getFullYear();

// Fungsi untuk memilih produk di form
function selectProduct(productName) {
    const productSelect = document.querySelector('select[name="product"]');
    if (productSelect) {
        productSelect.value = productName;
        // Scroll ke form
        const form = document.getElementById('orderForm');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Focus pada input nama setelah scroll
            setTimeout(() => {
                document.getElementById('name')?.focus();
            }, 800);
        }
    }
}
window.selectProduct = selectProduct; // Expose function globally

// Smooth scroll untuk navigasi
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

const API_URL = 'http://localhost:3000/api';
const form = document.getElementById('orderForm');
// Customer auth state (public login) - non-persistent per refresh
let customerToken = null;
const customerLoginCard = document.getElementById('customerLoginCard');
const customerLoginForm = document.getElementById('customerLoginForm');
const customerEmailInput = document.getElementById('customerEmail');
const customerNameInput = document.getElementById('customerName');
const loginStatus = document.getElementById('loginStatus');

// Handle custom product request
const productSelect = document.getElementById('product');
const customProductGroup = document.getElementById('customProductGroup');
const customProductInput = document.getElementById('customProduct');

productSelect?.addEventListener('change', function() {
    if (this.value === 'Lainnya') {
        customProductGroup.style.display = 'block';
        customProductInput.required = true;
        customProductInput.focus();
    } else {
        customProductGroup.style.display = 'none';
        customProductInput.required = false;
        customProductInput.value = '';
    }
});

// Inisialisasi peta dengan DeliveryMap
let deliveryMap = null;
const storeLocation = [-6.914744, 107.609810]; // Koordinat toko (format Leaflet: [lat, lng])
const deliveryRadius = 10000; // 10km dalam meter

function initMap() {
    try {
        // Inisialisasi peta dengan konfigurasi
        deliveryMap = new DeliveryMap({
            containerId: 'map',
            storeLocation: storeLocation,
            deliveryRadius: deliveryRadius
        });

        // Input alamat dengan autocomplete
        const addressInput = document.querySelector('textarea[name="address"]');
        if (addressInput) {
            // Inisialisasi autocomplete
            const autocomplete = new AddressAutocomplete(addressInput, {
                delay: 500,
                minChars: 3,
                maxResults: 5,
                onSelect: (result) => {
                    // Langsung gunakan koordinat dari hasil autocomplete
                    handleSelectedAddress(result);
                }
            });
        }
    } catch (error) {
        console.error('Error saat menginisialisasi peta:', error);
        const statusDiv = document.getElementById('deliveryStatus');
        if (statusDiv) {
            statusDiv.innerHTML = '<p class="text-error" role="alert">' + t('map.errors.initFailed') + '</p>';
        }
    }
}

// Handler untuk alamat yang dipilih dari autocomplete
function handleSelectedAddress(result) {
    const statusDiv = document.getElementById('deliveryStatus');
    if (!statusDiv || !deliveryMap?.map) return;
    
    try {
        const location = [result.lat, result.lon];
        deliveryMap.updateDeliveryMarker(location);
        
        // Hitung jarak
        const distance = deliveryMap.calculateDistance(location);
        const distanceKm = (distance/1000).toFixed(1);

        if (distance <= deliveryRadius) {
            statusDiv.innerHTML = `
                <p class="text-success" role="alert">
                    ${t('map.delivery.inRange', { distance: distanceKm })}
                </p>
            `;
        } else {
            statusDiv.innerHTML = `
                <p class="text-error" role="alert">
                    ${t('map.delivery.outOfRange', { distance: distanceKm })}
                </p>
            `;
        }
    } catch (error) {
        console.error('Error saat memproses alamat:', error);
        statusDiv.innerHTML = `
            <p class="text-error" role="alert">
                ${t('map.errors.processingFailed')}
            </p>
        `;
    }
}

async function geocodeAddress(address) {
    const statusDiv = document.getElementById('deliveryStatus');
    if (!statusDiv || !deliveryMap?.map) return;
    
    if (!address) {
        statusDiv.innerHTML = `
            <p role="alert">
                ${t('map.delivery.enterAddress')}
            </p>
        `;
        return;
    }

    statusDiv.innerHTML = `
        <p role="status">
            ${t('map.delivery.searching')}
        </p>
    `;
    
    try {
        // Tambah jeda untuk mencegah terlalu banyak permintaan
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const params = new URLSearchParams({
            format: 'json',
            q: address + ', Bandung',
            limit: 1,
            addressdetails: 1
        });
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'UMKM CIPAS Website'
            }
        });

        if (!response.ok) {
            throw new Error(t('map.errors.serviceUnavailable'));
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const location = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            deliveryMap.updateDeliveryMarker(location);
        } else {
            statusDiv.innerHTML = `
                <p class="text-error" role="alert">
                    ${t('map.errors.addressNotFound')}
                </p>
            `;
            deliveryMap.map.setView(storeLocation, 12);
        }
    } catch (error) {
        console.error('Error saat mencari alamat:', error);
        statusDiv.innerHTML = `
            <p class="text-error" role="alert">
                ${t('map.errors.searchFailed')}
            </p>
        `;
        deliveryMap.map.setView(storeLocation, 12);
    }
}

// Inisialisasi peta saat dokumen dimuat
document.addEventListener('DOMContentLoaded', initMap);

// --- Carousel controller for featured products ---
function initProductCarousel() {
    const carousel = document.querySelector('.products-carousel');
    if (!carousel) return;

    const scroller = carousel.querySelector('.card-grid');
    const prev = carousel.querySelector('.carousel-btn.prev');
    const next = carousel.querySelector('.carousel-btn.next');
    const step = scroller ? scroller.clientWidth * 0.7 : 300;

    const updateButtons = () => {
        if (!scroller) return;
        prev.disabled = scroller.scrollLeft <= 0;
        next.disabled = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1;
    };

    prev.addEventListener('click', () => {
        scroller.scrollBy({ left: -step, behavior: 'smooth' });
    });

    next.addEventListener('click', () => {
        scroller.scrollBy({ left: step, behavior: 'smooth' });
    });

    scroller.addEventListener('scroll', () => {
        window.requestAnimationFrame(updateButtons);
    });

    // Keyboard support when focus in scroller
    scroller.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { scroller.scrollBy({ left: 220, behavior: 'smooth' }); }
        if (e.key === 'ArrowLeft') { scroller.scrollBy({ left: -220, behavior: 'smooth' }); }
    });

    // initial state
    updateButtons();
}

document.addEventListener('DOMContentLoaded', () => {
    initProductCarousel();
});

// Variabel untuk mencegah multiple submit
let isSubmitting = false;

// ===== Customer Email Login (Public) =====
function updateOrderFormAccess() {
    const submitBtn = document.getElementById('submitOrder');
    if (!submitBtn) return;
    if (customerToken) {
        // Hide login card, enable form
        customerLoginCard?.classList.add('hidden');
        submitBtn.disabled = false;
        loginStatus && (loginStatus.textContent = '');
    } else {
        // Show login card, disable submit
        customerLoginCard?.classList.remove('hidden');
        submitBtn.disabled = true;
        loginStatus && (loginStatus.textContent = '');
    }
}

async function customerLogin(email, name) {
    const res = await fetch(`${API_URL}/auth/customer-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Login gagal');
    }
    return data;
}

customerLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = customerEmailInput?.value.trim();
    const name = customerNameInput?.value.trim();
    if (!email) return;
    try {
        loginStatus && (loginStatus.textContent = 'Memproses...');
        const data = await customerLogin(email, name);
        customerToken = data.token;
        loginStatus && (loginStatus.textContent = 'Berhasil masuk');
        updateOrderFormAccess();
    } catch (err) {
        console.error(err);
        loginStatus && (loginStatus.textContent = err.message || 'Login gagal');
    }
});

// Initialize access (force fresh session: clear any old persisted token)
document.addEventListener('DOMContentLoaded', () => {
    try { localStorage.removeItem('customerToken'); } catch (_) {}
    updateOrderFormAccess();
});

// Handle pengiriman form dengan loading state, validasi, dan aksesibilitas
form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Cek jika sedang proses submit
    if (isSubmitting) return;

    const productValue = form.querySelector('[name="product"]').value;
    const isCustomProduct = productValue === 'Lainnya';
    const customProductValue = isCustomProduct ? form.querySelector('[name="customProduct"]').value.trim() : '';
    
    const formData = {
        name: form.querySelector('[name="name"]').value.trim(),
        product: isCustomProduct ? `Request: ${customProductValue}` : productValue,
        qty: parseInt(form.querySelector('[name="qty"]').value),
        address: form.querySelector('[name="address"]').value.trim(),
        lat: deliveryMap?.getMarkerLocation()?.lat || null,
        lng: deliveryMap?.getMarkerLocation()?.lng || null,
        isCustomRequest: isCustomProduct
    };

    // Validate custom product if "Lainnya" is selected
    if (isCustomProduct) {
        const customError = validateField('customProduct', customProductValue);
        if (customError) {
            displayErrors(new Map([['customProduct', customError]]));
            return;
        }
    }

    const errors = validateOrderForm(formData);
    if (errors.size > 0) {
        displayErrors(errors);
        return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    try {
        // Set flag submitting
        isSubmitting = true;
        
        // Tampilkan loading state
        NProgress.start();
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.innerHTML = `<span class="loading" role="status">${t('contact.form.submitting')}</span>`;

        // Require customer login
        if (!customerToken) {
            showNotification('Silakan masuk dengan email untuk melakukan pemesanan.', 'error');
            updateOrderFormAccess();
            return;
        }

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`
            },
            body: JSON.stringify(formData)
        });

        const responseData = await response.json();

        if (response.ok) {
            // Reset form and map
            form.reset();
            deliveryMap?.resetMap();
            // Keep login session
            
            handleFormResult(true, {
                name: formData.name,
                orderId: responseData.orderId
            });
        } else {
            throw new Error(responseData.message || t('contact.form.errors.serverError'));
        }
    } catch (error) {
        console.error('Error:', error);
        const message = error.name === 'TypeError' && error.message === 'Failed to fetch'
            ? t('contact.form.errors.connectionError')
            : t('contact.form.errors.serverError');
            
        handleFormResult(false, { message });
    } finally {
        // Reset loading state
        NProgress.done();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        submitBtn.removeAttribute('aria-busy');
        isSubmitting = false;
    }
});

// Real-time validation setup
document.addEventListener('DOMContentLoaded', () => {
    const fields = ['name', 'product', 'qty', 'address', 'customProduct'];
    
    fields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        const errorDiv = document.getElementById(`${fieldName}Error`);
        
        if (!field || !errorDiv) return;
        
        // Validate on blur (when user leaves the field)
        field.addEventListener('blur', () => {
            const value = field.value;
            const error = validateField(fieldName, value);
            
            if (error) {
                field.setAttribute('aria-invalid', 'true');
                field.classList.add('field-error');
                errorDiv.textContent = error;
                errorDiv.style.display = 'block';
            } else {
                field.removeAttribute('aria-invalid');
                field.classList.remove('field-error');
                errorDiv.textContent = '';
                errorDiv.style.display = 'none';
            }
        });
        
        // Clear error on input (when user starts typing)
        field.addEventListener('input', () => {
            if (field.classList.contains('field-error')) {
                field.classList.remove('field-error');
                field.removeAttribute('aria-invalid');
                errorDiv.textContent = '';
                errorDiv.style.display = 'none';
            }
        });
    });
});

// Fungsi menampilkan notifikasi
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animasi
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hapus notifikasi setelah beberapa detik
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}