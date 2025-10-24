const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/products');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// In-memory products storage (replace with database in production)
let products = [
    {
        id: '1',
        name: 'Bayam Organik',
        price: 6000,
        unit: 'ikat',
        description: 'Bayam segar organik tanpa pestisida',
        image: '/api/products/placeholder/veg1.svg',
        stock: 50,
        category: 'Sayuran Hijau',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Kangkung',
        price: 4500,
        unit: 'ikat',
        description: 'Kangkung segar dari petani lokal',
        image: '/api/products/placeholder/veg2.svg',
        stock: 60,
        category: 'Sayuran Hijau',
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Cabai Merah',
        price: 30000,
        unit: 'kg',
        description: 'Cabai merah segar dan pedas',
        image: '/api/products/placeholder/veg3.svg',
        stock: 20,
        category: 'Bumbu',
        createdAt: new Date().toISOString()
    }
];

// Get all products
router.get('/', (req, res) => {
    res.json(products);
});

// Get product by ID
router.get('/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    res.json(product);
});

// Create new product (admin only)
router.post('/', auth, upload.single('image'), (req, res) => {
    try {
        const { name, price, unit, description, stock, category } = req.body;
        
        if (!name || !price || !unit) {
            return res.status(400).json({ message: 'Nama, harga, dan unit harus diisi' });
        }
        
        const product = {
            id: Date.now().toString(),
            name,
            price: parseInt(price),
            unit,
            description: description || '',
            image: req.file ? `/api/products/images/${req.file.filename}` : null,
            stock: parseInt(stock) || 0,
            category: category || 'Lainnya',
            createdAt: new Date().toISOString()
        };
        
        products.push(product);
        res.status(201).json({ message: 'Produk berhasil ditambahkan', product });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Gagal menambahkan produk' });
    }
});

// Update product (admin only)
router.put('/:id', auth, upload.single('image'), (req, res) => {
    try {
        const productIndex = products.findIndex(p => p.id === req.params.id);
        
        if (productIndex === -1) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        
        const { name, price, unit, description, stock, category } = req.body;
        const oldProduct = products[productIndex];
        
        // Update product data
        products[productIndex] = {
            ...oldProduct,
            name: name || oldProduct.name,
            price: price ? parseInt(price) : oldProduct.price,
            unit: unit || oldProduct.unit,
            description: description !== undefined ? description : oldProduct.description,
            stock: stock !== undefined ? parseInt(stock) : oldProduct.stock,
            category: category || oldProduct.category,
            image: req.file ? `/api/products/images/${req.file.filename}` : oldProduct.image,
            updatedAt: new Date().toISOString()
        };
        
        // Delete old image if new one uploaded
        if (req.file && oldProduct.image && !oldProduct.image.includes('placeholder')) {
            const oldImagePath = path.join(__dirname, '../uploads/products', path.basename(oldProduct.image));
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        
        res.json({ message: 'Produk berhasil diperbarui', product: products[productIndex] });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Gagal memperbarui produk' });
    }
});

// Delete product (admin only)
router.delete('/:id', auth, (req, res) => {
    const productIndex = products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
        return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    
    const deletedProduct = products[productIndex];
    
    // Delete image file
    if (deletedProduct.image && !deletedProduct.image.includes('placeholder')) {
        const imagePath = path.join(__dirname, '../uploads/products', path.basename(deletedProduct.image));
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }
    
    products.splice(productIndex, 1);
    res.json({ message: 'Produk berhasil dihapus', product: deletedProduct });
});

// Serve uploaded images
router.get('/images/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../uploads/products', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ message: 'Image not found' });
    }
});

// Serve placeholder images
router.get('/placeholder/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../../assets/images', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ message: 'Image not found' });
    }
});

module.exports = router;
