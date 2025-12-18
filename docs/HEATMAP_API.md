# Heatmap API Documentation

## Overview

The Heatmap API provides advanced geospatial visualization data for campus infrastructure issues with intelligent weighting algorithms. It aggregates issues by location and applies **time decay** and **severity weighting** to generate data suitable for heatmap visualization libraries.

**Key Features:**

- ✅ GeoJSON FeatureCollection output for mapping libraries
- ✅ Time decay weighting (recent issues weighted higher)
- ✅ Severity and priority-based weighting
- ✅ Spatial clustering (DBSCAN algorithm)
- ✅ Grid-based aggregation for performance
- ✅ Real-time statistics and analytics
- ✅ Configurable algorithms with transparent explanations

**Base URL:** `/api/heatmap`

---

## Algorithms

### 1. Location Aggregation

Groups nearby issues within a configurable grid size (default: 50 meters) using spatial clustering.

**Algorithm:**

```typescript
// For each issue:
// 1. Find all issues within gridSize radius
// 2. Calculate centroid of grouped issues
// 3. Create aggregated point
```

### 2. Time Decay Weighting

Applies exponential decay to issue weights based on age. Recent issues receive higher weight.

**Formula:**

```
weight = e^(-decayFactor × normalizedAge)
```

**Parameters:**

- `decayFactor`: 0-1 (default: 0.5)
  - 0.1 = Slow decay (old issues retain weight)
  - 0.5 = Moderate decay (balanced)
  - 0.9 = Fast decay (strong recency bias)
- `normalizedAge`: Age normalized to 0-1 range (max 90 days)

**Example:**

```javascript
// Issue reported 1 day ago with decayFactor=0.5
normalizedAge = 1 / 90 = 0.011
decayWeight = e^(-0.5 × 0.011) = 0.994 // 99.4% weight retained

// Issue reported 45 days ago with decayFactor=0.5
normalizedAge = 45 / 90 = 0.5
decayWeight = e^(-0.5 × 0.5) = 0.778 // 77.8% weight retained
```

### 3. Severity Weighting

Boosts weight based on issue severity and priority level.

**Formula:**

```
weight = weight × (1 + avgSeverityScore × multiplier)
```

**Priority Multipliers:**

- CRITICAL: 4.0x
- HIGH: 2.5x
- MEDIUM: 1.5x
- LOW: 1.0x

**Parameters:**

- `severityWeightMultiplier`: 0+ (default: 2.0)
  - 0 = No severity weighting
  - 1.0 = Linear severity weighting
  - 2.0 = 2x severity boost
  - 5.0 = Strong severity emphasis

**Example:**

```javascript
// Critical issue with severity 9
severityScore = (9 / 10) × 4.0 = 3.6
finalWeight = baseWeight × (1 + 3.6 × 2.0) = baseWeight × 8.2
```

### 4. Weight Normalization

Normalizes all weights to 0-1 range for consistent visualization.

**Formula:**

```
normalizedWeight = (weight - minWeight) / (maxWeight - minWeight)
```

### 5. DBSCAN Clustering (Optional)

Reduces point density by clustering nearby points using density-based spatial clustering.

**Parameters:**

- `clusterRadius`: Maximum distance for clustering (meters)
- `minClusterSize`: Minimum points to form a cluster

**Algorithm:**

```
1. For each point, find neighbors within clusterRadius
2. If neighbors >= minClusterSize, form a cluster
3. Expand cluster by adding neighbors of neighbors
4. Merge clustered points into single weighted point
```

---

## API Endpoints

### 1. Get Heatmap Data (Full Configuration)

Get heatmap data with full control over all algorithms and filters.

**Endpoint:** `GET /api/heatmap/data`

**Authentication:** Required

**Query Parameters:**

