# Heatmap API Documentation

## Overview

The Heatmap API provides geographic visualization of infrastructure issues with sophisticated aggregation logic including **Density Calculation**, **Severity-Weighted Intensity**, and **Time-Based Decay**. This enables facilities managers to identify problem hotspots and prioritize maintenance efforts effectively.

## Authentication

All heatmap endpoints require authentication. Include a valid Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

---

## Endpoints

### 1. Get Heatmap Data

**GET** `/api/heatmap/data`

Get heatmap visualization data with customizable aggregation logic.

**Query Parameters:**

| Parameter                  | Type     | Required | Default | Description                                            |
| -------------------------- | -------- | -------- | ------- | ------------------------------------------------------ |
| `organizationId`           | string   | **Yes**  | -       | Your organization ID                                   |
| `campusId`                 | string   | No       | -       | Filter by campus                                       |
| `buildingIds`              | string[] | No       | -       | Filter by building IDs (comma-separated)               |
| `categories`               | string[] | No       | -       | Filter by issue categories                             |
| `priorities`               | string[] | No       | -       | Filter by priority (CRITICAL, HIGH, MEDIUM, LOW)       |
| `statuses`                 | string[] | No       | -       | Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED) |
| `startDate`                | string   | No       | -       | Start date (ISO 8601)                                  |
| `endDate`                  | string   | No       | -       | End date (ISO 8601)                                    |
| `minSeverity`              | number   | No       | -       | Minimum severity (1-10)                                |
| `maxAge`                   | number   | No       | -       | Maximum age in days                                    |
| `timeDecayFactor`          | number   | No       | 0.5     | Time decay rate (0-2+)                                 |
| `severityWeightMultiplier` | number   | No       | 2.0     | Severity weight multiplier                             |
| `clusterRadius`            | number   | No       | -       | Clustering radius in meters                            |
| `minClusterSize`           | number   | No       | -       | Minimum issues per cluster                             |
| `gridSize`                 | number   | No       | 50      | Grid cell size in meters                               |
| `normalizeWeights`         | boolean  | No       | true    | Normalize weights to 0-1                               |

**Example Request:**

```bash
curl "http://localhost:3001/api/heatmap/data?organizationId=ORG123&timeDecayFactor=1.0&severityWeightMultiplier=3.0&gridSize=25&maxAge=7&priorities=CRITICAL,HIGH" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

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
          "coordinates": [-74.006, 40.7128]
        },
        "properties": {
          "weight": 0.95,
          "intensity": 8,
          "issueCount": 8,
          "avgSeverity": 7.5,
          "avgPriority": 3.6,
          "categories": ["Plumbing", "Electrical"],
          "oldestIssue": "2025-12-10T08:00:00.000Z",
          "newestIssue": "2025-12-20T14:30:00.000Z",
          "criticalCount": 3,
          "highCount": 4,
          "mediumCount": 1,
          "lowCount": 0
        }
      }
    ],
    "metadata": {
      "totalIssues": 45,
      "dateRange": {
        "start": "2025-12-01T00:00:00.000Z",
        "end": "2025-12-21T23:59:59.999Z"
      },
      "timeDecayFactor": 1.0,
      "severityWeightEnabled": true,
      "clusterRadius": null,
      "generatedAt": "2025-12-21T10:30:00.000Z"
    }
  }
}
```

**Use Cases:**

- Emergency response mode (recent critical issues)
- Maintenance planning (identify problem zones)
- Campus overview dashboards
- Building-specific analysis

---

### 2. Get Heatmap Statistics

**GET** `/api/heatmap/stats`

Get statistical analysis of heatmap data including geographic bounds, weight distribution, and category breakdown.

**Query Parameters:**

Same as `/api/heatmap/data` (all parameters supported)

**Example Request:**

```bash
curl "http://localhost:3001/api/heatmap/stats?organizationId=ORG123&maxAge=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalPoints": 24,
    "totalIssues": 67,
    "avgWeight": 0.58,
    "maxWeight": 0.95,
    "minWeight": 0.12,
    "weightDistribution": {
      "critical": 12,
      "high": 28,
      "medium": 19,
      "low": 8
    },
    "geographicBounds": {
      "north": 40.72,
      "south": 40.705,
      "east": -74.0,
      "west": -74.012
    },
    "categoryBreakdown": {
      "Plumbing": 18,
      "Electrical": 15,
      "HVAC": 12,
      "Structural": 9,
      "Safety": 7,
      "Maintenance": 6
    },
    "timeDecayStats": {
      "avgAge": 168.5,
      "oldestIssue": "2025-11-15T08:00:00.000Z",
      "newestIssue": "2025-12-21T09:45:00.000Z"
    }
  }
}
```

