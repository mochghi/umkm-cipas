const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
const path = require('path');
app.use(express.static(path.join(__dirname, '..'), { index: false }));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Handle root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'), (err) => {
        if (err) {
            console.error('Error sending index file:', err);
            res.status(500).send('Terjadi kesalahan saat memuat halaman');
        }
    });
});

// Specific route for admin page
app.get('/admin', (req, res) => {
    const adminPath = require('path').resolve(__dirname, '../admin/index.html');
    console.log('Trying to serve admin page from:', adminPath);
    res.sendFile(adminPath, (err) => {
        if (err) {
            console.error('Error sending admin file:', err);
            res.status(500).send('Error loading admin page');
        }
    });
});

// Import routes and middleware
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const auth = require('./middleware/auth');

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes); // Membuat orders menjadi public route
app.use('/api/products', productsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    version: '1.0.0'
  });
});

// Debug routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Handle 404 - Page not found
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ message: 'API endpoint tidak ditemukan' });
  } else {
    res.status(404).sendFile(path.join(__dirname, '../404.html'), (err) => {
      if (err) {
        res.status(404).send('Halaman tidak ditemukan');
      }
    });
  }
});

// Handle 500 - Server error
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.path.startsWith('/api')) {
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  } else {
    res.status(500).send('Terjadi kesalahan pada server');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Admin page should be accessible at http://localhost:${port}/admin`);
});