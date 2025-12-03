import { fetchData, parseTupleData, fetchMetadata } from './utils.js';
import { MapController, ListController, SettingsController } from './components/organisms.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let allData = [];
    let isListView = false;

    // --- Controllers ---
    const mapController = new MapController('map');
    const listController = new ListController('list-container');
    const settingsController = new SettingsController('settings-view', mapController);

    // --- DOM Elements ---
    const statusBanner = document.getElementById('status-banner');
    const searchInput = document.getElementById('search-input');
    const viewToggleBtn = document.getElementById('view-toggle');
    const iconList = document.getElementById('icon-list');
    const iconMap = document.getElementById('icon-map');
    const mapView = document.getElementById('map');
    const listView = document.getElementById('list-view');
    const contributionContainer = document.getElementById('contribution-container');
    const settingsToggleBtn = document.getElementById('settings-toggle');
    const settingsView = document.getElementById('settings-view');

    // Filter Elements
    const filterToggleBtn = document.getElementById('filter-toggle');
    const filterPopup = document.getElementById('filter-popup');
    const closeFilterBtn = document.getElementById('close-filter');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');

    // --- Initialization ---
    init();

    async function init() {
        updateStatusBanner();
        mapController.init();

        try {
            // Fetch both data and metadata in parallel
            const [rawData, metadata] = await Promise.all([
                fetchData(),
                fetchMetadata().catch(() => ({ lastUpdated: null })) // Graceful fallback
            ]);

            allData = parseTupleData(rawData);
            updateStatusBanner(metadata.lastUpdated); // Pass timestamp
            mapController.renderMarkers(allData);
            listController.render(allData);
        } catch (error) {
            console.error("Failed to load data:", error);
            statusBanner.textContent = "Error loading data.";
            statusBanner.style.color = "red";
        }

        // Event Listeners
        searchInput.addEventListener('input', runFilters); // Changed to runFilters
        viewToggleBtn.addEventListener('click', toggleView);
        settingsToggleBtn.addEventListener('click', toggleSettings);

        // Filter Listeners
        filterToggleBtn.addEventListener('click', () => filterPopup.classList.toggle('hidden'));
        closeFilterBtn.addEventListener('click', () => filterPopup.classList.add('hidden'));
        applyFiltersBtn.addEventListener('click', () => {
            runFilters();
            filterPopup.classList.add('hidden');
        });
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    function updateStatusBanner(timestamp) {
        if (timestamp) {
            const updateTime = new Date(timestamp);
            statusBanner.textContent = `Last Database Refresh: ${updateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            // Fallback if metadata is unavailable
            statusBanner.textContent = `Last Database Refresh: Unknown`;
        }
    }

    function clearFilters() {
        // Reset inputs
        document.getElementById('filter-date').value = '';
        document.getElementById('filter-keywords').value = '';
        document.getElementById('filter-location').value = '';
        document.querySelectorAll('.filter-urgency').forEach(cb => cb.checked = false);
        document.querySelectorAll('.filter-type').forEach(cb => cb.checked = false);
        document.getElementById('filter-has-needs').checked = false;
        document.getElementById('filter-has-surplus').checked = false;

        runFilters();
    }

    // --- Core Logic ---
    function runFilters() {
        const searchQuery = searchInput.value.toLowerCase();

        // Get Filter Values
        const dateVal = document.getElementById('filter-date').value;
        const filterDate = dateVal ? new Date(dateVal) : null;

        const keywords = document.getElementById('filter-keywords').value
            .toLowerCase().split(',').map(k => k.trim()).filter(k => k);

        const locationQuery = document.getElementById('filter-location').value.toLowerCase();

        const urgencyChecked = Array.from(document.querySelectorAll('.filter-urgency:checked')).map(cb => cb.value);
        const typeChecked = Array.from(document.querySelectorAll('.filter-type:checked')).map(cb => cb.value.toLowerCase());

        const hasNeeds = document.getElementById('filter-has-needs').checked;
        const hasSurplus = document.getElementById('filter-has-surplus').checked;

        // Filter Data
        const filteredData = allData.filter(item => {
            // 1. Search Bar (Global Search)
            const matchesSearch = !searchQuery || Object.values(item).some(val => {
                if (typeof val === 'string' || typeof val === 'number') {
                    return String(val).toLowerCase().includes(searchQuery);
                }
                if (Array.isArray(val)) {
                    return val.some(subItem =>
                        subItem.item.toLowerCase().includes(searchQuery) ||
                        subItem.amount.toLowerCase().includes(searchQuery)
                    );
                }
                return false;
            });
            if (!matchesSearch) return false;

            // 2. Date Filter
            if (filterDate) {
                const itemDate = new Date(item.updated_at);
                if (itemDate < filterDate) return false;
            }

            // 3. Location / District Filter
            if (locationQuery && !item['Location Name'].toLowerCase().includes(locationQuery)) {
                return false;
            }

            // 4. Urgency Filter
            if (urgencyChecked.length > 0 && !urgencyChecked.includes(item.status)) {
                return false;
            }

            // 5. Type Filter (Heuristic based on Location Name)
            if (typeChecked.length > 0) {
                const name = item['Location Name'].toLowerCase();
                const matchesType = typeChecked.some(type => {
                    if (type === 'other') return true; // Catch-all if selected
                    return name.includes(type);
                });
                if (!matchesType) return false;
            }

            // 6. Needs / Surplus Boolean
            if (hasNeeds && (!item.needed || item.needed.length === 0)) return false;
            if (hasSurplus && (!item.surplus || item.surplus.length === 0)) return false;

            // 7. Specific Keywords (Checks items in needed/surplus)
            if (keywords.length > 0) {
                // Fix: Default to empty arrays to prevent crash
                const neededItems = item.needed || [];
                const surplusItems = item.surplus || [];
                const locationName = item['Location Name'] || '';

                const allItemText = [
                    ...neededItems.map(i => i.item.toLowerCase()),
                    ...surplusItems.map(i => i.item.toLowerCase()),
                    locationName.toLowerCase()
                ].join(' ');

                // Must match AT LEAST ONE keyword
                const matchesKeyword = keywords.some(k => allItemText.includes(k));
                if (!matchesKeyword) return false;
            }

            return true;
        });

        // Update Views
        mapController.updateVisibility(filteredData);
        listController.render(filteredData);
    }

    function toggleSettings() {
        const isSettingsOpen = !settingsView.classList.contains('hidden');

        if (isSettingsOpen) {
            settingsView.classList.add('hidden');
            if (isListView) {
                listView.classList.remove('hidden');
                iconList.classList.add('hidden');
                iconMap.classList.remove('hidden');
            } else {
                mapView.classList.remove('hidden');
                iconMap.classList.add('hidden');
                iconList.classList.remove('hidden');
                contributionContainer.classList.remove('hidden');
                mapController.invalidateSize();
            }
        } else {
            settingsView.classList.remove('hidden');
            mapView.classList.add('hidden');
            listView.classList.add('hidden');
            contributionContainer.classList.add('hidden');
            // Ensure filter popup is closed if settings is opened
            filterPopup.classList.add('hidden');
        }
    }

    function toggleView() {
        isListView = !isListView;
        settingsView.classList.add('hidden');
        filterPopup.classList.add('hidden'); // Close filter on view switch

        if (isListView) {
            mapView.classList.add('hidden');
            listView.classList.remove('hidden');
            iconList.classList.add('hidden');
            iconMap.classList.remove('hidden');
            contributionContainer.classList.add('hidden');
        } else {
            listView.classList.add('hidden');
            mapView.classList.remove('hidden');
            iconMap.classList.add('hidden');
            iconList.classList.remove('hidden');
            mapController.invalidateSize();
            contributionContainer.classList.remove('hidden');
        }
    }
});