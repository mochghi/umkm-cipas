// Admin Dashboard JavaScript
const API_URL = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000'; // Base URL tanpa /api untuk serving images
let authToken = localStorage.getItem('adminToken');
let allOrders = [];
let filteredOrders = [];
let allProducts = [];

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('adminLogin');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const ordersTableBody = document.getElementById('ordersTableBody');
const orderModal = document.getElementById('orderModal');
const orderModalBody = document.getElementById('orderModalBody');

// Charts
let ordersChart = null;
let statusChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
    setupTabNavigation();
});

// Check if user is already logged in
async function checkAuthStatus() {
    if (authToken) {
        try {
            // Test if token is still valid
            const response = await fetch(`${API_URL}/orders`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                showDashboard();
                return;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
        
        // Token is invalid
        logout();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    loginForm?.addEventListener('submit', handleLogin);
    logoutBtn?.addEventListener('click', logout);
    refreshBtn?.addEventListener('click', loadOrders);
    exportBtn?.addEventListener('click', exportToCSV);
    statusFilter?.addEventListener('change', applyFilters);
    searchInput?.addEventListener('input', debounce(applyFilters, 300));
    dateFrom?.addEventListener('change', applyFilters);
    dateTo?.addEventListener('change', applyFilters);
    
    // Modal close handlers
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    modalClose?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', closeModal);
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memproses...';
    loginError.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: formData.get('username'),
                password: formData.get('password')
            })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            authToken = data.token;
            localStorage.setItem('adminToken', data.token);
            loginForm.reset();
            await showDashboard();
        } else {
            loginError.textContent = data.message || 'Username atau password salah';
            loginError.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Terjadi kesalahan saat login. Silakan coba lagi.';
        loginError.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Show Dashboard
async function showDashboard() {
    loginPage.classList.add('hidden');
    dashboard.classList.remove('hidden');
    await loadOrders();
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    authToken = null;
    allOrders = [];
    filteredOrders = [];
    dashboard.classList.add('hidden');
    loginPage.classList.remove('hidden');
    loginForm.reset();
    loginError.style.display = 'none';
}

// Load Orders
async function loadOrders() {
    try {
        ordersTableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="loading">Memuat data...</div></td></tr>';
        
        const response = await fetch(`${API_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error('Failed to fetch orders');
        }

        allOrders = await response.json();
        filteredOrders = [...allOrders];
        
        updateStats();
        applyFilters();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersTableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:#dc2626;">Gagal memuat data pesanan</td></tr>';
    }
}

// Update Statistics
function updateStats() {
    const stats = {
        pending: 0,
        processing: 0,
        shipped: 0,
        completed: 0
    };
    
    allOrders.forEach(order => {
        if (stats.hasOwnProperty(order.status)) {
            stats[order.status]++;
        }
    });
    
    document.getElementById('statPending').textContent = stats.pending;
    document.getElementById('statProcessing').textContent = stats.processing;
    document.getElementById('statShipped').textContent = stats.shipped;
    document.getElementById('statCompleted').textContent = stats.completed;
}

// Apply Filters
function applyFilters() {
    const statusValue = statusFilter.value;
    const searchValue = searchInput.value.toLowerCase().trim();
    const dateFromValue = dateFrom.value;
    const dateToValue = dateTo.value;
    
    filteredOrders = allOrders.filter(order => {
        // Status filter
        const matchesStatus = !statusValue || order.status === statusValue;
        
        // Search filter
        const matchesSearch = !searchValue || 
            order.name.toLowerCase().includes(searchValue) ||
            order.product.toLowerCase().includes(searchValue) ||
            order.id.includes(searchValue);
        
        // Date filter
        let matchesDate = true;
        if (dateFromValue || dateToValue) {
            const orderDate = new Date(order.orderDate).setHours(0, 0, 0, 0);
            
            if (dateFromValue) {
                const fromDate = new Date(dateFromValue).setHours(0, 0, 0, 0);
                matchesDate = matchesDate && orderDate >= fromDate;
            }
            
            if (dateToValue) {
                const toDate = new Date(dateToValue).setHours(23, 59, 59, 999);
                matchesDate = matchesDate && orderDate <= toDate;
            }
        }
        
        return matchesStatus && matchesSearch && matchesDate;
    });
    
    displayOrders();
    updateStats();
}

// Display Orders
function displayOrders() {
    if (filteredOrders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:2rem;color:#6b7280;">Tidak ada data pesanan</td></tr>';
        return;
    }
    
    ordersTableBody.innerHTML = filteredOrders.map(order => {
        const isCustomRequest = order.isCustomRequest || order.product.startsWith('Request:');
        const productDisplay = isCustomRequest 
            ? `<span style="color:#f59e0b;font-weight:600;">🔖 ${escapeHtml(order.product)}</span>` 
            : escapeHtml(order.product);
        
        return `
        <tr>
            <td><code>${order.id}</code></td>
            <td>${formatDate(order.orderDate)}</td>
            <td><strong>${escapeHtml(order.name)}</strong></td>
            <td>${productDisplay}</td>
            <td>${order.qty}</td>
            <td>
                <select class="status-select" data-order-id="${order.id}" value="${order.status}">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>⚙️ Diproses</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>🚚 Dikirim</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>✅ Selesai</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="showOrderDetail('${order.id}')">
                    Detail
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.id}', '${escapeHtml(order.name)}')">
                    🗑️
                </button>
            </td>
        </tr>
        `;
    }).join('');
    
    // Attach status change handlers
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', handleStatusChange);
    });
}

// Handle Status Change
async function handleStatusChange(e) {
    const orderId = e.target.dataset.orderId;
    const newStatus = e.target.value;
    const originalStatus = e.target.dataset.originalStatus || e.target.value;
    
    if (!confirm(`Ubah status pesanan menjadi "${getStatusLabel(newStatus)}"?`)) {
        e.target.value = originalStatus;
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            // Update local data
            const orderIndex = allOrders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                allOrders[orderIndex].status = newStatus;
            }
            
            updateStats();
            applyFilters();
            
            showNotification('Status pesanan berhasil diperbarui', 'success');
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Gagal memperbarui status pesanan', 'error');
        e.target.value = originalStatus;
    }
}

// Delete Order
async function deleteOrder(orderId, customerName) {
    const confirmMsg = `Hapus pesanan dari "${customerName}"?\n\nTindakan ini tidak dapat dibatalkan.`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            // Remove from local array
            const index = allOrders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                allOrders.splice(index, 1);
            }
            
            // Update UI
            updateStats();
            applyFilters();
            
            showNotification('✓ Pesanan berhasil dihapus', 'success');
        } else {
            throw new Error('Failed to delete order');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        showNotification('Gagal menghapus pesanan', 'error');
    }
}

// Show Order Detail Modal
function showOrderDetail(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    orderModalBody.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">ID Pesanan:</div>
            <div class="detail-value"><code>${order.id}</code></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Tanggal:</div>
            <div class="detail-value">${formatDate(order.orderDate, true)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Nama Pelanggan:</div>
            <div class="detail-value"><strong>${escapeHtml(order.name)}</strong></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Produk:</div>
            <div class="detail-value">
                ${order.isCustomRequest || order.product.startsWith('Request:') 
                    ? `<span style="color:#f59e0b;font-weight:600;">🔖 ${escapeHtml(order.product)}</span>
                       <div style="margin-top:0.5rem;padding:0.5rem;background:#fef3c7;border-left:3px solid #f59e0b;font-size:0.875rem;">
                           <strong>Catatan:</strong> Ini adalah request produk khusus dari pelanggan. Pastikan ketersediaan produk sebelum konfirmasi.
                       </div>` 
                    : escapeHtml(order.product)
                }
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Jumlah:</div>
            <div class="detail-value">${order.qty}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Alamat:</div>
            <div class="detail-value">${escapeHtml(order.address)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Status:</div>
            <div class="detail-value">
                <span class="status-badge ${order.status}">${getStatusLabel(order.status)}</span>
            </div>
        </div>
    `;
    
    orderModal.classList.remove('hidden');
}

// Close Modal
function closeModal() {
    orderModal.classList.add('hidden');
}

// Export to CSV
function exportToCSV() {
    if (filteredOrders.length === 0) {
        showNotification('Tidak ada data untuk di-export', 'error');
        return;
    }
    
    // CSV Headers
    const headers = ['ID Pesanan', 'Tanggal', 'Nama Pelanggan', 'Produk', 'Jumlah', 'Alamat', 'Status'];
    
    // CSV Rows
    const rows = filteredOrders.map(order => {
        return [
            order.id,
            formatDateForCSV(order.orderDate),
            order.name,
            order.product,
            order.qty,
            order.address.replace(/\n/g, ' ').replace(/,/g, ';'), // Replace newlines and commas
            getStatusLabel(order.status)
        ];
    });
    
    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `pesanan_umkm_cipas_${dateStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`✓ Data berhasil di-export (${filteredOrders.length} pesanan)`, 'success');
}

// Utility Functions

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Utility Functions
function formatDate(dateString, includeTime = false) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return date.toLocaleString('id-ID', options);
}

function formatDateForCSV(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusLabel(status) {
    const labels = {
        pending: 'Pending',
        processing: 'Diproses',
        shipped: 'Dikirim',
        completed: 'Selesai'
    };
    return labels[status] || status;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Tab Navigation
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.dataset.tab;
            
            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}Section`).classList.add('active');
            
            // Load data based on tab
            if (tabName === 'analytics') {
                loadAnalytics();
            } else if (tabName === 'products') {
                loadProducts();
            }
        });
    });
}

