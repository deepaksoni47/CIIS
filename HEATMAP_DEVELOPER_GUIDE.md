# Campus Heatmap - Developer Quick Start Guide

## 🚀 Quick Start

### Access the Enhanced Heatmap

```
URL: http://localhost:3000/heatmap-enhanced
```

---

## 📂 New Components

### 1. EnhancedHeatmapSidebar

**File:** `frontend/src/components/heatmap/EnhancedHeatmapSidebar.tsx`

**Props:**

```typescript
{
  layers: { water: boolean; power: boolean; wifi: boolean };
  config: HeatmapConfig;
  filters: HeatmapFilters;
  onLayerToggle: (layer: "water" | "power" | "wifi") => void;
  onConfigChange: (config: Partial<HeatmapConfig>) => void;
  onFiltersChange: (filters: Partial<HeatmapFilters>) => void;
  onPresetSelect: (preset: PresetMode) => void;
  onClose: () => void;
}
```

**Usage:**

```tsx
<EnhancedHeatmapSidebar
  layers={layers}
  config={config}
  filters={filters}
  onLayerToggle={handleLayerToggle}
  onConfigChange={handleConfigChange}
  onFiltersChange={handleFiltersChange}
  onPresetSelect={handlePresetSelect}
  onClose={() => {}}
/>
```

### 2. HeatmapStats

**File:** `frontend/src/components/heatmap/HeatmapStats.tsx`

**Props:**

```typescript
{
  statsData?: HeatmapStatsData;
  isLoading?: boolean;
  onRefresh?: () => void;
}
```

**Usage:**

```tsx
<HeatmapStats
  statsData={statsData}
  isLoading={isLoadingStats}
  onRefresh={fetchStats}
/>
```

---

## 🎯 Preset Configurations

### Emergency Response

```typescript
{
  config: {
    timeDecayFactor: 1.0,
    severityWeightMultiplier: 3.0,
    gridSize: 25,
    normalizeWeights: true
  },
  filters: {
    priorities: ["CRITICAL", "HIGH"],
    statuses: ["OPEN", "IN_PROGRESS"],
    timeRange: "7d",
    minSeverity: 7
  }
}
```

### Maintenance Planning

```typescript
{
  config: {
    timeDecayFactor: 0.3,
    severityWeightMultiplier: 1.5,
    gridSize: 50,
    clusterRadius: 100,
    minClusterSize: 3,
    normalizeWeights: true
  },
  filters: {
    timeRange: "30d",
    statuses: ["OPEN", "RESOLVED"],
    minSeverity: 1
  }
}
```

### Campus Overview

```typescript
{
  config: {
    timeDecayFactor: 0.5,
    severityWeightMultiplier: 2.0,
    gridSize: 100,
    clusterRadius: 200,
    minClusterSize: 5,
    normalizeWeights: true
  },
  filters: {
    timeRange: "30d",
    minSeverity: 1
  }
}
```

### Building Analysis

```typescript
{
  config: {
    timeDecayFactor: 0.5,
    severityWeightMultiplier: 2.0,
    gridSize: 25,
    normalizeWeights: true
  },
  filters: {
    timeRange: "7d",
    minSeverity: 1
  }
}
```

---

## 🔌 API Integration

### Fetch Heatmap Data

