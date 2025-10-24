// Translations store
const translations = {
    id: {
        // Navigation
        nav: {
            home: 'Home',
            products: 'Produk',
            about: 'Tentang',
            orderNow: 'Pesan Sekarang'
        },
        // Hero section
        hero: {
            title: 'Sayuran Segar Langsung dari Petani',
            description: 'Dukungan untuk petani lokal dan pasokan harian sehingga Anda mendapatkan sayuran yang lebih segar, sehat, dan hemat.',
            viewProducts: 'Lihat Produk',
            contactUs: 'Hubungi Kami'
        },
        // Products section
        products: {
            title: 'Produk Unggulan',
            subtitle: 'Pilihan sayuran segar, dikemas rapi, siap antar.',
            orderButton: 'Pesan',
            pricePrefix: 'Rp',
            unit: {
                bunch: 'ikat',
                kg: 'kg'
            }
        },
        // About section
        about: {
            title: 'Tentang UMKM CIPAS',
            description: 'Kami bekerja sama dengan petani lokal untuk menyediakan sayuran dengan kualitas terbaik. Pengiriman harian memastikan kesegaran sampai ke meja Anda.',
            features: {
                organic: 'Produk organik pilihan',
                support: 'Dukungan untuk petani lokal',
                packaging: 'Pengemasan aman & ramah lingkungan'
            },
            vision: {
                title: 'Visi',
                content: 'Menjadi penyedia sayuran segar terpercaya di wilayah kami.'
            },
            mission: {
                title: 'Misi',
                items: [
                    'Mendampingi petani lokal',
                    'Menciptakan rantai pasok yang adil',
                    'Mengutamakan kualitas dan kebersihan'
                ]
            }
        },
        // Contact/Order section
        contact: {
            title: 'Pesan & Kontak',
            subtitle: 'Isi form atau hubungi kami via WA untuk pesanan cepat.',
            form: {
                name: {
                    label: 'Nama',
                    placeholder: 'Nama lengkap Anda',
                    error: 'Nama harus diisi minimal 3 karakter'
                },
                product: {
                    label: 'Produk',
                    placeholder: 'Pilih produk'
                },
                quantity: {
                    label: 'Jumlah',
                    error: 'Jumlah harus antara 1-100'
                },
                address: {
                    label: 'Alamat',
                    placeholder: 'Alamat lengkap pengiriman',
                    error: 'Alamat harus diisi lengkap (minimal 10 karakter)'
                },
                submit: 'Kirim Pesanan',
                submitting: 'Mengirim...',
                orContact: 'Atau hubungi:',
                errors: {
                    required: 'Semua field harus diisi',
                    serverError: 'Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.',
                    connectionError: 'Gagal terhubung ke server. Mohon periksa koneksi internet Anda atau coba lagi nanti.'
                },
                success: 'Terima kasih {name}! Pesanan Anda berhasil dibuat dengan ID: {orderId}'
            }
        },
        // Map & Delivery
        delivery: {
            title: 'Informasi Pengiriman',
            status: {
                initial: 'Masukkan alamat untuk cek area pengiriman',
                searching: 'Mencari alamat...',
                inRange: '✓ Alamat berada dalam jangkauan pengiriman',
                outOfRange: '✕ Maaf, alamat di luar jangkauan pengiriman',
                notFound: 'Alamat tidak dapat ditemukan. Mohon periksa kembali alamat yang dimasukkan.',
                error: 'Terjadi kesalahan saat mencari alamat'
            },
            distance: {
                prefix: 'Jarak:',
                unit: 'km',
                maxLimit: '(Maksimal: {max} km)'
            },
            eta: {
                prefix: 'Estimasi waktu pengiriman:',
                unit: 'menit'
            },
            legend: {
                deliveryArea: 'Area Pengiriman (Radius 10km)',
                storeLocation: 'Lokasi Toko'
            },
            useLocation: 'Gunakan lokasi saya',
            locationErrors: {
                denied: 'Mohon izinkan akses lokasi.',
                unavailable: 'Tidak dapat mendapatkan lokasi Anda.',
                timeout: 'Waktu mendapatkan lokasi habis. Silakan coba lagi.'
            }
        },
        // Footer
        footer: {
            copyright: '© {year} UMKM CIPAS • Semua hak dilindungi'
        }
    }
};

// Current language
let currentLang = 'id';

// Get translation by key (supports nested keys with dot notation)
function t(key, replacements = {}) {
    const keys = key.split('.');
    let value = translations[currentLang];
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }
    }
    
    // Handle string replacements
    if (typeof value === 'string') {
        return value.replace(/{([^}]+)}/g, (match, key) => {
            return replacements[key] || match;
        });
    }
    
    return value;
}

// Change language (for future use)
function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        // Trigger event for components to update
        window.dispatchEvent(new CustomEvent('languagechange', {
            detail: { language: lang }
        }));
    } else {
        console.warn(`Language ${lang} not supported`);
    }
}

// Get current language
function getCurrentLanguage() {
    return currentLang;
}

// Export functions
export { t, setLanguage, getCurrentLanguage };