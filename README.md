# UMKM CIPAS — Sistem E-Commerce Sayuran Segar

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)
![Express](https://img.shields.io/badge/express-4.21.2-lightgrey.svg)
![Vite](https://img.shields.io/badge/vite-5.4.21-646CFF.svg)
![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)

Platform e-commerce full-stack untuk UMKM CIPAS (CIwaruga PAngan Sehat) - menyediakan sayuran segar berkualitas dengan sistem pemesanan online.

> 🌱 **Live Demo**: [Coming Soon - Deploy in Progress]

## 📸 Screenshots

<details>
<summary>Klik untuk lihat screenshot</summary>

### Homepage & Katalog Produk
![Homepage](docs/screenshots/homepage.png)
*Halaman utama dengan carousel produk unggulan*

### Form Pemesanan dengan Map
![Order Form](docs/screenshots/order-form.png)
*Form pemesanan dengan validasi real-time dan radius pengiriman*

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin-dashboard.png)
*Dashboard admin dengan statistik dan analytics*

### Manajemen Produk
![Product Management](docs/screenshots/product-management.png)
*Upload dan kelola produk dengan gambar*

</details>

## 🚀 Fitur Utama

### Frontend (Publik)
- 🛒 Katalog produk dinamis dengan gambar dan filter
- 🗺️ Map interaktif pengiriman (Leaflet + radius check)
- 📧 Login email untuk pemesanan (non-persistent)
- 📱 Form pemesanan dengan validasi real-time
- 🎯 Request produk custom
- 📍 Autocomplete alamat

### Admin Dashboard
- 🔐 Login admin dengan JWT
- 📊 Manajemen pesanan (view, update status, delete, export CSV)
- 📈 Analytics & statistik (Chart.js: tren, status, top produk)
- 🖼️ Manajemen produk dengan upload gambar (Multer)
- 🎨 Dark mode UI profesional

### Backend API
- ✅ RESTful API dengan Express
- 🔒 JWT Authentication (role: admin & customer)
- 📦 CRUD produk & pesanan
- 🖼️ Image upload & serving (5MB limit, mimetype validation)
- 💾 In-memory storage (siap migrasi ke DB)

## 🛠️ Tech Stack

**Frontend:**
- Vite 5.4.21
- Vanilla JavaScript (ES modules)
- Leaflet (maps)
- AOS (animations)
- Chart.js (analytics)

**Backend:**
- Node.js v22+
- Express 4.21.2
- JWT + bcryptjs
- Multer (file upload)
- CORS enabled

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/[username]/umkm-cipas.git
cd umkm-cipas
```

### 2. Install Dependencies
```bash
# Frontend (root)
npm install

# Backend
cd backend
npm install
cd ..
```

### 3. Setup Environment
```bash
# Copy example env dan edit JWT_SECRET
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=3000
JWT_SECRET=ganti-dengan-secret-key-anda-yang-panjang-dan-aman
```

### 4. Buat Folder Upload
```bash
mkdir -p backend/uploads/products
```

### 5. Run Development
```bash
# Terminal 1 - Backend (port 3000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3001)
npm run dev
```

**Akses:**
- Homepage: http://localhost:3000/
- Admin: http://localhost:3000/admin
  - Username: `umkmcipas`
  - Password: `cipas2025`

> ⚠️ **Production:** Ubah password admin dan JWT_SECRET sebelum deploy!

## 📡 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products` | List semua produk |
| GET | `/api/products/images/:filename` | Serve gambar produk |
| POST | `/api/auth/customer-login` | Login customer (email) |
| POST | `/api/orders` | Buat pesanan (perlu token customer) |

### Admin Endpoints (Require JWT)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login admin | - |
| POST | `/api/auth/change-password` | Ganti password | Bearer |
| GET | `/api/orders` | List pesanan | - |
| PATCH | `/api/orders/:id` | Update status pesanan | Bearer |
| DELETE | `/api/orders/:id` | Hapus pesanan | Bearer |
| POST | `/api/products` | Tambah produk + upload | Bearer |
| PUT | `/api/products/:id` | Update produk | Bearer |
| DELETE | `/api/products/:id` | Hapus produk | Bearer |

**Example Request:**
```bash
# Customer login
curl -X POST http://localhost:3000/api/auth/customer-login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","name":"John Doe"}'

# Admin login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"umkmcipas","password":"cipas2025"}'

# Create order (with customer token)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"John","product":"Bayam Organik","qty":2,"address":"Jl. Example No.1"}'
```

## 📁 Project Structure

```
UMKM CIPAS/
├── admin/                  # Admin dashboard
│   ├── index.html         # Admin UI
│   ├── admin.js           # Dashboard logic
│   └── admin-styles.css   # Admin styling
├── assets/
│   ├── css/
│   │   └── styles.css     # Main stylesheet
│   ├── js/
│   │   ├── app.js         # Main app logic
│   │   ├── catalog.js     # Product catalog
│   │   ├── map.js         # Leaflet map
│   │   ├── autocomplete.js
│   │   ├── form-utils.js
│   │   └── i18n.js
│   └── images/
├── backend/
│   ├── server.js          # Express server
│   ├── middleware/
│   │   └── auth.js        # JWT middleware
│   ├── routes/
│   │   ├── auth.js        # Auth endpoints
│   │   ├── orders.js      # Order management
│   │   └── products.js    # Product + upload
│   ├── uploads/
│   │   └── products/      # Uploaded images
│   ├── package.json
│   └── .env.example
├── index.html             # Homepage
├── 404.html
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

## 🔒 Security Notes

- JWT tokens expire after 24h (admin) and 30d (customer)
- Passwords hashed with bcryptjs (salt rounds: 10)
- Image uploads limited to 5MB, images only
- CORS enabled for development
- Customer emails required for orders
- Admin routes protected with JWT middleware

## 🚀 Deployment

### Backend (Railway/Render)
```bash
# Set environment variables
PORT=3000
JWT_SECRET=your-production-secret-key-min-32-chars
NODE_ENV=production

# Build command
npm install --prefix backend

# Start command
npm start --prefix backend
```

### Frontend (Netlify/Vercel)
```bash
# Build command
npm run build

# Publish directory
dist

# Redirect rules (_redirects for Netlify)
/*    /index.html   200
```

## 📝 Development Roadmap

### ✅ Completed
- [x] JWT Authentication (admin & customer)
- [x] Product management with image upload
- [x] Order management (CRUD)
- [x] Admin dashboard with analytics
- [x] Export CSV with filters
- [x] Real-time form validation
- [x] Map-based delivery radius
- [x] Custom product requests
- [x] Non-persistent customer login

### 🔄 In Progress / Planned

**Phase 1: Database Migration**
- [ ] SQLite/PostgreSQL for products & orders
- [ ] Database migrations
- [ ] Seed data script

**Phase 2: Enhanced Features**
- [ ] WhatsApp/Telegram notifications
- [ ] Customer order tracking page
- [ ] Email verification (OTP)
- [ ] Product categories & tags
- [ ] Pagination & sorting

**Phase 3: Production Ready**
- [ ] Rate limiting & security headers
- [ ] Unit & integration tests
- [ ] Logging & monitoring
- [ ] PWA support
- [ ] SEO optimization

**Phase 4: Payment & Shipping**
- [ ] Payment gateway (Midtrans/Xendit)
- [ ] Shipping cost calculator
- [ ] Multiple delivery options
- [ ] Invoice generation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use for your own UMKM projects!

See [LICENSE](LICENSE) file for details.

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

## 👥 Contact

UMKM CIPAS - Ciwaruga, Bandung

- 🌐 Website: https://github.com/mochghi/umkm-cipas
- 📧 Email: umkmcipas@example.com
- 📱 WhatsApp: +62 800 0000 000

---

**Made with ❤️ for Indonesian UMKM**

---

**⚠️ Important Notes:**
- Data saat ini tersimpan di memory (hilang saat restart)
- Untuk production: migrasi ke database & ubah credentials default
- Backup data produk & pesanan secara berkala

UMKM CIPAS - Ciwaruga, Bandung
- Website: [Coming Soon]
- Email: umkmcipas@example.com
- WhatsApp: +62 800 0000 000

---

**⚠️ Important Notes:**
- Data saat ini tersimpan di memory (hilang saat restart)
- Untuk production: migrasi ke database & ubah credentials default
- Backup data produk & pesanan secara berkala
