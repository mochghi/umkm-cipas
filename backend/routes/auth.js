const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Create admin credentials with password hash
const initAdmin = async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('cipas2025', salt);
    console.log('Generated hash for password:', hashedPassword);
    return {
        username: 'umkmcipas',
        password: hashedPassword
    };
};

// Initialize admin object
let admin;
initAdmin().then(adminData => {
    admin = adminData;
    console.log('Admin credentials initialized');
});

// Admin Login route
router.post('/login', async (req, res) => {
    console.log('Login attempt:', req.body);
    try {
        const { username, password } = req.body;
        console.log('Received credentials:', { username, password });

        // Validate input
        if (!username || !password) {
            console.log('Missing credentials');
            return res.status(400).json({ message: 'Username dan password harus diisi' });
        }

        // Check if username exists
        console.log('Checking username:', username, 'Expected:', admin.username);
        if (username !== admin.username) {
            console.log('Username mismatch');
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        // Check password
        console.log('Checking password...');
        const isMatch = await bcrypt.compare(password, admin.password);
        console.log('Password match:', isMatch);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        // Create token
        const token = jwt.sign(
            { username: admin.username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login berhasil',
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Public customer email login (no password) - issues a limited token
router.post('/customer-login', (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email harus diisi' });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Format email tidak valid' });
        }

        const payload = { role: 'customer', email, name: name || null };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({ message: 'Login berhasil', token, user: payload });
    } catch (error) {
        console.error('Customer login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password route (protected)
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password saat ini salah' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);

        res.json({ message: 'Password berhasil diubah' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;