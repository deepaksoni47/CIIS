# Heatmap API - Quick Start Guide

## 🚀 Quick Start

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

Server runs at: `http://localhost:3001`

### 2. Test Heatmap API

```bash
npm run test:heatmap
```

### 3. Make Your First Request

```bash
# Get basic heatmap
curl -X GET "http://localhost:3001/api/heatmap/geojson?organizationId=YOUR_ORG_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Algorithm Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HEATMAP GENERATION                          │
└─────────────────────────────────────────────────────────────────────┘

Step 1: DATA COLLECTION
┌──────────────────────────────────┐
│  Fetch Issues from Firestore    │
│  - Filter by organization        │
│  - Apply date range filters      │
│  - Filter by category/priority   │
│  - Filter by status              │
└────────────┬─────────────────────┘
             │
             ▼
Step 2: LOCATION AGGREGATION (Grid-based clustering)
┌──────────────────────────────────┐
│  Group Nearby Issues             │
│  - gridSize: 50m (default)       │
│  - Calculate centroid            │
│  - Merge issues within radius    │
└────────────┬─────────────────────┘
             │
             ▼
Step 3: TIME DECAY WEIGHTING
┌──────────────────────────────────┐
│  Apply Exponential Decay         │
│  Formula:                        │
│    weight = e^(-λ × t)           │
│                                  │
│  Where:                          │
│    λ = decayFactor (0-1)         │
│    t = normalizedAge (0-1)       │
│                                  │
│  Example:                        │
│    1 day old  → 99.4% weight     │
│    30 days old → 86.1% weight    │
│    60 days old → 74.1% weight    │
└────────────┬─────────────────────┘
             │
             ▼
Step 4: SEVERITY WEIGHTING
┌──────────────────────────────────┐
│  Apply Priority Multipliers      │
│  Formula:                        │
│    weight = weight × (1 + s × m) │
│                                  │
│  Priority Multipliers:           │
│    CRITICAL → 4.0x               │
│    HIGH     → 2.5x               │
│    MEDIUM   → 1.5x               │
│    LOW      → 1.0x               │
│                                  │
│  Example:                        │
│    Base: 0.8                     │
│    Critical (severity 9):        │
│      0.8 × (1 + 3.6 × 2.0)       │
│      = 0.8 × 8.2 = 6.56          │
└────────────┬─────────────────────┘
             │
             ▼
Step 5: NORMALIZATION
┌──────────────────────────────────┐
│  Normalize to 0-1 Range          │
│  Formula:                        │
│    norm = (w - min) / (max-min)  │
│                                  │
│  Ensures consistent              │
│  visualization intensity         │
└────────────┬─────────────────────┘
             │
             ▼
Step 6: OPTIONAL CLUSTERING (DBSCAN)
┌──────────────────────────────────┐
│  Reduce Point Density            │
│  - clusterRadius: 100m           │
│  - minClusterSize: 2             │
│  - Groups nearby points          │
│  - Preserves hotspot info        │
└────────────┬─────────────────────┘
             │
             ▼
Step 7: GEOJSON FORMATTING
┌──────────────────────────────────┐
│  Convert to GeoJSON              │
│  FeatureCollection               │
│                                  │
│  Each feature:                   │
│    - geometry: Point             │
│    - coordinates: [lng, lat]     │
│    - properties:                 │
│        • weight (0-1)            │
│        • intensity               │
│        • issueCount              │
│        • avgSeverity             │
│        • priority counts         │
│        • categories              │
└────────────┬─────────────────────┘
             │
             ▼
        OUTPUT
┌──────────────────────────────────┐
│  GeoJSON FeatureCollection       │
│  Ready for:                      │
│    • Leaflet.heat               │
│    • Mapbox GL JS               │
│    • Google Maps                │
│    • Custom visualizations      │
└──────────────────────────────────┘
```

---

## 🎯 Configuration Examples

### 1. Real-time Crisis Monitoring

**Emphasize recent critical issues**

```javascript
{
  timeDecayFactor: 0.9,          // Fast decay - only recent issues matter
  severityWeightMultiplier: 5.0, // Strong severity emphasis
  normalizeWeights: true
}
```

