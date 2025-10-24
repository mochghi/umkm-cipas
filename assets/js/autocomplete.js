// Kelas untuk mengelola autocomplete alamat
class AddressAutocomplete {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            delay: 500,
            minChars: 3,
            maxResults: 5,
            ...options
        };

        this.results = [];
        this.selectedIndex = -1;
        this.timeout = null;

        // Buat container untuk suggestions
        this.container = document.createElement('div');
        this.container.className = 'address-suggestions';
        this.input.parentNode.insertBefore(this.container, this.input.nextSibling);

        // Bind event handlers
        this.handleInput = this.handleInput.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);

        // Setup event listeners
        this.input.addEventListener('input', this.handleInput);
        this.input.addEventListener('keydown', this.handleKeydown);
        document.addEventListener('click', this.handleClickOutside);
    }

    async handleInput(e) {
        const value = e.target.value.trim();
        
        // Clear previous timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // Hide suggestions if input is too short
        if (value.length < this.options.minChars) {
            this.hideSuggestions();
            return;
        }

        // Set new timeout for API call
        this.timeout = setTimeout(async () => {
            try {
                const suggestions = await this.fetchSuggestions(value);
                this.showSuggestions(suggestions);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }, this.options.delay);
    }

    handleKeydown(e) {
        // Jika tidak ada suggestions, skip
        if (!this.results.length) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
                this.highlightSuggestion();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.highlightSuggestion();
                break;

            case 'Enter':
                if (this.selectedIndex >= 0) {
                    e.preventDefault();
                    this.selectSuggestion(this.results[this.selectedIndex]);
                }
                break;

            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    handleClickOutside(e) {
        if (!this.container.contains(e.target) && e.target !== this.input) {
            this.hideSuggestions();
        }
    }

    async fetchSuggestions(query) {
        // Format query untuk Nominatim
        const params = new URLSearchParams({
            format: 'json',
            q: query + ', Bandung',
            limit: this.options.maxResults,
            addressdetails: 1
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'UMKM CIPAS Website'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        return data.map(item => ({
            display: this.formatAddress(item),
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
        }));
    }

    formatAddress(item) {
        const parts = [];
        const details = item.address;

        // Format alamat dari detail yang tersedia
        if (details.road) parts.push(details.road);
        if (details.suburb) parts.push(details.suburb);
        if (details.city_district) parts.push(details.city_district);
        if (details.city) parts.push(details.city);

        return parts.join(', ');
    }

    showSuggestions(suggestions) {
        this.results = suggestions;
        this.selectedIndex = -1;

        // Clear previous suggestions
        this.container.innerHTML = '';

        if (!suggestions.length) {
            this.container.style.display = 'none';
            return;
        }

        // Create and append suggestion elements
        const ul = document.createElement('ul');
        suggestions.forEach((suggestion, index) => {
            const li = document.createElement('li');
            li.textContent = suggestion.display;
            li.addEventListener('click', () => this.selectSuggestion(suggestion));
            li.addEventListener('mouseover', () => {
                this.selectedIndex = index;
                this.highlightSuggestion();
            });
            ul.appendChild(li);
        });

        this.container.appendChild(ul);
        this.container.style.display = 'block';
    }

    hideSuggestions() {
        this.container.style.display = 'none';
        this.results = [];
        this.selectedIndex = -1;
    }

    highlightSuggestion() {
        const items = this.container.querySelectorAll('li');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    selectSuggestion(suggestion) {
        this.input.value = suggestion.display;
        this.hideSuggestions();
        
        // Trigger geocoding dengan koordinat yang sudah ada
        if (this.options.onSelect) {
            this.options.onSelect({
                address: suggestion.display,
                lat: suggestion.lat,
                lon: suggestion.lon
            });
        }
    }

    // Cleanup method
    destroy() {
        this.input.removeEventListener('input', this.handleInput);
        this.input.removeEventListener('keydown', this.handleKeydown);
        document.removeEventListener('click', this.handleClickOutside);
        this.container.remove();
    }
}

// Export kelas untuk digunakan di app.js
export default AddressAutocomplete;