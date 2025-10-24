// Modul untuk mengelola peta dan fitur terkait
class DeliveryMap {
    constructor(config = {}) {
        this.config = {
            containerId: 'map',
            storeLocation: [-6.914744, 107.609810],
            deliveryRadius: 10000, // 10km dalam meter
            ...config
        };

        this.map = null;
        this.circle = null;
        this.deliveryMarker = null;
        this.routingControl = null;

        // Lazy load - inisialisasi saat elemen peta terlihat
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.map) {
                    this.initMap();
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        const mapContainer = document.getElementById(this.config.containerId);
        if (mapContainer) {
            observer.observe(mapContainer);
        }
    }

    async initMap() {
        const mapContainer = document.getElementById(this.config.containerId);
        if (!mapContainer) {
            console.error('Container peta tidak ditemukan');
            return;
        }

        try {
            // Buat peta
            this.map = L.map(mapContainer, {
                center: this.config.storeLocation,
                zoom: 12,
                scrollWheelZoom: true,
                zoomControl: true,
                maxZoom: 18,
                minZoom: 8
            });

            // Tambahkan layer OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Tambahkan marker toko
            L.marker(this.config.storeLocation)
                .bindPopup('Lokasi Toko UMKM CIPAS')
                .addTo(this.map);

            // Tambahkan area pengiriman
            this.circle = L.circle(this.config.storeLocation, {
                color: '#73C66B',
                fillColor: '#73C66B',
                fillOpacity: 0.15,
                radius: this.config.deliveryRadius
            }).addTo(this.map);

            // Tambahkan tombol geolokasi
            this.addGeolocationControl();

        } catch (error) {
            console.error('Error saat menginisialisasi peta:', error);
            const statusDiv = document.getElementById('deliveryStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<p style="color: #ef4444">Terjadi kesalahan saat memuat peta</p>';
            }
        }
    }

    addGeolocationControl() {
        const locationButton = L.control({ position: 'topleft' });

        locationButton.onAdd = () => {
            const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-location');
            button.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
            button.title = 'Gunakan lokasi saya';
            
            button.onclick = () => this.getCurrentLocation();
            
            return button;
        };

        locationButton.addTo(this.map);
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            showNotification('Geolokasi tidak didukung di browser Anda', 'error');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });

            const location = [position.coords.latitude, position.coords.longitude];
            this.updateDeliveryMarker(location);
            
        } catch (error) {
            console.error('Error mendapatkan lokasi:', error);
            showNotification('Tidak dapat mendapatkan lokasi Anda. ' + 
                (error.message === 'User denied Geolocation' ? 
                'Mohon izinkan akses lokasi.' : 
                'Silakan coba lagi.'), 'error');
        }
    }

    updateDeliveryMarker(location) {
        // Hapus marker lama jika ada
        if (this.deliveryMarker && this.map.hasLayer(this.deliveryMarker)) {
            this.map.removeLayer(this.deliveryMarker);
        }

        // Buat marker baru
        this.deliveryMarker = L.marker(location)
            .bindPopup('Lokasi Pengiriman')
            .addTo(this.map);

        // Hitung dan tampilkan jarak
        this.calculateAndShowDistance(location);

        // Sesuaikan tampilan peta
        const bounds = L.latLngBounds([this.config.storeLocation, location]);
        this.map.fitBounds(bounds, { padding: [50, 50] });

        // Update rute jika fitur routing aktif
        this.updateRoute(location);
    }

    calculateAndShowDistance(location) {
        const statusDiv = document.getElementById('deliveryStatus');
        if (!statusDiv) return;

        const from = L.latLng(this.config.storeLocation);
        const to = L.latLng(location);
        const distance = from.distanceTo(to);
        const kmDistance = (distance/1000).toFixed(1);

        if (distance <= this.config.deliveryRadius) {
            statusDiv.innerHTML = `
                <p style="color: #73C66B">✓ Alamat berada dalam jangkauan pengiriman</p>
                <small>Jarak: ${kmDistance} km</small>
                <div class="eta-info"></div>
            `;
            // Dapatkan estimasi waktu pengiriman
            this.getDeliveryETA(location);
        } else {
            statusDiv.innerHTML = `
                <p style="color: #ef4444">✕ Maaf, alamat di luar jangkauan pengiriman</p>
                <small>Jarak: ${kmDistance} km (Maksimal: 10 km)</small>
            `;
        }
    }

    async getDeliveryETA(location) {
        try {
            // Gunakan OSRM demo server untuk routing
            const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${this.config.storeLocation[1]},${this.config.storeLocation[0]};${location[1]},${location[0]}?overview=false`);
            
            if (!response.ok) throw new Error('Gagal mendapatkan rute');
            
            const data = await response.json();
            
            if (data.routes && data.routes[0]) {
                const duration = Math.ceil(data.routes[0].duration / 60); // Convert to minutes
                const etaInfo = document.querySelector('.eta-info');
                if (etaInfo) {
                    etaInfo.innerHTML = `
                        <small>Estimasi waktu pengiriman: ${duration} menit</small>
                    `;
                }
            }
        } catch (error) {
            console.error('Error mendapatkan ETA:', error);
        }
    }

    updateRoute(location) {
        // Hapus rute lama jika ada
        if (this.routingControl) {
            this.map.removeControl(this.routingControl);
        }
        // Jika plugin routing tidak tersedia, jangan crash — cukup return
        if (!L.Routing || typeof L.Routing.OSRMv1 !== 'function') {
            console.warn('Leaflet Routing Machine tidak tersedia. Melewatkan pembuatan rute.');
            this.routingControl = null;
            return;
        }

        // Buat rute baru menggunakan API OSRMv1 yang benar
        try {
            const router = L.Routing.OSRMv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            });

            this.routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(this.config.storeLocation),
                    L.latLng(location)
                ],
                router,
                lineOptions: {
                    styles: [
                        {color: '#73C66B', opacity: 0.8, weight: 4}
                    ]
                },
                fitSelectedRoutes: false,
                draggableWaypoints: false,
                addWaypoints: false,
                show: false // Sembunyikan panel instruksi
            }).addTo(this.map);
        } catch (err) {
            console.error('Gagal membuat rute:', err);
            this.routingControl = null;
        }
    }

    // Return lokasi marker pengiriman saat ini (Leaflet LatLng) atau null
    getMarkerLocation() {
        if (!this.deliveryMarker) return null;
        try {
            return this.deliveryMarker.getLatLng();
        } catch (e) {
            return null;
        }
    }

    // Hitung jarak (dalam meter) antara toko dan lokasi yang diberikan
    calculateDistance(location) {
        try {
            const from = L.latLng(this.config.storeLocation);
            const to = L.latLng(location);
            return Math.round(from.distanceTo(to));
        } catch (e) {
            return Infinity;
        }
    }

    // Reset peta ke keadaan awal (hapus marker pengiriman dan rute)
    resetMap() {
        if (!this.map) return;
        if (this.deliveryMarker && this.map.hasLayer(this.deliveryMarker)) {
            this.map.removeLayer(this.deliveryMarker);
            this.deliveryMarker = null;
        }
        if (this.routingControl) {
            try {
                this.map.removeControl(this.routingControl);
            } catch (e) {
                // ignore
            }
            this.routingControl = null;
        }
        // Kembalikan view ke lokasi toko
        this.map.setView(this.config.storeLocation, 12);
    }
}

// Export class untuk digunakan di app.js
export default DeliveryMap;