### 2. Historical Analysis

**Equal weight for all time periods**

```javascript
{
  timeDecayFactor: 0.1,          // Slow decay - retain historical data
  severityWeightMultiplier: 1.0, // Linear severity influence
  normalizeWeights: true
}
```

### 3. Performance Optimized

**Fast response for dashboards**

```javascript
{
  gridSize: 200,                 // Larger grid = fewer points
  timeDecayFactor: 0.5,
  severityWeightMultiplier: 2.0,
  normalizeWeights: true
}
```

### 4. Detailed Campus View

**Maximum detail with clustering**

```javascript
{
  gridSize: 25,                  // Small grid = more detail
  clusterRadius: 50,             // Cluster very close issues
  minClusterSize: 2,
  timeDecayFactor: 0.5,
  severityWeightMultiplier: 2.0,
  normalizeWeights: true
}
```

---

## 📈 Weight Calculation Examples

### Example 1: Fresh Critical Issue

```
Issue: Fire Exit Blocked
- Age: 2 hours
- Severity: 10
- Priority: CRITICAL
- Category: Safety

Calculation:
1. Base weight: 1.0
2. Time decay: e^(-0.5 × 0.001) = 0.9995 (~100%)
3. Severity score: (10/10) × 4.0 = 4.0
4. Final weight: 0.9995 × (1 + 4.0 × 2.0) = 8.995
5. Normalized: 1.0 (maximum intensity)

Result: Bright red hotspot on map
```

### Example 2: Old Low Priority Issue

```
Issue: Furniture Scratch
- Age: 60 days
- Severity: 3
- Priority: LOW
- Category: Furniture

Calculation:
1. Base weight: 1.0
2. Time decay: e^(-0.5 × 0.667) = 0.716 (~72%)
3. Severity score: (3/10) × 1.0 = 0.3
4. Final weight: 0.716 × (1 + 0.3 × 2.0) = 1.146
5. Normalized: 0.15 (low intensity)

Result: Faint blue marker on map
```

### Example 3: Recent High Priority Issue

```
Issue: Power Outage
- Age: 5 hours
- Severity: 9
- Priority: HIGH
- Category: Electrical

Calculation:
1. Base weight: 1.0
2. Time decay: e^(-0.5 × 0.002) = 0.999 (~100%)
3. Severity score: (9/10) × 2.5 = 2.25
4. Final weight: 0.999 × (1 + 2.25 × 2.0) = 5.494
5. Normalized: 0.75 (high intensity)

Result: Orange/red hotspot on map
```

---

## 🗺️ Map Library Integration

### Leaflet.heat (Recommended for simplicity)

```javascript
const heatData = geojson.features.map((f) => [
  f.geometry.coordinates[1], // lat
  f.geometry.coordinates[0], // lng
  f.properties.weight, // intensity
]);

L.heatLayer(heatData, {
  radius: 25,
  blur: 15,
  maxZoom: 17,
  max: 1.0,
  gradient: {
    0.0: "blue",
    0.3: "lime",
    0.5: "yellow",
    0.7: "orange",
    1.0: "red",
  },
}).addTo(map);
```

### Mapbox GL JS (Recommended for large datasets)

```javascript
map.addSource("issues", {
  type: "geojson",
  data: geojson,
});

map.addLayer({
  id: "heatmap",
  type: "heatmap",
  source: "issues",
  paint: {
    "heatmap-weight": ["get", "weight"],
    "heatmap-intensity": 1,
    "heatmap-radius": 30,
  },
});
```

---

## 🔥 Common Use Cases

### 1. Dashboard - Live Hotspots

```javascript
// Refresh every 5 minutes
async function updateHeatmap() {
  const response = await fetch(
    "/api/heatmap/geojson?organizationId=org123&maxAge=7&timeDecayFactor=0.8",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const geojson = await response.json();
  heatLayer.setLatLngs(convertToLeafletFormat(geojson));
}

setInterval(updateHeatmap, 300000);
```

### 2. Maintenance Planning - Resource Allocation