// Analytics Functions
function loadAnalytics() {
    if (allOrders.length === 0) return;
    
    updateAnalyticsSummary();
    createOrdersChart();
    createStatusChart();
    displayTopProducts();
}

function updateAnalyticsSummary() {
    const total = allOrders.length;
    const completed = allOrders.filter(o => o.status === 'completed').length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
    
    // Today's orders
    const today = new Date().setHours(0, 0, 0, 0);
    const todayOrders = allOrders.filter(o => {
        return new Date(o.orderDate).setHours(0, 0, 0, 0) === today;
    });
    
    // Top product
    const productStats = {};
    allOrders.forEach(order => {
        if (!productStats[order.product]) {
            productStats[order.product] = 0;
        }
        productStats[order.product] += order.qty;
    });
    
    const topProduct = Object.entries(productStats).sort((a, b) => b[1] - a[1])[0];
    
    // Update UI
    document.getElementById('totalOrders').textContent = total;
    document.getElementById('completedOrders').textContent = completed;
    document.getElementById('completionRate').textContent = `${completionRate}% completion rate`;
    document.getElementById('topProduct').textContent = topProduct ? topProduct[0] : '-';
    document.getElementById('topProductQty').textContent = topProduct ? `${topProduct[1]} terjual` : '0 terjual';
    document.getElementById('todayOrders').textContent = todayOrders.length;
    document.getElementById('todayChange').textContent = `dari ${total} total`;
}