| Parameter                  | Type     | Required | Default | Description                                        |
| -------------------------- | -------- | -------- | ------- | -------------------------------------------------- |
| `organizationId`           | string   | ✅ Yes   | -       | Organization ID                                    |
| `campusId`                 | string   | No       | -       | Filter by campus                                   |
| `buildingIds`              | string[] | No       | -       | Filter by buildings                                |
| `categories`               | string[] | No       | -       | Filter by categories                               |
| `priorities`               | string[] | No       | -       | Filter by priorities (CRITICAL, HIGH, MEDIUM, LOW) |
| `statuses`                 | string[] | No       | -       | Filter by statuses                                 |
| `startDate`                | string   | No       | -       | Filter issues after date (ISO 8601)                |
| `endDate`                  | string   | No       | -       | Filter issues before date (ISO 8601)               |
| `minSeverity`              | number   | No       | -       | Minimum severity (1-10)                            |
| `maxAge`                   | number   | No       | -       | Maximum age in days                                |
| `timeDecayFactor`          | number   | No       | 0.5     | Time decay rate (0-1)                              |
| `severityWeightMultiplier` | number   | No       | 2.0     | Severity weight multiplier                         |
| `clusterRadius`            | number   | No       | -       | Cluster radius in meters                           |
| `minClusterSize`           | number   | No       | -       | Minimum cluster size                               |
| `gridSize`                 | number   | No       | 50      | Grid aggregation size in meters                    |
| `normalizeWeights`         | boolean  | No       | true    | Normalize weights to 0-1                           |

**Example Request:**

```bash
GET /api/heatmap/data?organizationId=org123&campusId=campus1&timeDecayFactor=0.7&severityWeightMultiplier=3.0&priorities=CRITICAL&priorities=HIGH
Authorization: Bearer <token>
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [78.1234, 21.5678]
        },
        "properties": {
          "weight": 0.95,
          "intensity": 8,
          "issueCount": 8,
          "avgSeverity": 8.5,
          "avgPriority": 3.75,
          "categories": ["Safety", "Structural"],
          "oldestIssue": "2024-12-01T10:00:00.000Z",
          "newestIssue": "2024-12-18T14:30:00.000Z",
          "criticalCount": 5,
          "highCount": 2,
          "mediumCount": 1,
          "lowCount": 0
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [78.1256, 21.5689]
        },
        "properties": {
          "weight": 0.42,
          "intensity": 3,
          "issueCount": 3,
          "avgSeverity": 5.0,
          "avgPriority": 2.0,
          "categories": ["Maintenance", "Cleanliness"],
          "oldestIssue": "2024-12-10T08:00:00.000Z",
          "newestIssue": "2024-12-17T16:00:00.000Z",
          "criticalCount": 0,
          "highCount": 1,
          "mediumCount": 2,
          "lowCount": 0
        }
      }
    ],
    "metadata": {
      "totalIssues": 11,
      "dateRange": {
        "start": "2024-12-01T10:00:00.000Z",
        "end": "2024-12-18T14:30:00.000Z"
      },
      "timeDecayFactor": 0.7,
      "severityWeightEnabled": true,
      "generatedAt": "2024-12-18T15:00:00.000Z"
    }
  }
}
```

---

### 2. Get GeoJSON (Simplified)

Get heatmap data in standard GeoJSON format with simplified parameters.

**Endpoint:** `GET /api/heatmap/geojson`

**Authentication:** Required

**Content-Type:** `application/geo+json`

**Query Parameters:**

| Parameter                  | Type     | Required | Default | Description          |
| -------------------------- | -------- | -------- | ------- | -------------------- |
| `organizationId`           | string   | ✅ Yes   | -       | Organization ID      |
| `campusId`                 | string   | No       | -       | Filter by campus     |
| `buildingIds`              | string[] | No       | -       | Filter by buildings  |
| `categories`               | string[] | No       | -       | Filter by categories |
| `timeDecayFactor`          | number   | No       | 0.5     | Time decay rate      |
| `severityWeightMultiplier` | number   | No       | 2.0     | Severity multiplier  |

