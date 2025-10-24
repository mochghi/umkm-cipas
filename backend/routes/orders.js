const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Array to store orders (in real application, use a database)
let orders = [];

// Get all orders
router.get('/', (req, res) => {
  res.json(orders);
});

// Create new order (requires customer login)
router.post('/', auth, (req, res) => {
  const { name, product, qty, address } = req.body;
  
  // Validate request
  if (!name || !product || !qty || !address) {
    return res.status(400).json({ 
      message: 'Semua field harus diisi'
    });
  }

  const order = {
    id: Date.now().toString(),
    name,
    product,
    qty,
    address,
    status: 'pending',
    customerEmail: req.user?.email || null,
    orderDate: new Date().toISOString()
  };

  orders.push(order);
  
  // In a real application, you might want to:
  // 1. Save to database
  // 2. Send confirmation email/SMS
  // 3. Notify admin via WhatsApp/Telegram
  
  res.status(201).json({
    message: 'Pesanan berhasil dibuat',
    orderId: order.id
  });
});

// Get order by ID
router.get('/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
  }
  res.json(order);
});

// Update order status
router.patch('/:id', auth, (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  
  if (!order) {
    return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
  }
  
  order.status = status;
  res.json({ message: 'Status pesanan diperbarui', order });
});

// Delete order
router.delete('/:id', auth, (req, res) => {
  const orderIndex = orders.findIndex(o => o.id === req.params.id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
  }
  
  const deletedOrder = orders[orderIndex];
  orders.splice(orderIndex, 1);
  
  res.json({ 
    message: 'Pesanan berhasil dihapus',
    order: deletedOrder
  });
});

module.exports = router;