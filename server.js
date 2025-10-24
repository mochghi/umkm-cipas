const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Simpan orders di memory untuk demo
let orders = [];
let nextOrderId = 1;

// Orders endpoint
app.post('/api/orders', (req, res) => {
    try {
        const { name, product, qty, address } = req.body;

        // Validasi input
        if (!name || !product || !qty || !address) {
            return res.status(400).json({
                success: false,
                message: 'Semua field harus diisi'
            });
        }

        // Buat order baru
        const order = {
            orderId: nextOrderId++,
            name,
            product,
            qty,
            address,
            createdAt: new Date()
        };

        // Simpan order
        orders.push(order);

        // Kirim response
        res.status(201).json({
            success: true,
            message: 'Order berhasil dibuat',
            orderId: order.orderId
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat membuat order'
        });
    }
});

// Get orders endpoint (untuk testing)
app.get('/api/orders', (req, res) => {
    res.json(orders);
});

// Start server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});