// Handler untuk alamat yang dipilih dari autocomplete
function handleSelectedAddress(result) {
    const statusDiv = document.getElementById('deliveryStatus');
    if (!statusDiv || !map) return;

    removeDeliveryMarker();
    
    try {
        const location = [result.lat, result.lon];
        
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
        
    } catch (error) {
        console.error('Error saat memproses alamat:', error);
        statusDiv.innerHTML = '<p style="color: #ef4444">Terjadi kesalahan saat memproses alamat</p>';
        map.setView(storeLocation, 12);
    }
}