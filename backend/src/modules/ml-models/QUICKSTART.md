# Using ML Models in CIIS - Quick Start

## 🚀 Get Started in 5 Minutes

### Step 1: Start the ML API Server

Open a terminal and run:

```bash
cd d:\CIIS\ml-models
python api_integration.py
```

You should see:

```
WARNING in 110 file! Use PYTHONWARNINGS=ignore to disable this warning.
 * Running on http://127.0.0.1:5000
```

### Step 2: Start the Backend Server

In another terminal:

```bash
cd d:\CIIS\backend
npm install  # First time only
npm run dev
```

### Step 3: Test the Integration

Use curl or Postman to test:

```bash
# Check if ML models are available
curl http://localhost:3001/api/ml/health

# Get all risk scores
curl http://localhost:3001/api/ml/risk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get critical buildings
curl http://localhost:3001/api/ml/critical-buildings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Available Endpoints

### No Authentication Required

- `GET /api/ml/health` - Check ML models status

### Authentication Required (Bearer token)

- `GET /api/ml/predictions` - Get failure predictions
- `GET /api/ml/predictions/:buildingId` - Get specific building prediction
- `GET /api/ml/anomalies` - Get anomalies
- `GET /api/ml/risk` - Get all risk scores
- `GET /api/ml/risk/:buildingId` - Get specific building risk
- `GET /api/ml/risk/category` - Get category analysis
- `GET /api/ml/risk/priority` - Get maintenance priority list
- `GET /api/ml/risk/report` - Get comprehensive report
- `GET /api/ml/critical-buildings` - Get critical buildings only
- `GET /api/ml/high-risk-buildings` - Get high-risk buildings only

## 💻 Usage in Code

### Get Risk Scores in Any Module

```typescript
// Import the ML service
import { mlModelsService } from "../ml-models";

// Get all risk scores
const scores = await mlModelsService.getRiskScores();
console.log(scores);

// Get specific building risk
const risk = await mlModelsService.getBuildingRiskScore("B001");
console.log(risk);

// Get critical buildings
const critical = await mlModelsService.getCriticalBuildings();
console.log(critical);
```

### Use in Issues Module

```typescript
// Check risk when creating issue
import { mlModelsService } from "../ml-models";

export async function createIssue(issue) {
  // Get building risk
  const risk = await mlModelsService.getBuildingRiskScore(issue.buildingId);

  // Flag if building is critical
  if (risk?.risk_level === "CRITICAL") {
    issue.escalated = true;
    issue.ml_risk_score = risk.risk_probability;
  }

  return await db.collection("issues").add(issue);
}
```

### Display in Dashboard

```typescript
// Frontend code (React/Vue)
async function loadRiskDashboard() {
  const response = await fetch("/api/ml/risk", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const { risk_scores, summary } = await response.json();

  // Display summary
  console.log(`Critical: ${summary.critical_count}`);
  console.log(`High: ${summary.high_count}`);
  console.log(`Average Risk: ${(summary.average_risk * 100).toFixed(1)}%`);

  // Display building scores
  risk_scores.forEach((score) => {
    console.log(`${score.building_id}: ${score.risk_level}`);
  });
}
```

## 🎯 Common Use Cases

### 1. Auto-Escalate Issues from Critical Buildings

```typescript
async function handleNewIssue(buildingId: string) {
  const risk = await mlModelsService.getBuildingRiskScore(buildingId);

  if (risk?.risk_level === "CRITICAL") {
    // Auto-escalate
    return { priority: "URGENT", escalated: true };
  }

  return { priority: "NORMAL", escalated: false };
}
```

### 2. Schedule Maintenance

```typescript
async function scheduleMaintenance() {
  const priority = await mlModelsService.getPriorityBuildings(5);

  priority.forEach((building, index) => {
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + index);

    createMaintenanceWork({
      building_id: building.building_id,
      priority: building.risk_level,
      scheduled_date: scheduleDate,
      reason: `ML Risk Score: ${building.risk_probability.toFixed(1)}%`,
    });
  });
}
```

### 3. Monitor Anomalies

```typescript
async function checkAnomalies() {
  const anomalies = await mlModelsService.getAnomalies();
  const critical = anomalies.filter((a) => a.risk_level === "CRITICAL");

  if (critical.length > 0) {
    await sendAlert({
      type: "CRITICAL_ANOMALY",
      message: `${critical.length} buildings with critical anomalies`,
      buildings: critical.map((a) => a.building_id),
    });
  }
}
```

### 4. Generate Risk Report

```typescript
async function generateReport() {
  const report = await mlModelsService.getRiskReport();
  const scores = await mlModelsService.getRiskScores();
  const categories = await mlModelsService.getCategoryRisks();

  return {
    timestamp: new Date(),
    executive_summary: report.executive_summary,
    risk_distribution: {
      critical: scores.filter((s) => s.risk_level === "CRITICAL").length,
      high: scores.filter((s) => s.risk_level === "HIGH").length,
      medium: scores.filter((s) => s.risk_level === "MEDIUM").length,
      low: scores.filter((s) => s.risk_level === "LOW").length,
    },
    high_risk_categories: categories.filter((c) => c.risk_level === "HIGH"),
    recommendations: report.recommendations,
  };
}
```

## 📈 Example Response

### GET /api/ml/risk

```json
{
  "status": "success",
  "timestamp": "2024-01-07T13:45:00Z",
  "risk_scores": [
    {
      "building_id": "B001",
      "risk_probability": 0.7234,
      "risk_level": "HIGH",
      "failure_score": 0.288,
      "anomaly_score": 0.096,
      "recency_score": 0.195
    },
    {
      "building_id": "B003",
      "risk_probability": 0.8932,
      "risk_level": "CRITICAL",
      "failure_score": 0.312,
      "anomaly_score": 0.195,
      "recency_score": 0.267
    }
  ],
  "summary": {
    "total_buildings": 20,
    "critical_count": 2,
    "high_count": 3,
    "medium_count": 7,
    "low_count": 8,
    "average_risk": 0.5272
  }
}
```

## 🔧 Troubleshooting

### "ML API unavailable" Error

1. Check if Python server is running:

   ```bash
   curl http://127.0.0.1:5000/api/health
   ```

2. If not, start it:
   ```bash
   cd d:\CIIS\ml-models
   python api_integration.py
   ```

### "No risk scores available"

Models need to be trained. Run:

```bash
cd d:\CIIS\ml-models
python train_failure_model.py
python train_anomaly_detection.py
python train_risk_probability.py
```

### Authentication Errors

Make sure to include JWT token:

```bash
curl http://localhost:3001/api/ml/risk \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## 📚 Learn More

- ML Models documentation: `d:\CIIS\ml-models\docs\RISK_PROBABILITY.md`
- Full API guide: `d:\CIIS\backend\src\modules\ml-models\README.md`
- System architecture: `d:\CIIS\ml-models\docs\system-architecture.md`

## ✅ Checklist

- [ ] ML API server running at http://127.0.0.1:5000
- [ ] Backend server running at http://localhost:3001
- [ ] Models trained (risk_probability_model.pkl exists)
- [ ] Can access `/api/ml/health` endpoint
- [ ] Can access `/api/ml/risk` with authentication
- [ ] Risk scores displayed in your application
- [ ] Critical buildings are highlighted
- [ ] Maintenance recommendations visible

---

**You're all set!** The ML models are now fully integrated into your CIIS system. 🎉