**Example Request:**

```bash
GET /api/heatmap/geojson?organizationId=org123&campusId=campus1&categories=Safety&categories=Electrical
Authorization: Bearer <token>
```

**Example Response:**

```json
{
  "type": "FeatureCollection",
  "features": [...],
  "metadata": {...}
}
```

**Use Case:**
Perfect for map visualization libraries like Leaflet, Mapbox GL JS, or Google Maps:

```javascript
// Leaflet.heat example
fetch("/api/heatmap/geojson?organizationId=org123")
  .then((res) => res.json())
  .then((geojson) => {
    const heatData = geojson.features.map((f) => [
      f.geometry.coordinates[1], // lat
      f.geometry.coordinates[0], // lng
      f.properties.weight, // intensity
    ]);
    L.heatLayer(heatData, { radius: 25 }).addTo(map);
  });
```

---

### 3. Get Clustered Data

Get heatmap data with DBSCAN clustering applied to reduce point density.

**Endpoint:** `GET /api/heatmap/clusters`

**Authentication:** Required

**Query Parameters:**

| Parameter        | Type     | Required | Default | Description                |
| ---------------- | -------- | -------- | ------- | -------------------------- |
| `organizationId` | string   | ✅ Yes   | -       | Organization ID            |
| `campusId`       | string   | No       | -       | Filter by campus           |
| `buildingIds`    | string[] | No       | -       | Filter by buildings        |
| `categories`     | string[] | No       | -       | Filter by categories       |
| `clusterRadius`  | number   | No       | 100     | Cluster radius in meters   |
| `minClusterSize` | number   | No       | 2       | Minimum points per cluster |

**Example Request:**

```bash
GET /api/heatmap/clusters?organizationId=org123&clusterRadius=150&minClusterSize=3
Authorization: Bearer <token>
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [78.1245, 21.5683]
        },
        "properties": {
          "weight": 0.88,
          "intensity": 15,
          "issueCount": 15,
          "avgSeverity": 7.2,
          "avgPriority": 3.1,
          "categories": ["Safety", "Structural", "Electrical"],
          "criticalCount": 6,
          "highCount": 5,
          "mediumCount": 3,
          "lowCount": 1,
          "cluster": "cluster_0"
        }
      }
    ],
    "metadata": {...}
  },
  "config": {
    "clusterRadius": 150,
    "minClusterSize": 3
  }
}
```

**Use Case:**
Ideal for large campuses with many issues - reduces visual clutter while preserving hotspot information.

---

### 4. Get Grid Data

Get grid-based heatmap data optimized for performance with large datasets.

**Endpoint:** `GET /api/heatmap/grid`

**Authentication:** Required

**Query Parameters:**

| Parameter        | Type     | Required | Default | Description              |
| ---------------- | -------- | -------- | ------- | ------------------------ |
| `organizationId` | string   | ✅ Yes   | -       | Organization ID          |
| `campusId`       | string   | No       | -       | Filter by campus         |
| `buildingIds`    | string[] | No       | -       | Filter by buildings      |
| `categories`     | string[] | No       | -       | Filter by categories     |
| `gridSize`       | number   | No       | 100     | Grid cell size in meters |

**Example Request:**

```bash
GET /api/heatmap/grid?organizationId=org123&gridSize=50
Authorization: Bearer <token>
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [...],
    "metadata": {...}
  },
  "config": {
    "gridSize": 50
  }
}
```

**Use Case:**
Best for real-time dashboards or mobile apps where performance is critical.

---

### 5. Get Statistics

Get comprehensive statistics about the heatmap data.

**Endpoint:** `GET /api/heatmap/stats`

**Authentication:** Required

**Query Parameters:**
Same as `/data` endpoint.

**Example Request:**