```typescript
const params = new URLSearchParams({
  organizationId: "ORG123",
  timeDecayFactor: "0.5",
  severityWeightMultiplier: "2.0",
  gridSize: "50",
  normalizeWeights: "true",
  categories: "Water,Power,Wi-Fi",
  priorities: "CRITICAL,HIGH",
  statuses: "OPEN,IN_PROGRESS",
  minSeverity: "5",
  maxAge: "7",
});

const response = await fetch(`${API_BASE_URL}/api/heatmap/data?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const result = await response.json();
if (result.success && result.data.type === "FeatureCollection") {
  const points = result.data.features.map((feature) => ({
    lat: feature.geometry.coordinates[1],
    lng: feature.geometry.coordinates[0],
    intensity: feature.properties.weight,
    issueCount: feature.properties.issueCount,
    avgSeverity: feature.properties.avgSeverity,
    categories: feature.properties.categories,
  }));
}
```

### Fetch Statistics

```typescript
const response = await fetch(`${API_BASE_URL}/api/heatmap/stats?${params}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const result = await response.json();
if (result.success && result.data) {
  setStatsData(result.data);
}
```

---

## 🛠️ Configuration Parameters

### Time Decay Factor (0-2)

- **0.0:** No decay - all ages equal
- **0.3:** Slow decay - 60-day relevance
- **0.5:** Moderate decay - 30-day relevance (default)
- **1.0:** Fast decay - 2-week focus
- **2.0:** Very fast decay - last week only

### Severity Weight Multiplier (0.5-5.0x)

- **0.5:** Subtle emphasis
- **1.0:** Moderate emphasis
- **2.0:** Strong emphasis (default)
- **3.0:** Heavy emphasis
- **5.0:** Very heavy emphasis

### Grid Size (meters)

- **25m:** High detail, building-level analysis
- **50m:** Balanced (default), zone-level analysis
- **100m:** Campus overview
- **200m:** Regional view

### Cluster Radius (optional, meters)

- **50-100m:** Tight clustering
- **100-200m:** Standard clustering
- **200-500m:** Loose clustering
- **undefined:** No clustering (default)

### Min Cluster Size (2-10)

- **2:** Form clusters with 2+ issues (default)
- **3-5:** Standard clustering
- **5-10:** Only large problem areas

---

## 📊 Filter Options

### Priority Levels

```typescript
["CRITICAL", "HIGH", "MEDIUM", "LOW"];
```

### Issue Statuses

```typescript
["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
```

### Time Ranges

```typescript
{
  "24h": 1 day,
  "7d": 7 days,
  "30d": 30 days
}
```

### Min Severity (1-10)

- **1-3:** Low severity
- **4-6:** Medium severity
- **7-9:** High severity
- **10:** Critical severity

### Max Age (days)

- **1-7:** Recent issues
- **7-30:** Last month
- **30-90:** Last quarter
- **90+:** Historical data

---

## 🎨 Styling Guide

### Color Palette

```css
/* Backgrounds */
bg-black/90              /* Main panels */
bg-white/5               /* Inputs */
bg-white/10              /* Hover states */

/* Borders */
border-white/10          /* Panel borders */
border-white/20          /* Input borders */

/* Gradients */
from-violet-600 to-fuchsia-600    /* Primary actions */
from-red-600 to-rose-600          /* Emergency mode */
from-blue-600 to-cyan-600         /* Maintenance mode */
from-violet-600 to-purple-600     /* Overview mode */
from-green-600 to-emerald-600     /* Building mode */

/* Text */
text-white               /* Primary text */
text-white/80            /* Secondary text */
text-white/60            /* Tertiary text */
text-white/40            /* Placeholder text */
```

### Animation Classes

```css
/* Framer Motion variants */
initial= {
   {
    x: -450;
  }
} /* Sidebar slide-in */
animate= {
   {
    x: 0;
  }
}

initial= {
   {
    y: 400;
  }
} /* Stats slide-up */
animate= {
   {
    y: 0;
  }
}

whileHover= {
   {
    scale: 1.02;
  }
} /* Button hover */
whileTap= {
   {
    scale: 0.98;
  }
} /* Button press */
```

---

## 🧪 Testing

### Test Preset Modes

```bash
# Open browser console
1. Navigate to /heatmap-enhanced
2. Click each preset button
3. Verify config values in React DevTools
4. Check network tab for API calls
5. Verify query parameters match preset
```

### Test Configuration

```bash
1. Adjust Time Decay slider
2. Adjust Severity Weight slider
3. Click different Grid Size buttons
4. Enter Cluster Radius value
5. Toggle Normalize Weights checkbox
6. Verify API call parameters
```

### Test Filters

```bash
1. Toggle layer checkboxes (Water/Power/Wi-Fi)
2. Select/deselect priority levels
3. Select/deselect statuses
4. Change time range buttons
5. Adjust Min Severity slider
6. Enter Max Age value
7. Verify API call parameters
```

### Test Statistics

```bash
1. Click Statistics button
2. Verify panel opens
3. Check all stats display correctly
4. Click Refresh icon
5. Verify loading spinner
6. Verify stats update
7. Click close button
```

---

## 🐛 Debugging

### Check Authentication

```typescript
const token = localStorage.getItem("authToken");
console.log("Token:", token ? "Present" : "Missing");

const userData = JSON.parse(localStorage.getItem("userData") || "{}");
console.log("Organization ID:", userData.organizationId);
```

### Check API Calls

```typescript
// Add this before fetch calls
console.log("API URL:", `${API_BASE_URL}/api/heatmap/data?${params}`);
console.log("Headers:", { Authorization: `Bearer ${token}` });

// Add this after fetch
console.log("Response:", result);
```

### Check State Updates

```typescript
// Add React DevTools browser extension
// Inspect component state:
// - config: HeatmapConfig
// - filters: HeatmapFilters
// - layers: { water, power, wifi }
// - heatmapData: HeatmapPoint[]
// - statsData: HeatmapStatsData
```

### Common Issues

#### "No authentication token found"

```typescript
// Solution: Log in first at /login
// Or check if token expired
const token = localStorage.getItem("authToken");
if (!token) {
  router.push("/login");
}
```

#### "No organization ID found"

```typescript
// Solution: User data might be corrupted
localStorage.removeItem("userData");
// Re-login to refresh user data
```

#### "Invalid heatmap data format"

```typescript
// Solution: Check backend response
console.log("Raw response:", await response.text());
// Verify GeoJSON structure:
// {
//   type: "FeatureCollection",
//   features: [{ type: "Feature", geometry: {...}, properties: {...} }]
// }
```

#### Heatmap not displaying

```typescript
// Solution: Check if points array is populated
console.log("Heatmap points:", heatmapData.length);
console.log("First point:", heatmapData[0]);
// Verify lat/lng values are valid numbers
// Verify intensity is between 0 and 1
```

---

## 📦 Dependencies

### Existing

```json
{
  "react": "^18.2.0",
  "next": "^14.0.4",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "leaflet.heat": "^0.2.0",
  "framer-motion": "^10.x",
  "react-hot-toast": "^2.x"
}
```

### Types

```bash
npm install --save-dev @types/leaflet @types/leaflet.heat
```

---

## 📝 Code Examples

### Custom Preset

```typescript
// Add to PRESETS object in page.tsx
myCustomPreset: {
  config: {
    timeDecayFactor: 0.7,
    severityWeightMultiplier: 2.5,
    gridSize: 75,
    normalizeWeights: true
  },
  filters: {
    priorities: ["HIGH", "MEDIUM"],
    statuses: ["OPEN"],
    timeRange: "7d",
    minSeverity: 4
  }
}
```

### Add Custom Filter

```typescript
// In EnhancedHeatmapSidebar.tsx, add to filters tab:
<div>
  <h3 className="text-sm font-medium text-white/80 mb-2">Custom Filter</h3>
  <input
    type="text"
    value={filters.customValue || ""}
    onChange={(e) => onFiltersChange({ customValue: e.target.value })}
    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
  />
</div>
```

### Export Statistics

```typescript
const exportStats = () => {
  const csv = [
    "Metric,Value",
    `Total Issues,${statsData.totalIssues}`,
    `Total Points,${statsData.totalPoints}`,
    `Avg Weight,${statsData.avgWeight}`,
    // ... more rows
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "heatmap-stats.csv";
  a.click();
};
```

---

## 🔗 Related Documentation

- [HEATMAP_API.md](../backend/docs/HEATMAP_API.md) - Backend API reference
- [HEATMAP_AGGREGATION_GUIDE.md](../backend/docs/HEATMAP_AGGREGATION_GUIDE.md) - Aggregation logic
- [HEATMAP_INTEGRATION_ANALYSIS.md](./HEATMAP_INTEGRATION_ANALYSIS.md) - Gap analysis
- [HEATMAP_INTEGRATION_REPORT.md](./HEATMAP_INTEGRATION_REPORT.md) - Implementation details

---

## ✅ Checklist for New Features

- [ ] Add component to `frontend/src/components/heatmap/`
- [ ] Import in `page.tsx`
- [ ] Add props interface
- [ ] Implement state management
- [ ] Add to UI (sidebar tab or separate component)
- [ ] Test with React DevTools
- [ ] Verify API integration
- [ ] Check responsive design
- [ ] Add loading states
- [ ] Handle errors gracefully
- [ ] Update documentation
- [ ] Add TypeScript types
- [ ] Test in production build

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Maintainer:** GitHub Copilot