**Use Cases:**

- Dashboard summary statistics
- Trend analysis over time
- Resource allocation planning
- Reporting and analytics

---

### 3. Get Clustered Heatmap

**GET** `/api/heatmap/clustered`

Get heatmap data with automatic clustering to reduce point density while preserving information.

**Query Parameters:**

| Parameter                                  | Type   | Required | Default | Description                    |
| ------------------------------------------ | ------ | -------- | ------- | ------------------------------ |
| `organizationId`                           | string | **Yes**  | -       | Your organization ID           |
| `clusterRadius`                            | number | No       | 100     | Clustering radius in meters    |
| `minClusterSize`                           | number | No       | 2       | Minimum issues to form cluster |
| All other filters from `/api/heatmap/data` | -      | No       | -       | Standard filtering options     |

**Example Request:**

```bash
curl "http://localhost:3001/api/heatmap/clustered?organizationId=ORG123&clusterRadius=150&minClusterSize=3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response Format:** Same as `/api/heatmap/data`

**Use Cases:**

- Large campus overview with hundreds of issues
- Performance optimization for slow clients
- Identifying major problem zones
- Mobile app displays

---

### 4. Get Grid-Based Heatmap

**GET** `/api/heatmap/grid`

Get heatmap data using grid-based aggregation for optimal performance.

**Query Parameters:**

| Parameter                                  | Type   | Required | Default | Description                |
| ------------------------------------------ | ------ | -------- | ------- | -------------------------- |
| `organizationId`                           | string | **Yes**  | -       | Your organization ID       |
| `gridSize`                                 | number | No       | 100     | Grid cell size in meters   |
| All other filters from `/api/heatmap/data` | -      | No       | -       | Standard filtering options |

**Example Request:**

```bash
curl "http://localhost:3001/api/heatmap/grid?organizationId=ORG123&gridSize=200" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response Format:** Same as `/api/heatmap/data`

**Use Cases:**

- Large-scale campus visualization
- Performance-constrained environments
- Real-time dashboard updates
- Administrative overview screens

---

## Aggregation Logic Details

### 1. Density Calculation

Issues are grouped by proximity using a grid-based spatial aggregation algorithm:

```
Grid Size Guidelines:
- 25m: High detail, building-level analysis
- 50m: Balanced (default), zone-level analysis
- 100m: Campus overview
- 200m: Regional view
```

**Algorithm:**

1. Campus divided into grid cells
2. Issues within same cell grouped together
3. Geographic centroid calculated for each group
4. Creates single heatmap point per group

### 2. Severity-Weighted Intensity

Each issue's contribution is weighted by:

```typescript
// Base severity (normalized 0-1)
severityScore = issue.severity / 10

// Priority multipliers
CRITICAL: 4.0×
HIGH:     2.5×
MEDIUM:   1.5×
LOW:      1.0×

// Final weight
weight = baseWeight × (1 + avgSeverity × multiplier)
```

**Multiplier Guidelines:**

- `0.5`: Subtle emphasis
- `1.0`: Moderate emphasis
- `2.0`: Strong emphasis (default)
- `3.0+`: Very strong emphasis

### 3. Time-Based Decay

Recent issues have higher weight using exponential decay:

```typescript
decayWeight = e^(-decayFactor × normalizedAge)

where:
  normalizedAge = issue_age / max_age (90 days)
```

**Decay Factor Guidelines:**

- `0.0`: No decay (all ages equal)
- `0.3`: Slow decay (60-day relevance)
- `0.5`: Moderate decay (30-day relevance, default)
- `1.0`: Fast decay (2-week focus)
- `2.0`: Very fast decay (1-week focus)

**Weight Retention Examples:**

```
After 30 days:
- Factor 0.3: 91% weight
- Factor 0.5: 86% weight
- Factor 1.0: 74% weight
- Factor 2.0: 55% weight
```

---

## Configuration Presets

### Emergency Response Mode

Focus on critical, recent issues:

```bash
GET /api/heatmap/data?organizationId=ORG123
  &timeDecayFactor=1.0
  &severityWeightMultiplier=3.0
  &gridSize=25
  &maxAge=7
  &priorities=CRITICAL,HIGH
  &statuses=OPEN,IN_PROGRESS
```

### Maintenance Planning Mode

Identify persistent problem areas:

```bash
GET /api/heatmap/data?organizationId=ORG123
  &timeDecayFactor=0.3
  &severityWeightMultiplier=1.5
  &gridSize=50
  &clusterRadius=100
  &minClusterSize=3
  &maxAge=90
```

### Campus Overview Mode

High-level administration view:

```bash
GET /api/heatmap/grid?organizationId=ORG123
  &gridSize=100
  &timeDecayFactor=0.5
  &severityWeightMultiplier=2.0
  &maxAge=30
```

### Building Analysis Mode

Detailed single-building view:

```bash
GET /api/heatmap/data?organizationId=ORG123
  &buildingIds=engineering-bldg
  &gridSize=10
  &timeDecayFactor=0.4
  &maxAge=60
```

---

## Integration Examples

### TypeScript/React

```typescript
import { HeatmapGeoJSON } from "./types";

interface HeatmapConfig {
  timeDecay: number;
  severityWeight: number;
  gridSize: number;
  maxAge: number;
}

async function fetchHeatmap(
  orgId: string,
  config: HeatmapConfig
): Promise<HeatmapGeoJSON> {
  const params = new URLSearchParams({
    organizationId: orgId,
    timeDecayFactor: config.timeDecay.toString(),
    severityWeightMultiplier: config.severityWeight.toString(),
    gridSize: config.gridSize.toString(),
    maxAge: config.maxAge.toString(),
  });

  const response = await fetch(`/api/heatmap/data?${params}`, {
    headers: {
      Authorization: `Bearer ${await getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch heatmap");
  }

  const result = await response.json();
  return result.data;
}

// Usage
const heatmapData = await fetchHeatmap("ORG123", {
  timeDecay: 0.5,
  severityWeight: 2.0,
  gridSize: 50,
  maxAge: 30,
});
```

### Leaflet.js Integration

```typescript
import L from "leaflet";
import "leaflet.heat";

function renderHeatmap(map: L.Map, data: HeatmapGeoJSON) {
  // Convert GeoJSON to heatmap format
  const heatData = data.features.map((feature) => [
    feature.geometry.coordinates[1], // latitude
    feature.geometry.coordinates[0], // longitude
    feature.properties.weight, // intensity (0-1)
  ]);

  // Create heatmap layer
  const heatLayer = L.heatLayer(heatData, {
    radius: 25,
    blur: 15,
    maxZoom: 17,
    max: 1.0,
    gradient: {
      0.0: "blue",
      0.4: "cyan",
      0.5: "lime",
      0.6: "yellow",
      0.7: "orange",
      1.0: "red",
    },
  }).addTo(map);

  return heatLayer;
}
```

### Mapbox GL JS Integration

```typescript
import mapboxgl from "mapbox-gl";

function renderHeatmap(map: mapboxgl.Map, data: HeatmapGeoJSON) {
  map.addSource("heatmap-source", {
    type: "geojson",
    data: data,
  });

  map.addLayer({
    id: "heatmap-layer",
    type: "heatmap",
    source: "heatmap-source",
    paint: {
      "heatmap-weight": ["get", "weight"],
      "heatmap-intensity": 1,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0,
        "rgba(0, 0, 255, 0)",
        0.2,
        "rgb(0, 255, 255)",
        0.4,
        "rgb(0, 255, 0)",
        0.6,
        "rgb(255, 255, 0)",
        0.8,
        "rgb(255, 128, 0)",
        1,
        "rgb(255, 0, 0)",
      ],
      "heatmap-radius": 20,
      "heatmap-opacity": 0.7,
    },
  });
}
```

### Python

```python
import requests
from typing import Dict, List, Optional

def fetch_heatmap(
    org_id: str,
    token: str,
    time_decay: float = 0.5,
    severity_weight: float = 2.0,
    grid_size: int = 50,
    max_age: Optional[int] = None
) -> Dict:
    """Fetch heatmap data from API"""

    params = {
        'organizationId': org_id,
        'timeDecayFactor': time_decay,
        'severityWeightMultiplier': severity_weight,
        'gridSize': grid_size,
    }

    if max_age:
        params['maxAge'] = max_age

    headers = {'Authorization': f'Bearer {token}'}

    response = requests.get(
        'http://localhost:3001/api/heatmap/data',
        params=params,
        headers=headers
    )

    response.raise_for_status()
    return response.json()['data']

# Usage
heatmap_data = fetch_heatmap(
    org_id='ORG123',
    token='your-token',
    time_decay=1.0,
    severity_weight=3.0,
    max_age=7
)
```

---

## Performance Guidelines

### 1. Grid Size Selection

Choose grid size based on campus size and performance needs:

```typescript
// Small campus (< 50 buildings)
gridSize: 25;