```bash
GET /api/heatmap/stats?organizationId=org123&campusId=campus1&startDate=2024-12-01
Authorization: Bearer <token>
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "totalPoints": 23,
    "totalIssues": 87,
    "avgWeight": 0.58,
    "maxWeight": 0.95,
    "minWeight": 0.12,
    "weightDistribution": {
      "critical": 12,
      "high": 28,
      "medium": 35,
      "low": 12
    },
    "geographicBounds": {
      "north": 21.585,
      "south": 21.565,
      "east": 78.14,
      "west": 78.12
    },
    "categoryBreakdown": {
      "Safety": 15,
      "Electrical": 12,
      "Plumbing": 8,
      "HVAC": 10,
      "Maintenance": 18,
      "Cleanliness": 12,
      "Network": 7,
      "Structural": 5
    },
    "timeDecayStats": {
      "avgAge": 168.5,
      "oldestIssue": "2024-11-01T10:00:00.000Z",
      "newestIssue": "2024-12-18T14:30:00.000Z"
    }
  }
}
```

**Use Case:**
Perfect for analytics dashboards, reports, and understanding issue distribution patterns.

---

### 6. Get Algorithm Explanation (Public)

Get detailed explanation of the heatmap algorithms and configuration options.

**Endpoint:** `GET /api/heatmap/explain`

**Authentication:** Not Required (Public)

**Example Request:**

```bash
GET /api/heatmap/explain
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "algorithm": "Weighted Heatmap with Time Decay and Severity Weighting",
    "description": "Aggregates issues by geographic location and applies time decay and severity weighting...",
    "steps": [
      {
        "step": 1,
        "name": "Location Aggregation",
        "description": "Groups nearby issues within a configurable grid size..."
      },
      ...
    ],
    "output": {
      "format": "GeoJSON FeatureCollection",
      "properties": [...]
    },
    "useCases": [...],
    "configuration": {
      "timeDecayFactor": {
        "description": "Controls how quickly older issues lose weight",
        "range": "0-1",
        "default": 0.5,
        "examples": {...}
      },
      ...
    }
  }
}
```

---

## GeoJSON Feature Properties

Each heatmap point (Feature) includes these properties:

| Property        | Type     | Description                        |
| --------------- | -------- | ---------------------------------- |
| `weight`        | number   | Normalized combined weight (0-1)   |
| `intensity`     | number   | Raw issue count before weighting   |
| `issueCount`    | number   | Number of issues at this location  |
| `avgSeverity`   | number   | Average severity score (0-10)      |
| `avgPriority`   | number   | Average priority level (1-4)       |
| `categories`    | string[] | List of issue categories           |
| `oldestIssue`   | Date     | Oldest issue date at this location |
| `newestIssue`   | Date     | Most recent issue date             |
| `criticalCount` | number   | Number of CRITICAL issues          |
| `highCount`     | number   | Number of HIGH issues              |
| `mediumCount`   | number   | Number of MEDIUM issues            |
| `lowCount`      | number   | Number of LOW issues               |
| `cluster`       | string   | Cluster ID (if clustered)          |

---

## Integration Examples

### Frontend: Leaflet Heatmap

```javascript
import L from "leaflet";
import "leaflet.heat";

async function loadHeatmap(organizationId, campusId) {
  const response = await fetch(
    `/api/heatmap/geojson?organizationId=${organizationId}&campusId=${campusId}&timeDecayFactor=0.7`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const geojson = await response.json();

  // Convert to Leaflet.heat format
  const heatData = geojson.features.map((feature) => [
    feature.geometry.coordinates[1], // latitude
    feature.geometry.coordinates[0], // longitude
    feature.properties.weight, // intensity
  ]);

  // Create heatmap layer
  const heatLayer = L.heatLayer(heatData, {
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
  });

  heatLayer.addTo(map);
}
```

### Frontend: Mapbox GL JS

