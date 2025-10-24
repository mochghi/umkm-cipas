// Initialize AOS
AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true
});

// Update copyright year
document.getElementById('year').textContent = new Date().getFullYear();

// Smooth scroll for navigation
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

// Function to select product in form
function selectProduct(productName) {
    const productSelect = document.querySelector('select[name="product"]');
    if (productSelect) {
        productSelect.value = productName;
    }
}

const API_URL = 'http://localhost:3000/api';
const form = document.getElementById('orderForm');

// Leaflet map initialization
let map, circle, deliveryMarker;
const storeLocation = [-6.914744, 107.609810]; // Koordinat toko (format Leaflet: [lat, lng])
const deliveryRadius = 10000; // 10km dalam meter

function removeDeliveryMarker() {
    if (deliveryMarker && map.hasLayer(deliveryMarker)) {
        map.removeLayer(deliveryMarker);
    }
}

function initMap() {
    try {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Create map centered on store location
        map = L.map('map', {
            center: storeLocation,
            zoom: 12,
            scrollWheelZoom: true,
            zoomControl: true,
            maxZoom: 18,
            minZoom: 8
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add store marker
        L.marker(storeLocation)
            .bindPopup('UMKM CIPAS')
            .addTo(map);

        // Add delivery radius circle
        circle = L.circle(storeLocation, {
            color: '#73C66B',
            fillColor: '#73C66B',
            fillOpacity: 0.15,
            radius: deliveryRadius
        }).addTo(map);

        // Listen to address input changes
        const addressInput = document.querySelector('textarea[name="address"]');
        if (addressInput) {
            let timeout = null;
            addressInput.addEventListener('input', function() {
                const value = this.value.trim();
                clearTimeout(timeout);
                removeDeliveryMarker();
                
                if (value) {
                    timeout = setTimeout(() => {
                        geocodeAddress(value);
                    }, 1000);
                } else {
                    document.getElementById('deliveryStatus').innerHTML = 
                        '<p>Masukkan alamat untuk cek area pengiriman</p>';
                    map.setView(storeLocation, 12);
                }
            });
        }
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

async function geocodeAddress(address) {
    const statusDiv = document.getElementById('deliveryStatus');
    removeDeliveryMarker();
    
    if (!address) {
        statusDiv.innerHTML = '<p>Masukkan alamat untuk cek area pengiriman</p>';
        return;
    }

    try {
        // Add a small delay to prevent too many requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Using OSM Nominatim with proper parameters
        const params = new URLSearchParams({
            format: 'json',
            q: address + ', Bandung',
            limit: 1,
            addressdetails: 1
        });
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'UMKM CIPAS Website (umkmcipas@example.com)'
            }
        });

        if (!response.ok) {
            throw new Error('Geocoding service error');
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const location = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            
            // Create a new marker for the searched location
            deliveryMarker = L.marker(location)
                .bindPopup('Lokasi Pengiriman')
                .addTo(map);

            // Calculate distance using Leaflet's built-in methods
            const from = L.latLng(storeLocation);
            const to = L.latLng(location);
            const distance = from.distanceTo(to);

            if (distance <= deliveryRadius) {
                statusDiv.innerHTML = `
                    <p style="color: #73C66B">✓ Alamat berada dalam area pengiriman</p>
                    <small>Jarak: ${(distance/1000).toFixed(1)}km</small>
                `;
            } else {
                statusDiv.innerHTML = `
                    <p style="color: #ef4444">✕ Maaf, alamat di luar area pengiriman</p>
                    <small>Jarak: ${(distance/1000).toFixed(1)}km (Max: 10km)</small>
                `;
            }

            // Fit the map to show both points
            const bounds = L.latLngBounds([storeLocation, location]);
            map.fitBounds(bounds, { padding: [50, 50] });
        } else {
            statusDiv.innerHTML = '<p style="color: #ef4444">Alamat tidak ditemukan</p>';
            map.setView(storeLocation, 12);
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        statusDiv.innerHTML = '<p style="color: #ef4444">Error saat mencari alamat</p>';
        map.setView(storeLocation, 12);
    }
}

// Initialize map when the document is loaded
document.addEventListener('DOMContentLoaded', initMap);

// Handle form submission with loading state
form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    try {
        // Show loading state
        NProgress.start();
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';
        
        const fd = new FormData(form);
        const formData = Object.fromEntries(fd.entries());
        
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.name,
                product: formData.product,
                qty: parseInt(formData.qty),
                address: formData.address
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(`Terima kasih ${formData.name}! Pesanan Anda berhasil dibuat dengan ID: ${data.orderId}`, 'success');
            form.reset();
        } else {
            showNotification(`Error: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.', 'error');
    } finally {
        // Reset loading state
        NProgress.done();
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});

// Show notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}