function createOrdersChart() {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (ordersChart) {
        ordersChart.destroy();
    }
    
    // Get last 7 days data
    const last7Days = [];
    const orderCounts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const label = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        last7Days.push(label);
        
        const count = allOrders.filter(order => {
            const orderDate = new Date(order.orderDate).setHours(0, 0, 0, 0);
            return orderDate === date.getTime();
        }).length;
        
        orderCounts.push(count);
    }
    
    ordersChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Pesanan',
                data: orderCounts,
                borderColor: '#19692d',
                backgroundColor: 'rgba(25, 105, 45, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (statusChart) {
        statusChart.destroy();
    }
    
    const statusCounts = {
        pending: 0,
        processing: 0,
        shipped: 0,
        completed: 0
    };
    
    allOrders.forEach(order => {
        statusCounts[order.status]++;
    });
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Diproses', 'Dikirim', 'Selesai'],
            datasets: [{
                data: [
                    statusCounts.pending,
                    statusCounts.processing,
                    statusCounts.shipped,
                    statusCounts.completed
                ],
                backgroundColor: [
                    '#fef3c7',
                    '#dbeafe',
                    '#e0e7ff',
                    '#d1fae5'
                ],
                borderColor: [
                    '#f59e0b',
                    '#3b82f6',
                    '#8b5cf6',
                    '#10b981'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function displayTopProducts() {
    const productStats = {};
    
    allOrders.forEach(order => {
        if (!productStats[order.product]) {
            productStats[order.product] = {
                qty: 0,
                orders: 0
            };
        }
        productStats[order.product].qty += order.qty;
        productStats[order.product].orders++;
    });
    
    const sorted = Object.entries(productStats)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 10);
    
    const tbody = document.getElementById('topProductsBody');
    if (!tbody) return;
    
    tbody.innerHTML = sorted.map(([ product, stats], index) => `
        <tr>
            <td>
                <span style="font-weight:700;color:${index < 3 ? '#f59e0b' : '#6b7280'};">
                    ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
            </td>
            <td><strong>${escapeHtml(product)}</strong></td>
            <td><strong>${stats.qty}</strong> unit</td>
            <td>${stats.orders} pesanan</td>
        </tr>
    `).join('');
}

// ========== PRODUCTS MANAGEMENT ==========

// Load Products
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (response.ok) {
            allProducts = await response.json();
            displayProducts();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Gagal memuat produk', 'error');
    }
}

// Display Products Grid
function displayProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (allProducts.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#6b7280;padding:3rem;">Belum ada produk. Tambahkan produk pertama Anda!</p>';
        return;
    }
    
    grid.innerHTML = allProducts.map(product => `
        <div class="product-card">
            <img src="${product.image ? (product.image.startsWith('http') ? product.image : BASE_URL + product.image) : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%236b7280%22 font-size=%2218%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'}" alt="${escapeHtml(product.name)}" class="product-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%236b7280%22 font-size=%2218%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            <div class="product-body">
                <div class="product-header">
                    <h4 class="product-name">${escapeHtml(product.name)}</h4>
                    <span class="product-category">${escapeHtml(product.category)}</span>
                </div>
                <p class="product-price">Rp ${product.price.toLocaleString('id-ID')} / ${product.unit}</p>
                ${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ''}
                <div class="product-meta">
                    <span>📦 Stok: ${product.stock}</span>
                    <span>${formatDate(product.createdAt)}</span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-sm btn-outline" onclick="editProduct('${product.id}')">✏️ Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct('${product.id}', '${escapeHtml(product.name)}')">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Show Product Modal (Add/Edit)
function showProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    const imagePreview = document.getElementById('imagePreview');
    
    form.reset();
    imagePreview.classList.add('hidden');
    
    if (productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;
        
        title.textContent = 'Edit Produk';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productUnit').value = product.unit;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productDescription').value = product.description || '';
        
        if (product.image) {
            document.getElementById('previewImg').src = product.image.startsWith('http') ? product.image : BASE_URL + product.image;
            imagePreview.classList.remove('hidden');
        }
    } else {
        title.textContent = 'Tambah Produk';
        document.getElementById('productId').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
}

// Handle Product Form Submit
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productId = formData.get('productId');
    const isEdit = !!productId;
    
    const submitBtn = document.getElementById('saveProductBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';
    
    try {
        const url = isEdit ? `${API_URL}/products/${productId}` : `${API_URL}/products`;
        const method = isEdit ? 'PUT' : 'POST';
        
        // Remove productId from formData as it's not needed in request body
        formData.delete('productId');
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            await loadProducts();
            closeProductModal();
            showNotification(`✓ Produk berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`, 'success');
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Gagal menyimpan produk');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification(error.message || 'Gagal menyimpan produk', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Edit Product
function editProduct(productId) {
    showProductModal(productId);
}

// Delete Product
async function deleteProduct(productId, productName) {
    if (!confirm(`Hapus produk "${productName}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            await loadProducts();
            showNotification('✓ Produk berhasil dihapus', 'success');
        } else {
            throw new Error('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Gagal menghapus produk', 'error');
    }
}

// Image Preview
document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.classList.add('hidden');
            }
        });
    }
    
    // Product form submit
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Product modal handlers
    const addProductBtn = document.getElementById('addProductBtn');
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    const productModalClose = document.getElementById('productModalClose');
    
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => showProductModal());
    }
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', closeProductModal);
    }
    if (productModalClose) {
        productModalClose.addEventListener('click', closeProductModal);
    }
});

// Make functions available globally
window.showOrderDetail = showOrderDetail;
window.deleteOrder = deleteOrder;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
