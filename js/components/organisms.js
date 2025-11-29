import { getMarkerColor } from '../utils.js';
import { generatePopupContent, createCard } from './molecules.js';

export class MapController {
    constructor(mapId) {
        this.mapId = mapId;
        this.map = null;
        this.markers = [];
        this.layers = {}; // Store layers here
        this.currentLayer = null;
    }

    init() {
        this.map = L.map(this.mapId, {
            zoomControl: false
        }).setView([7.9, 81.0], 6);

        // Define available layers
        this.layers = {
            osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }),
            carto: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            })
        };

        // Set default layer
        this.currentLayer = this.layers.osm;
        this.currentLayer.addTo(this.map);
    }

    setProvider(providerKey) {
        if (this.layers[providerKey] && this.currentLayer !== this.layers[providerKey]) {
            this.map.removeLayer(this.currentLayer);
            this.currentLayer = this.layers[providerKey];
            this.currentLayer.addTo(this.map);
        }
    }

    renderMarkers(data) {
        // Clear existing markers
        this.markers.forEach(m => this.map.removeLayer(m.marker));
        this.markers = [];

        const bounds = L.latLngBounds();

        data.forEach(item => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lng);

            if (isNaN(lat) || isNaN(lng)) return;

            const color = getMarkerColor(item._displayStatus);
            const opacity = item._displayStatus === 'stale' ? 0.5 : 1.0;

            const marker = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: opacity
            });

            const popupContent = generatePopupContent(item);
            marker.bindPopup(popupContent);

            marker.addTo(this.map);
            this.markers.push({ marker, data: item });
            bounds.extend([lat, lng]);
        });

        if (data.length > 0) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    updateVisibility(filteredData) {
        this.markers.forEach(({ marker, data }) => {
            const isVisible = filteredData.includes(data);
            if (isVisible) {
                marker.addTo(this.map);
            } else {
                this.map.removeLayer(marker);
            }
        });
    }

    invalidateSize() {
        if (this.map) this.map.invalidateSize();
    }
}

export class ListController {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(data) {
        this.container.innerHTML = '';

        if (data.length === 0) {
            this.container.innerHTML = '<div style="text-align:center; padding:2rem; color:#666;">No results found.</div>';
            return;
        }

        data.forEach(item => {
            const card = createCard(item);
            this.container.appendChild(card);
        });
    }
}

export class SettingsController {
    constructor(containerId, mapController) {
        this.container = document.getElementById(containerId);
        this.mapController = mapController;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="settings-container" style="max-width: 600px; margin: 0 auto; padding: 1.5rem;">
                <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--color-text-primary);">Settings</h2>
                
                <!-- Map Provider Section -->
                <div class="card" style="margin-bottom: 1.5rem; background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: var(--color-text-primary);">Map Appearance</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <label style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                            <input type="radio" name="map-provider" value="osm" checked style="accent-color: black; width: 1.25rem; height: 1.25rem;">
                            <div>
                                <div style="font-weight: 500; color: var(--color-text-primary);">Standard</div>
                                <div style="font-size: 0.875rem; color: var(--color-text-secondary);">OpenStreetMap detailed view</div>
                            </div>
                        </label>
                        <label style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                            <input type="radio" name="map-provider" value="carto" style="accent-color: black; width: 1.25rem; height: 1.25rem;">
                            <div>
                                <div style="font-weight: 500; color: var(--color-text-primary);">Minimal</div>
                                <div style="font-size: 0.875rem; color: var(--color-text-secondary);">Clean, light background</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- About Section -->
                <div class="card" style="background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: var(--color-text-primary);">About Helpkart</h3>
                    
                    <p style="color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 1.5rem;">
                        <strong>Helpkart</strong> is a community-driven flood relief coordination tool developed by <strong>Smile Labs</strong>. We aim to bridge the gap between those in need and those who can help by visualizing real-time data.
                    </p>
                    
                    <div style="background: #F9FAFB; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; border-left: 4px solid #000;">
                        <h4 style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.25rem; color: var(--color-text-primary);">Disclaimer</h4>
                        <p style="font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.5;">
                            This platform facilitates connections only. We do not directly handle, store, or distribute rations.
                        </p>
                    </div>
                    
                    <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--color-text-primary);">Contact Us</h4>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem; color: var(--color-text-secondary);">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>📧</span> <a href="mailto:contact@smilelabs.org" style="color: inherit; text-decoration: underline;">contact@smilelabs.org</a>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>📞</span> <span>+94 77 123 4567</span>
                        </div>

                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 2rem; color: #9CA3AF; font-size: 0.75rem;">
                    v0.1 • Made with ❤️ in Sri Lanka
                </div>

                <div style="text-align: center; margin-top: 1rem; color: #9CA3AF; font-size: 0.75rem;">
                    Kudos to OpenStreetMap for the maps!
                </div>
        `;

        // Add Event Listeners for Map Switching
        const radios = this.container.querySelectorAll('input[name="map-provider"]');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.mapController.setProvider(e.target.value);

                // Optional: Add visual feedback for selection
                radios.forEach(r => {
                    r.closest('label').style.borderColor = r.checked ? '#000' : '#e5e7eb';
                    r.closest('label').style.backgroundColor = r.checked ? '#F9FAFB' : 'transparent';
                });
            });

            // Initialize styles
            if (radio.checked) {
                radio.closest('label').style.borderColor = '#000';
                radio.closest('label').style.backgroundColor = '#F9FAFB';
            }
        });
    }
}