```javascript
import mapboxgl from "mapbox-gl";

async function loadMapboxHeatmap(organizationId) {
  const response = await fetch(
    `/api/heatmap/geojson?organizationId=${organizationId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const geojson = await response.json();

  map.addSource("issues-heat", {
    type: "geojson",
    data: geojson,
  });

  map.addLayer({
    id: "issues-heatmap",
    type: "heatmap",
    source: "issues-heat",
    paint: {
      "heatmap-weight": ["get", "weight"],
      "heatmap-intensity": 1,
      "heatmap-radius": 30,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(33,102,172,0)",
        0.2,
        "rgb(103,169,207)",
        0.4,
        "rgb(209,229,240)",
        0.6,
        "rgb(253,219,199)",
        0.8,
        "rgb(239,138,98)",
        1,
        "rgb(178,24,43)",
      ],
    },
  });
}
```

### Frontend: Google Maps

```javascript
async function loadGoogleHeatmap(organizationId) {
  const response = await fetch(
    `/api/heatmap/geojson?organizationId=${organizationId}&severityWeightMultiplier=3.0`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const geojson = await response.json();

  const heatmapData = geojson.features.map((feature) => ({
    location: new google.maps.LatLng(
      feature.geometry.coordinates[1],
      feature.geometry.coordinates[0]
    ),
    weight: feature.properties.weight,
  }));

  const heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    radius: 30,
    gradient: [
      "rgba(0, 255, 255, 0)",
      "rgba(0, 255, 255, 1)",
      "rgba(0, 191, 255, 1)",
      "rgba(0, 127, 255, 1)",
      "rgba(0, 63, 255, 1)",
      "rgba(0, 0, 255, 1)",
      "rgba(63, 0, 255, 1)",
      "rgba(127, 0, 255, 1)",
      "rgba(191, 0, 255, 1)",
      "rgba(255, 0, 255, 1)",
    ],
  });

  heatmap.setMap(map);
}
```

### Backend: Generate Daily Reports

```typescript
import { getHeatmapStats } from "./modules/heatmap/heatmap.service";