// Medium campus (50-200 buildings)
gridSize: 50;

// Large campus (200+ buildings)
gridSize: 100;

// Regional view
gridSize: 200;
```

### 2. Use Clustering for Large Datasets

```bash
# Instead of this (slow):
GET /api/heatmap/data?organizationId=ORG123

# Use this (fast):
GET /api/heatmap/clustered?organizationId=ORG123&clusterRadius=100
```

### 3. Apply Time Filtering

```bash
# Limit data scope for better performance
GET /api/heatmap/data?organizationId=ORG123&maxAge=30&startDate=2025-11-01
```

### 4. Cache Results

```typescript
// Cache heatmap data for 5-15 minutes
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

let cachedData: HeatmapGeoJSON | null = null;
let cacheTime: number = 0;

async function getCachedHeatmap(config: HeatmapConfig) {
  const now = Date.now();

  if (cachedData && now - cacheTime < CACHE_DURATION) {
    return cachedData;
  }

  cachedData = await fetchHeatmap(config);
  cacheTime = now;

  return cachedData;
}
```

---

## Error Handling

### Common Errors

**400 Bad Request**

```json
{
  "error": "organizationId is required"
}
```

**401 Unauthorized**

```json
{
  "error": "Invalid or missing authentication token"
}
```

**500 Internal Server Error**

```json
{
  "error": "Failed to get heatmap data",
  "message": "Error details..."
}
```

### Error Handling Example

```typescript
async function fetchHeatmapSafely(config: HeatmapConfig) {
  try {
    const data = await fetchHeatmap("ORG123", config);
    return { success: true, data };
  } catch (error) {
    if (error.response?.status === 401) {
      // Refresh authentication
      await refreshAuth();
      return fetchHeatmapSafely(config);
    }

    console.error("Heatmap fetch failed:", error);
    return { success: false, error: error.message };
  }
}
```

---

## Testing

### Test with cURL

```bash
# Basic heatmap
curl -X GET "http://localhost:3001/api/heatmap/data?organizationId=ggv-university" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Emergency mode
curl -X GET "http://localhost:3001/api/heatmap/data?organizationId=ggv-university&timeDecayFactor=1.0&severityWeightMultiplier=3.0&maxAge=7&priorities=CRITICAL,HIGH" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Building-specific
curl -X GET "http://localhost:3001/api/heatmap/data?organizationId=ggv-university&buildingIds=engineering-bldg&gridSize=25" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Statistics
curl -X GET "http://localhost:3001/api/heatmap/stats?organizationId=ggv-university&maxAge=30" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clustered
curl -X GET "http://localhost:3001/api/heatmap/clustered?organizationId=ggv-university&clusterRadius=150" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Script

```bash
# Run heatmap test
cd backend
npm run ts-node src/scripts/test-heatmap.ts
```

---

## Best Practices

1. **Match Configuration to Use Case**: Use appropriate presets
2. **Monitor Performance**: Adjust gridSize for large datasets
3. **Update Regularly**: Refresh every 5-15 minutes for dashboards
4. **Cache Intelligently**: Cache with appropriate TTL
5. **Test Different Settings**: Experiment with decay/severity values
6. **Apply Filters**: Use building/category filters to reduce data
7. **Use Clustering**: Enable for datasets with 100+ issues

---

## Troubleshooting

### No Intensity Variation

Increase severity weight or adjust time decay:

```bash
&timeDecayFactor=0.8&severityWeightMultiplier=3.0
```

### Too Many Small Points

Increase grid size or enable clustering:

```bash
&gridSize=100&clusterRadius=150&minClusterSize=2
```

### Old Issues Dominating

Increase time decay or reduce maxAge:

```bash
&timeDecayFactor=1.0&maxAge=30
```

### Critical Issues Not Standing Out

Increase severity multiplier:

```bash
&severityWeightMultiplier=4.0&priorities=CRITICAL,HIGH
```

---

## See Also

- [Heatmap Aggregation Logic Guide](./HEATMAP_AGGREGATION_GUIDE.md) - Detailed algorithm explanations
- [Analytics API](./ANALYTICS_API.md) - Related analytics endpoints
- [Issues API](./ISSUES_API.md) - Issue management endpoints

---

## Support

For issues or questions:

- API Code: `/backend/src/modules/heatmap/`
- Service Logic: `/backend/src/modules/heatmap/heatmap.service.ts`
- Test Script: `/backend/src/scripts/test-heatmap.ts`
