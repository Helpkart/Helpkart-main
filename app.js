document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const DATA_URL = 'rations.json';
    const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours
    const SYSTEM_COLS = ['id', 'lat', 'lng', 'status', 'updated_at'];

    // --- State ---
    let map;
    let allData = []; // Array of objects
    let markers = []; // Array of { marker, data }
    let isListView = false;

    // --- DOM Elements ---
    const statusBanner = document.getElementById('status-banner');
    const searchInput = document.getElementById('search-input');
    const viewToggleBtn = document.getElementById('view-toggle');
    const iconList = document.getElementById('icon-list');
    const iconMap = document.getElementById('icon-map');
    const mapView = document.getElementById('map');
    const listView = document.getElementById('list-view');
    const listContainer = document.getElementById('list-container');

    // --- Initialization ---
    init();

    async function init() {
        updateStatusBanner();
        initMap();

        try {
            const rawData = await fetchData();
            allData = parseTupleData(rawData);
            renderMapMarkers(allData);
            renderListView(allData);
        } catch (error) {
            console.error("Failed to load data:", error);
            statusBanner.textContent = "Error loading data.";
            statusBanner.style.color = "red";
        }

        // Event Listeners
        searchInput.addEventListener('input', handleSearch);
        viewToggleBtn.addEventListener('click', toggleView);
    }

    function updateStatusBanner() {
        const now = new Date();
        statusBanner.textContent = `Last Check: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // --- Data Handling ---
    async function fetchData() {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    }

    function parseTupleData(tupleData) {
        if (!tupleData || tupleData.length < 2) return [];

        const headers = tupleData[0];
        const rows = tupleData.slice(1);

        return rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index];
            });

            // Calculate Ghost Mode status
            const updatedAt = new Date(obj.updated_at).getTime();
            const now = Date.now();
            const isStale = (now - updatedAt) > STALE_THRESHOLD_MS;

            obj._isStale = isStale;
            obj._displayStatus = isStale ? 'stale' : (obj.status || 'normal');

            return obj;
        });
    }

    // --- Map Logic ---
    function initMap() {
        // Default center (Kochi, Kerala roughly based on dummy data)
        // In a real app, we might use geolocation or bounding box of data
        map = L.map('map').setView([10.0, 76.3], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
    }

    function getMarkerColor(status) {
        switch (status) {
            case 'critical': return '#EF4444';
            case 'surplus': return '#10B981';
            case 'stale': return '#9CA3AF';
            default: return '#3B82F6'; // normal
        }
    }

    function renderMapMarkers(data) {
        // Clear existing markers
        markers.forEach(m => map.removeLayer(m.marker));
        markers = [];

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

            marker.addTo(map);
            markers.push({ marker, data: item });
            bounds.extend([lat, lng]);
        });

        if (data.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    // --- UI Generation ---
    function generatePopupContent(item) {
        // 1. Define columns to hide from the table (redundant or system cols)
        const HIDDEN_COLS = [...SYSTEM_COLS, 'Location Name', 'Phone'];

        // 2. Generate Table Rows
        const tableRows = Object.keys(item)
            .filter(key => !HIDDEN_COLS.includes(key) && !key.startsWith('_'))
            .map(key => {
                const value = item[key];
                let displayValue = value;

                // Handle Array Data (Surplus/Needed)
                if (Array.isArray(value)) {
                    if (value.length === 0) return ''; // Skip empty lists

                    const listItems = value.map(i =>
                        `<li class="flex justify-between">
                            <span class="item-name">${i.item}</span>
                            <span class="item-amount">${i.amount}</span>
                         </li>`
                    ).join('');

                    let colorClass = '';
                    if (key.toLowerCase() === 'needed') colorClass = 'list-critical';
                    if (key.toLowerCase() === 'surplus') colorClass = 'list-surplus';

                    displayValue = `<ul class="item-list ${colorClass}">${listItems}</ul>`;
                }

                return `<tr><th>${key}</th><td>${displayValue}</td></tr>`;
            })
            .join('');

        const phoneBtn = item.Phone
            ? `<a href="tel:${item.Phone}" class="btn btn-primary">Call</a>`
            : '';

        // 3. Return Cleaner HTML
        return `
            <div class="popup-content">
                <div class="popup-header">
                    <h3>${item['Location Name'] || 'Unknown Location'}</h3>
                    <div class="popup-meta">
                        Updated: ${new Date(item.updated_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                        ${item._isStale ? '<span class="tag-stale">STALE</span>' : ''}
                    </div>
                </div>
                
                <div class="popup-body">
                    <table class="data-table">
                        ${tableRows}
                    </table>
                </div>

                <div class="actions">
                    <a href="https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}" target="_blank" class="btn btn-secondary">Nav</a>
                    ${phoneBtn}
                    <button onclick="navigator.clipboard.writeText('${item.lat}, ${item.lng}')" class="btn btn-secondary">GPS</button>
                </div>
            </div>
        `;
    }

    function renderListView(data) {
        listContainer.innerHTML = '';

        if (data.length === 0) {
            listContainer.innerHTML = '<div style="text-align:center; padding:2rem; color:#666;">No results found.</div>';
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = `card status-${item._displayStatus}`;
            card.innerHTML = generatePopupContent(item); // Reuse popup HTML generator for consistency

            // Adjust card specific styles if needed (e.g. remove popup specific wrapper classes if any)
            listContainer.appendChild(card);
        });
    }

    // --- Interaction ---
    function handleSearch(e) {
        const query = e.target.value.toLowerCase();

        // Filter data
        const filteredData = allData.filter(item => {
            return Object.values(item).some(val => {
                // Handle Strings/Numbers
                if (typeof val === 'string' || typeof val === 'number') {
                    return String(val).toLowerCase().includes(query);
                }
                // Handle Arrays (Surplus/Needed)
                if (Array.isArray(val)) {
                    return val.some(subItem =>
                        subItem.item.toLowerCase().includes(query) ||
                        subItem.amount.toLowerCase().includes(query)
                    );
                }
                return false;
            });
        });

        // Update Map
        markers.forEach(({ marker, data }) => {
            const isVisible = filteredData.includes(data);
            if (isVisible) {
                marker.addTo(map);
            } else {
                map.removeLayer(marker);
            }
        });

        // Update List
        renderListView(filteredData);
    }

    function toggleView() {
        isListView = !isListView;

        if (isListView) {
            mapView.classList.add('hidden');
            listView.classList.remove('hidden');
            iconList.classList.add('hidden');
            iconMap.classList.remove('hidden');
        } else {
            listView.classList.add('hidden');
            mapView.classList.remove('hidden');
            iconMap.classList.add('hidden');
            iconList.classList.remove('hidden');
            map.invalidateSize(); // Fix leaflet rendering issues when hidden
        }
    }
});
