import { getMarkerColor } from '../utils.js';
import { generatePopupContent, createCard } from './molecules.js';

export class MapController {
    constructor(mapId) {
        this.mapId = mapId;
        this.map = null;
        this.markers = [];
    }

    init() {
        // Default center (Kochi, Kerala roughly based on dummy data)
        this.map = L.map(this.mapId).setView([10.0, 76.3], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
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