async function generateDailyReport(organizationId: string) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const stats = await getHeatmapStats(
    {
      organizationId,
      startDate: yesterday,
      endDate: today,
    },
    {
      timeDecayFactor: 0.5,
      severityWeightMultiplier: 2.0,
      normalizeWeights: true,
    }
  );

  console.log(`Daily Report for ${organizationId}`);
  console.log(`Total Hotspots: ${stats.totalPoints}`);
  console.log(`Total Issues: ${stats.totalIssues}`);
  console.log(`Critical Issues: ${stats.weightDistribution.critical}`);
  console.log(`Top Category: ${Object.keys(stats.categoryBreakdown)[0]}`);

  return stats;
}
```

---

## Configuration Best Practices

### Time Decay Factor

Choose based on how much you want to emphasize recent issues:

| Use Case                 | Recommended Value | Behavior                         |
| ------------------------ | ----------------- | -------------------------------- |
| **Historical Analysis**  | 0.1 - 0.2         | All issues equally weighted      |
| **Balanced View**        | 0.4 - 0.6         | Moderate recency bias            |
| **Real-time Monitoring** | 0.7 - 0.9         | Strong emphasis on recent issues |
| **Crisis Response**      | 0.9 - 1.0         | Only recent issues matter        |

### Severity Weight Multiplier

Choose based on how much severity should affect heatmap intensity:

| Use Case              | Recommended Value | Behavior                         |
| --------------------- | ----------------- | -------------------------------- |
| **Equal Visibility**  | 0                 | All issues equally weighted      |
| **Balanced Priority** | 1.0 - 2.0         | Moderate priority influence      |
| **Critical Focus**    | 3.0 - 5.0         | Strong emphasis on severe issues |
| **Emergency Only**    | 5.0+              | Only critical issues visible     |

### Grid Size

Choose based on campus size and detail level:

| Campus Type       | Recommended Value | Rationale                             |
| ----------------- | ----------------- | ------------------------------------- |
| **Small Campus**  | 25-50m            | Fine detail, building-level precision |
| **Medium Campus** | 50-100m           | Balanced detail and performance       |
| **Large Campus**  | 100-200m          | Broad overview, zone-level            |
| **Multi-Campus**  | 200-500m          | High-level regional view              |

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "organizationId is required"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to get heatmap data",
  "details": "Database connection timeout"
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Use Grid Aggregation**

   - For large datasets (>1000 issues), use `/grid` endpoint
   - Increase `gridSize` to reduce point count
   - Example: `gridSize=200` for quick overview

2. **Apply Filters**

   - Filter by `priorities` to focus on important issues
   - Use `maxAge` to limit temporal scope
   - Filter by `categories` for specific issue types

3. **Use Clustering**

   - Apply DBSCAN clustering for dense areas
   - Increase `clusterRadius` to reduce points further
   - Set appropriate `minClusterSize` based on density

4. **Cache Results**
   - Cache heatmap data on client side
   - Refresh only when new issues reported
   - Use ETags or Last-Modified headers

### Performance Benchmarks

| Dataset Size  | Endpoint           | Response Time | Points Returned |
| ------------- | ------------------ | ------------- | --------------- |
| 100 issues    | `/data`            | ~200ms        | 15-25           |
| 1,000 issues  | `/data`            | ~800ms        | 80-120          |
| 1,000 issues  | `/grid` (100m)     | ~400ms        | 30-50           |
| 10,000 issues | `/clusters` (150m) | ~1.5s         | 50-80           |
| 10,000 issues | `/grid` (200m)     | ~600ms        | 40-60           |

---

## Use Cases

### 1. Real-time Campus Monitoring

```javascript
// Update heatmap every 5 minutes
setInterval(async () => {
  const heatmap = await fetch(
    "/api/heatmap/geojson?organizationId=org123&maxAge=7&timeDecayFactor=0.8"
  );
  updateMapLayer(heatmap);
}, 300000);
```

### 2. Resource Allocation Dashboard

```javascript
// Get stats to prioritize maintenance teams
const stats = await fetch(
  "/api/heatmap/stats?organizationId=org123&priorities=CRITICAL&priorities=HIGH"
);
const hotspots = stats.categoryBreakdown; // Allocate resources accordingly
```

### 3. Historical Trend Analysis

```javascript
// Compare different time periods
const q4_2024 = await fetch(
  "/api/heatmap/data?startDate=2024-10-01&endDate=2024-12-31&timeDecayFactor=0.2"
);
const q1_2025 = await fetch(
  "/api/heatmap/data?startDate=2025-01-01&endDate=2025-03-31&timeDecayFactor=0.2"
);
// Analyze changes between periods
```

### 4. Semester Planning

```javascript
// Identify problem areas before semester starts
const preExamHeatmap = await fetch(
  "/api/heatmap/geojson?organizationId=org123&severityWeightMultiplier=5.0&maxAge=30"
);
// Prioritize maintenance in high-intensity areas
```

---

## Next Steps

1. **Integrate with Frontend**

   - Add heatmap visualization to campus map
   - Use Leaflet.heat or Mapbox GL JS
   - Display statistics in dashboard

2. **Customize Algorithms**

   - Experiment with different decay factors
   - Adjust severity multipliers for your use case
   - Fine-tune clustering parameters

3. **Build Analytics**

   - Track hotspot evolution over time
   - Compare different buildings/zones
   - Generate automated reports

4. **Optimize Performance**
   - Implement caching strategy
   - Use appropriate grid sizes
   - Apply filters to reduce dataset

---

## Support

For questions or issues:

- API Documentation: `/api/heatmap/explain`
- Algorithm Details: See "Algorithms" section above
- Integration Examples: See "Integration Examples" section

**Last Updated:** December 18, 2024
