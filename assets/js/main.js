// Import styles
import 'aos/dist/aos.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'nprogress/nprogress.css';
import './styles.css';

// Import modules
import AOS from 'aos';
import NProgress from 'nprogress';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Import our modules
import './app.js';
import './autocomplete.js';
import './map.js';
import './address-handler.js';
import './catalog.js';

// Setup leaflet images
const leafletImages = import.meta.glob('/node_modules/leaflet/dist/images/*.png');
L.Icon.Default.imagePath = '/node_modules/leaflet/dist/images/';

// Initialize AOS
AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true
});

// Configure NProgress
NProgress.configure({
    showSpinner: false,
    minimum: 0.1,
    trickleRate: 0.02,
    trickleSpeed: 800
});

// Set copyright year
document.getElementById('year').textContent = new Date().getFullYear();