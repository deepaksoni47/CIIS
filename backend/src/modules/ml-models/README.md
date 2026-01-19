# ML Models Integration Guide

This guide explains how to use the integrated ML models in your CIIS backend system.

## Overview

The ML models are now integrated into your backend as a new module (`/api/ml`) that provides:

- **Failure Prediction**: Predict building failures 2-4 weeks in advance
- **Anomaly Detection**: Detect infrastructure anomalies in real-time
- **Risk Probability**: Composite risk scoring for maintenance planning

## Architecture

```
CIIS Backend (Node.js/Express)
    ↓
ML Models Service (mlModelsService)
    ↓
Python Flask API (http://127.0.0.1:5000)
    ↓
Trained ML Models
    ├── Phase 1: Failure Prediction
    ├── Phase 2: Anomaly Detection
    └── Phase 3: Risk Probability
```

## Setup

### 1. Ensure ML API is Running

The ML models run on a separate Python Flask server. Make sure it's running:

```bash
cd d:\CIIS\ml-models
python api_integration.py
```

The server should be running at `http://127.0.0.1:5000`

### 2. Configure Backend Environment

Add to your `.env` file in the backend:

```env
# ML Models API Configuration
ML_API_URL=http://127.0.0.1:5000
NODE_ENV=development
```

### 3. Start Backend Server

```bash
cd d:\CIIS\backend
npm install  # If not done already
npm run dev
```

## API Endpoints

All endpoints require authentication (Bearer token in Authorization header).

### Health Check

```
GET /api/ml/health
```