```javascript
// Get statistics to prioritize teams
const stats = await fetch(
  "/api/heatmap/stats?organizationId=org123&priorities=CRITICAL&priorities=HIGH"
);

// Allocate teams to top categories
const topCategories = Object.entries(stats.categoryBreakdown)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3);

console.log("Deploy teams to:", topCategories);
```

### 3. Historical Analysis - Trend Detection

```javascript
// Compare quarters
const q4 = await fetch(
  "/api/heatmap/data?startDate=2024-10-01&endDate=2024-12-31"
);
const q1 = await fetch(
  "/api/heatmap/data?startDate=2025-01-01&endDate=2025-03-31"
);

// Identify problem areas that got worse
const worsening = identifyWorseningHotspots(q4, q1);
```

### 4. Mobile App - Performance Optimized

```javascript
// Use grid aggregation for fast loading
const heatmap = await fetch(
  "/api/heatmap/grid?organizationId=org123&gridSize=200"
);

// Fewer points = faster rendering on mobile
```

---

## 📊 Performance Tips

### For Large Campuses (>1000 issues)

```javascript
// Use clustering
GET /api/heatmap/clusters?organizationId=org123&clusterRadius=150&minClusterSize=3

// Or grid aggregation
GET /api/heatmap/grid?organizationId=org123&gridSize=200
```

### For Real-time Dashboards

```javascript
// Cache on client side
const cachedHeatmap = localStorage.getItem("heatmap");
const cacheAge = Date.now() - localStorage.getItem("heatmapTimestamp");

if (cacheAge < 300000) {
  // 5 minutes
  return JSON.parse(cachedHeatmap);
} else {
  const fresh = await fetchHeatmap();
  localStorage.setItem("heatmap", JSON.stringify(fresh));
  localStorage.setItem("heatmapTimestamp", Date.now());
  return fresh;
}
```

### For Mobile Apps

```javascript
// Fetch lightweight data
GET /api/heatmap/grid?organizationId=org123&gridSize=300

// Reduce precision for faster rendering
const simplified = geojson.features.map(f => ({
  ...f,
  geometry: {
    ...f.geometry,
    coordinates: [
      parseFloat(f.geometry.coordinates[0].toFixed(4)),
      parseFloat(f.geometry.coordinates[1].toFixed(4))
    ]
  }
}));
```

---

## 🎨 Color Gradient Recommendations

### Priority-based

```javascript
{
  0.0: '#2E86DE',  // Blue (LOW)
  0.3: '#10AC84',  // Green (LOW-MEDIUM)
  0.5: '#F1C40F',  // Yellow (MEDIUM)
  0.7: '#E67E22',  // Orange (HIGH)
  0.9: '#E74C3C',  // Red (CRITICAL)
  1.0: '#C0392B'   // Dark Red (MAX)
}
```

### Heat-based (Classic)

```javascript
{
  0.0: 'rgba(0, 0, 255, 0)',     // Transparent blue
  0.2: 'rgba(0, 255, 255, 0.5)', // Cyan
  0.4: 'rgba(0, 255, 0, 0.7)',   // Green
  0.6: 'rgba(255, 255, 0, 0.8)', // Yellow
  0.8: 'rgba(255, 128, 0, 0.9)', // Orange
  1.0: 'rgba(255, 0, 0, 1)'      // Red
}
```

---

## 🧪 Testing

Run the test suite:

```bash
npm run test:heatmap
```

Expected output:

```
🗺️  Testing Heatmap API
============================================================

📍 Test 1: Get Basic Heatmap Data
------------------------------------------------------------
✅ Total features: 23
✅ Total issues: 87
✅ Time decay factor: 0.5

📍 Test 2: Get High Priority Heatmap
------------------------------------------------------------
✅ Total features: 8
✅ Total issues: 15
✅ Sample point weight: 0.947

... (more tests)

✅ All heatmap API tests completed!
```

---

## 📚 Further Reading

- **Full API Documentation:** See `HEATMAP_API.md`
- **Implementation Details:** See `HEATMAP_SUMMARY.md`
- **Algorithm Explanation:** `GET /api/heatmap/explain`

---

**Ready to visualize campus infrastructure issues! 🎉**
