import { fetchData, parseTupleData } from './utils.js';
import { MapController, ListController } from './components/organisms.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let allData = [];
    let isListView = false;

    // --- Controllers ---
    const mapController = new MapController('map');
    const listController = new ListController('list-container');

    // --- DOM Elements ---
    const statusBanner = document.getElementById('status-banner');
    const searchInput = document.getElementById('search-input');
    const viewToggleBtn = document.getElementById('view-toggle');
    const iconList = document.getElementById('icon-list');
    const iconMap = document.getElementById('icon-map');
    const mapView = document.getElementById('map');
    const listView = document.getElementById('list-view');

    // --- Initialization ---
    init();

    async function init() {
        updateStatusBanner();
        mapController.init();

        try {
            const rawData = await fetchData();
            allData = parseTupleData(rawData);
            mapController.renderMarkers(allData);
            listController.render(allData);
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

        // Update Views
        mapController.updateVisibility(filteredData);
        listController.render(filteredData);
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
            mapController.invalidateSize();
        }
    }
});
