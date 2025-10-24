// Inisialisasi AOS
AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true
});

// Update tahun copyright
document.getElementById('year').textContent = new Date().getFullYear();

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

// Fungsi untuk memilih produk di form
function selectProduct(productName) {
    const productSelect = document.querySelector('select[name="product"]');
    if (productSelect) {
        productSelect.value = productName;
    }
}

const API_URL = 'http://localhost:3000/api';
const form = document.getElementById('orderForm');

// Inisialisasi peta Leaflet
let map = null;
let circle = null;
let deliveryMarker = null;
const storeLocation = [-6.914744, 107.609810]; // Koordinat toko (format Leaflet: [lat, lng])
const deliveryRadius = 10000; // 10km dalam meter

// Fungsi untuk menghapus marker pengiriman jika ada
function removeDeliveryMarker() {
    if (deliveryMarker && map && map.hasLayer(deliveryMarker)) {
        map.removeLayer(deliveryMarker);
        deliveryMarker = null;
    }
}

function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Wadah peta tidak ditemukan');
        return;
    }

    try {
        // Hapus peta jika sudah ada
        if (map) {
            map.remove();
            map = null;
        }
        
        // Buat peta baru
        map = L.map(mapContainer, {
            center: storeLocation,
            zoom: 12,
            scrollWheelZoom: true,
            zoomControl: true,
            maxZoom: 18,
            minZoom: 8
        });

        // Tambahkan layer OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Tambahkan marker lokasi toko
        L.marker(storeLocation)
            .bindPopup('Lokasi Toko UMKM CIPAS')
            .addTo(map);

        // Tambahkan lingkaran area pengiriman
        circle = L.circle(storeLocation, {
            color: '#73C66B',
            fillColor: '#73C66B',
            fillOpacity: 0.15,
            radius: deliveryRadius
        }).addTo(map);

        // Input alamat
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
                    const statusDiv = document.getElementById('deliveryStatus');
                    if (statusDiv) {
                        statusDiv.innerHTML = '<p>Masukkan alamat untuk memeriksa area pengiriman</p>';
                    }
                    if (map) {
                        map.setView(storeLocation, 12);
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error saat menginisialisasi peta:', error);
        const statusDiv = document.getElementById('deliveryStatus');
        if (statusDiv) {
            statusDiv.innerHTML = '<p style="color: #ef4444">Terjadi kesalahan saat memuat peta</p>';
        }
    }
}

async function geocodeAddress(address) {
    const statusDiv = document.getElementById('deliveryStatus');
    if (!statusDiv || !map) return;
    
    if (!address) {
        statusDiv.innerHTML = '<p>Masukkan alamat untuk memeriksa area pengiriman</p>';
        return;
    }

    statusDiv.innerHTML = '<p>Mencari alamat...</p>';
    removeDeliveryMarker();

    try {
        // Tambah jeda untuk mencegah terlalu banyak permintaan
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Gunakan OSM Nominatim dengan parameter yang sesuai
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
            throw new Error('Layanan pencarian alamat tidak merespons');
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const location = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            
            // Buat marker untuk lokasi pengiriman
            deliveryMarker = L.marker(location)
                .bindPopup('Lokasi Pengiriman')
                .addTo(map);

            // Hitung jarak
            const from = L.latLng(storeLocation);
            const to = L.latLng(location);
            const distance = from.distanceTo(to);

            if (distance <= deliveryRadius) {
                statusDiv.innerHTML = `
                    <p style="color: #73C66B">✓ Alamat berada dalam jangkauan pengiriman</p>
                    <small>Jarak: ${(distance/1000).toFixed(1)} km</small>
                `;
            } else {
                statusDiv.innerHTML = `
                    <p style="color: #ef4444">✕ Maaf, alamat di luar jangkauan pengiriman</p>
                    <small>Jarak: ${(distance/1000).toFixed(1)} km (Maksimal: 10 km)</small>
                `;
            }

            // Sesuaikan tampilan peta
            const bounds = L.latLngBounds([storeLocation, location]);
            map.fitBounds(bounds, { padding: [50, 50] });
        } else {
            statusDiv.innerHTML = '<p style="color: #ef4444">Alamat tidak dapat ditemukan. Mohon periksa kembali alamat yang dimasukkan.</p>';
            map.setView(storeLocation, 12);
        }
    } catch (error) {
        console.error('Error saat mencari alamat:', error);
        statusDiv.innerHTML = '<p style="color: #ef4444">Terjadi kesalahan saat mencari alamat</p>';
        map.setView(storeLocation, 12);
    }
}

// Inisialisasi peta saat dokumen dimuat
document.addEventListener('DOMContentLoaded', initMap);

// Handle pengiriman form dengan loading state
form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    try {
        // Tampilkan loading state
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