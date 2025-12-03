# Helpkart

Interactive map-based disaster relief coordination platform. Track supplies, visualize aid density, and coordinate resource distribution in real-time.

## Features

- **Interactive Map**: Leaflet-based map with custom markers for relief locations
- **Heatmap Visualization**: Density visualization for areas requiring aid
- **Resource Tracking**: Track surplus and needed supplies at each location
- **Filtering**: Filter by urgency, location type, inventory status, date, and keywords
- **Search**: Search across locations, supplies, and contact information
- **List/Map Views**: Toggle between map and list views for better data navigation
- **Mobile-First**: Optimized for mobile devices with bottom-positioned controls

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Helpkart
   ```

2. **Serve locally**
   ```bash
   python -m http.server 8000
   # or
   py -m http.server 8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## Data Format

### `rations.json`
Main data file containing relief locations with the following schema:

```json
[
  ["id", "lat", "lng", "status", "updated_at", "Location Name", "Phone", "surplus", "needed", "In Charge", "Address", "Availability", "Notes"],
  ["1", -77.8463, 166.6681, "normal", "2025-11-28T08:00:00+12:00", "Relief Center", "+1-555-0101", [...], [...], "Manager Name", "Street Address", "24 Hours", "Additional notes"]
]
```

**Status types**: `normal`, `critical`, `surplus`

### `heatmap.json`
Heatmap density data with coordinate and intensity values:

```json
[
  [lat, lng, intensity],
  [-77.8463, 166.6681, 0.8]
]
```

## Project Structure

```
Helpkart/
├── index.html          # Main entry point
├── rations.json        # Relief locations data
├── heatmap.json        # Heatmap density data
├── css/
│   └── main.css        # Styles (Atomic Design)
└── js/
    ├── app.js          # Main application logic
    └── components/
        ├── atoms.js    # Basic UI components
        ├── molecules.js # Composite components
        └── organisms.js # Complex UI modules
```

## Tech Stack

- **Vanilla JavaScript** (ES6 modules)
- **Leaflet.js** - Interactive maps
- **Leaflet.heat** - Heatmap visualization
- **CSS3** - Modern styling with custom properties
- **Inter font** - Clean typography

## License

See `LICENSE` file for details.