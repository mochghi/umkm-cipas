// API Configuration
const API_URL = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000';

// Products data - will be fetched from API
let productsData = [];

function formatIDR(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

// Render featured products carousel on homepage
function renderFeaturedProducts(products) {
  const carousel = document.querySelector('.products-carousel .card-grid');
  if (!carousel) return; // Not on homepage

  carousel.innerHTML = '';

  if (!products || products.length === 0) {
    carousel.innerHTML = '<p class="muted">Belum ada produk tersedia.</p>';
    return;
  }

  // Show first 6 products as featured
  const featured = products.slice(0, 6);
  
  featured.forEach((p, idx) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('data-aos', 'fade-up');
    article.setAttribute('data-aos-delay', String(100 + idx * 50));

    const img = document.createElement('img');
    const imageUrl = p.image 
      ? (p.image.startsWith('http') ? p.image : BASE_URL + p.image)
      : '/assets/images/veg1.svg';
    img.src = imageUrl;
    img.alt = p.name;
    img.loading = 'lazy';
    img.onerror = function() {
      this.src = '/assets/images/veg1.svg';
    };

    const title = document.createElement('h4');
    title.textContent = p.name;

    const price = document.createElement('div');
    price.className = 'price-badge';
    price.textContent = `${formatIDR(p.price)} / ${p.unit}`;

    const actions = document.createElement('div');
    actions.className = 'actions';
    
    const orderBtn = document.createElement('a');
    orderBtn.className = 'btn btn-sm btn-primary';
    orderBtn.href = '#kontak';
    orderBtn.textContent = 'Pesan';
    orderBtn.onclick = () => window.selectProduct?.(p.name);

    const detailBtn = document.createElement('a');
    detailBtn.className = 'btn btn-sm btn-outline';
    detailBtn.href = '#produk';
    detailBtn.setAttribute('aria-label', 'Detail produk');
    detailBtn.textContent = 'Detail';

    actions.appendChild(orderBtn);
    actions.appendChild(detailBtn);

    article.appendChild(img);
    article.appendChild(title);
    article.appendChild(price);
    article.appendChild(actions);

    carousel.appendChild(article);
  });
}

function renderProducts(list) {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!list || list.length === 0) {
    grid.innerHTML = '<p class="muted">Produk tidak ditemukan.</p>';
    return;
  }

  const frag = document.createDocumentFragment();
  list.forEach((p, idx) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('role', 'listitem');
    article.setAttribute('data-aos', 'fade-up');
    article.setAttribute('data-aos-delay', String(100 + idx * 50));

    const img = document.createElement('img');
    // Handle image URL properly
    const imageUrl = p.image 
      ? (p.image.startsWith('http') ? p.image : BASE_URL + p.image)
      : '/assets/images/veg1.svg';
    img.src = imageUrl;
    img.alt = p.name;
    img.loading = 'lazy';
    // Fallback to default image on error
    img.onerror = function() {
      this.src = '/assets/images/veg1.svg';
    };

    const title = document.createElement('h4');
    title.textContent = p.name;

    const price = document.createElement('div');
    price.className = 'price-badge';
    price.textContent = `${formatIDR(p.price)} / ${p.unit}`;

    const stock = document.createElement('div');
    stock.className = 'muted small';
    stock.textContent = `Stok: ${p.stock}`;

    const actions = document.createElement('div');
    actions.className = 'actions';
    const order = document.createElement('a');
    order.className = 'btn btn-sm btn-primary';
    order.href = '#kontak';
    order.textContent = 'Pesan';
    order.addEventListener('click', () => window.selectProduct?.(p.name));

    const detail = document.createElement('a');
    detail.className = 'btn btn-sm btn-outline';
    detail.href = '#produk';
    detail.setAttribute('aria-label', 'Detail produk');
    detail.textContent = 'Detail';

    actions.appendChild(order);
    actions.appendChild(detail);

    article.appendChild(img);
    article.appendChild(title);
    article.appendChild(price);
    article.appendChild(stock);
    article.appendChild(actions);

    frag.appendChild(article);
  });

  grid.appendChild(frag);
}

function populateProductSelect(list) {
  const select = document.getElementById('product');
  if (!select) return;
  const current = select.value;
  // Keep first placeholder option
  select.innerHTML = '<option value="">Pilih produk</option>';
  list.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
  if (current && list.some(p => p.name === current)) {
    select.value = current;
  }
}

function setupFilters(allProducts) {
  const search = document.getElementById('productSearch');
  const category = document.getElementById('categoryFilter');

  const apply = () => {
    const q = (search?.value || '').toLowerCase();
    const cat = category?.value || '';
    const filtered = allProducts.filter(p => {
      const okCat = cat ? p.category === cat : true;
      const okText = q ? (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) : true;
      return okCat && okText;
    });
    renderProducts(filtered);
  };

  search?.addEventListener('input', apply);
  category?.addEventListener('change', apply);

  // initial
  apply();
}

// Fetch products from API
async function fetchProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      throw new Error('Gagal mengambil data produk');
    }
    const products = await response.json();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return empty array on error
    return [];
  }
}

async function initCatalog() {
  try {
    // Show loading state
    const grid = document.getElementById('catalogGrid');
    if (grid) {
      grid.innerHTML = '<p class="muted">Memuat produk...</p>';
    }

    // Fetch products from API
    productsData = await fetchProducts();
    
    if (!Array.isArray(productsData) || productsData.length === 0) {
      if (grid) {
        grid.innerHTML = '<p class="muted">Belum ada produk tersedia.</p>';
      }
      return;
    }

    // Render featured products on homepage
    renderFeaturedProducts(productsData);

    // Populate and render catalog page
    populateProductSelect(productsData);
    renderProducts(productsData);
    setupFilters(productsData);
  } catch (e) {
    console.error('Gagal memuat katalog:', e);
    const grid = document.getElementById('catalogGrid');
    if (grid) {
      grid.innerHTML = '<p class="muted text-error">Gagal memuat produk. Silakan refresh halaman.</p>';
    }
  }
}

document.addEventListener('DOMContentLoaded', initCatalog);