Check if ML models are available

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-07T13:45:00Z",
  "message": "ML models are available and ready"
}
```

### Failure Predictions

#### Get All Predictions

```
GET /api/ml/predictions
```

**Response:**

```json
{
  "status": "success",
  "predictions": [
    {
      "building_id": "B001",
      "failure_probability": 0.45,
      "time_window_days": 14,
      "risk_level": "HIGH",
      "confidence": 0.85
    }
  ],
  "summary": {
    "total_buildings": 20,
    "critical_count": 1,
    "high_count": 3,
    "average_failure_probability": 0.38
  }
}
```

#### Get Prediction for Specific Building

```
GET /api/ml/predictions/:buildingId
```

### Anomaly Detection

#### Get Anomalies

```
GET /api/ml/anomalies
```

**Response:**

```json
{
  "status": "success",
  "anomalies": [
    {
      "building_id": "B003",
      "anomaly_probability": 0.78,
      "anomaly_type": "isolation_forest",
      "is_anomalous": true,
      "risk_level": "HIGH"
    }
  ],
  "summary": {
    "total_anomalies": 5,
    "critical_count": 2,
    "high_count": 3
  }
}
```

### Risk Scoring

#### Get All Risk Scores

```
GET /api/ml/risk
```

**Response:**

```json
{
  "status": "success",
  "risk_scores": [
    {
      "building_id": "B007",
      "risk_probability": 0.813,
      "risk_level": "HIGH",
      "failure_score": 0.312,
      "anomaly_score": 0.195,
      "recency_score": 0.267
    }
  ],
  "summary": {
    "total_buildings": 20,
    "critical_count": 1,
    "high_count": 2,
    "medium_count": 15,
    "low_count": 2,
    "average_risk": 0.542
  }
}
```

#### Get Risk Score for Specific Building

```
GET /api/ml/risk/:buildingId
```

#### Get Category-Specific Risks

```
GET /api/ml/risk/category
```

Returns risk scores for each infrastructure category (WATER, ELECTRICITY, WIFI, SANITATION, TEMPERATURE).

#### Get Priority Buildings for Maintenance

```
GET /api/ml/risk/priority?top=10
```

Returns buildings ranked by risk priority for maintenance scheduling.

#### Get Comprehensive Risk Report

```
GET /api/ml/risk/report
```

Returns executive summary with recommendations and analysis.

### Critical Status Endpoints

#### Get Critical Buildings

```
GET /api/ml/critical-buildings
```

Returns only buildings with CRITICAL risk level (≥0.80).

#### Get High-Risk Buildings

```
GET /api/ml/high-risk-buildings
```

Returns buildings with HIGH risk level (0.60-0.80).

## Usage Examples

### Example 1: Get Risk Scores from Backend

```typescript
// In your component or service
async function getRiskScores() {
  const response = await fetch("/api/ml/risk", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log("Risk scores:", data.risk_scores);
  console.log("Critical buildings:", data.summary.critical_count);
}
```

### Example 2: Use ML Service in Another Module

```typescript
// In another service file
import { mlModelsService } from "../ml-models/ml-models.service";

export async function scheduleMaintenance() {
  // Get critical buildings
  const criticalBuildings = await mlModelsService.getCriticalBuildings();

  for (const building of criticalBuildings) {
    // Create work order
    await createWorkOrder({
      buildingId: building.building_id,
      priority: "URGENT",
      description: `Risk-based maintenance (score: ${building.risk_probability.toFixed(1)}%)`,
    });
  }
}
```

### Example 3: Real-time Monitoring

```typescript
// Check for new anomalies periodically
async function monitorAnomalies() {
  setInterval(async () => {
    const anomalies = await mlModelsService.getAnomalies();
    const criticalAnomalies = anomalies.filter(
      (a) => a.risk_level === "CRITICAL"
    );

    if (criticalAnomalies.length > 0) {
      // Send alert to facilities team
      await sendAlert({
        type: "CRITICAL_ANOMALY",
        buildings: criticalAnomalies.map((a) => a.building_id),
        message: `${criticalAnomalies.length} buildings detected with critical anomalies`,
      });
    }
  }, 300000); // Check every 5 minutes
}
```

### Example 4: Integrate with Issues Module

```typescript
// In issues.service.ts
import { mlModelsService } from "../ml-models/ml-models.service";

export async function createIssue(issue: Issue) {
  // Save issue to database
  const savedIssue = await db.collection("issues").add(issue);

  // Get building risk
  const buildingRisk = await mlModelsService.getBuildingRiskScore(
    issue.buildingId
  );

  // If building is critical, flag issue for high priority
  if (buildingRisk?.risk_level === "CRITICAL") {
    await db.collection("issues").doc(savedIssue.id).update({
      escalated: true,
      reason: "Building at critical risk level",
      ml_risk_score: buildingRisk.risk_probability,
    });
  }

  return savedIssue;
}
```

## Data Flow

### Request Flow

```
Frontend Request
    ↓
Backend Route Handler
    ↓
ML Models Controller
    ↓
ML Models Service
    ↓
Axios HTTP Client
    ↓
Python Flask API (http://127.0.0.1:5000)
    ↓
Trained ML Models
    ↓
Response (JSON)
```

### Data Persistence

The ML service can optionally save results to Firestore:

```typescript
// Get risk scores
const scores = await mlModelsService.getRiskScores();

// Save to Firestore for historical tracking
await mlModelsService.saveRiskScores(scores);

// Later retrieve from Firestore
const historicalScores = await db
  .collection("risk_scores")
  .orderBy("updated_at", "desc")
  .limit(20)
  .get();
```

## Integration Points

### 1. Issues Module

- Flag issues from critical buildings
- Auto-escalate issues based on ML risk scores
- Suggest maintenance actions

### 2. Priority Module

- Use ML risk scores for priority calculation
- Factor ML predictions into priority algorithms

### 3. Analytics Module

- Track ML prediction accuracy
- Analyze building failure patterns
- Generate risk trend reports

### 4. Admin Dashboard

- Display critical buildings
- Show risk distribution charts
- Provide maintenance recommendations

## Error Handling

The ML service includes comprehensive error handling:

```typescript
try {
  const scores = await mlModelsService.getRiskScores();
} catch (error) {
  // Service automatically logs error
  // Returns empty array if ML API is down
  // Frontend can show fallback UI
}
```

If the ML API is unavailable:

- Health check returns `status: "unavailable"`
- Endpoints return appropriate error messages
- System continues to function with fallback behavior

## Performance Considerations

### Caching

Consider caching ML results to avoid excessive API calls:

```typescript
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getRiskScoresWithCache() {
  const cacheKey = "risk_scores";
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const scores = await mlModelsService.getRiskScores();
  cache.set(cacheKey, { data: scores, timestamp: Date.now() });
  return scores;
}
```

### Rate Limiting

Endpoints are protected by rate limiting. Ensure batch operations don't trigger limits:

```typescript
// Good: Batch check all buildings at once
const allScores = await mlModelsService.getRiskScores();

// Avoid: Multiple sequential calls
for (const building of buildings) {
  await mlModelsService.getBuildingRiskScore(building.id); // Inefficient
}
```

## Troubleshooting

### ML API Not Responding

**Check 1:** Is the Python Flask server running?

```bash
curl http://127.0.0.1:5000/api/health
```

**Check 2:** Are trained models available?

```bash
ls -la d:\CIIS\ml-models\models/
```

**Check 3:** Check logs for errors:

```bash
# Backend logs
npm run dev

# Python logs (in another terminal)
python api_integration.py
```

### No Risk Scores Available

**Solution:** Ensure training scripts have been executed:

```bash
cd d:\CIIS\ml-models
python train_failure_model.py
python train_anomaly_detection.py
python train_risk_probability.py
```

### Slow Responses

**Solution:** Implement caching or reduce query frequency. Default timeout is 10 seconds.

### Authentication Errors

**Solution:** Ensure requests include valid Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

## Environment Variables

Required `.env` variables:

```env
# ML API Configuration
ML_API_URL=http://127.0.0.1:5000

# Firebase (already configured)
FIREBASE_PROJECT_ID=your_project
FIREBASE_PRIVATE_KEY=your_key

# Node Environment
NODE_ENV=development
PORT=3001
```

## API Response Format

All ML endpoints follow this response format:

**Success:**

```json
{
  "status": "success",
  "timestamp": "2024-01-07T13:45:00Z",
  "data": {...}
}
```

**Error:**

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Unavailable:**

```json
{
  "status": "unavailable",
  "message": "ML models are currently unavailable"
}
```

## Next Steps

1. **Test endpoints** using curl or Postman
2. **Integrate into frontend** for risk visualization
3. **Create alerting system** for critical buildings
4. **Implement scheduling** for periodic ML updates
5. **Build maintenance dashboard** using risk scores

## Support

For issues or questions:

- Check ML API logs: `python api_integration.py`
- Review endpoint documentation in this file
- Check backend logs: `npm run dev`
- Verify .env configuration

## Resources

- ML Models Guide: `d:\CIIS\ml-models\docs\RISK_PROBABILITY.md`
- System Architecture: `d:\CIIS\ml-models\docs\system-architecture.md`
- API Specification: `d:\CIIS\ml-models\docs\api\api-spec.md`
