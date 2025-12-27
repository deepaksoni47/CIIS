# CampusCare Database Architecture - Multi-Tenancy Design

## Overview

The database has been restructured to support **multi-tenancy** where each university/college has isolated data. This enables:

- Multiple universities using the same platform
- Students only see issues from their campus
- Facility managers manage their own organization
- Scalable architecture for nationwide deployment

---

## Database Schema

### 1. **Organizations** Collection

Represents universities/colleges (multi-tenancy root)

```typescript
{
  id: "ggv-bilaspur",
  name: "Guru Ghasidas Vishwavidyalaya",
  shortName: "GGV",
  address: "Koni, Bilaspur",
  city: "Bilaspur",
  state: "Chhattisgarh",
  country: "India",
  campusCenter: GeoPoint(22.1310, 82.1495),
  campusBounds: {
    northWest: GeoPoint(22.1515, 82.1340),
    northEast: GeoPoint(22.1515, 82.1655),
    southWest: GeoPoint(22.1150, 82.1340),
    southEast: GeoPoint(22.1150, 82.1655)
  },
  contactEmail: "info@ggu.ac.in",
  contactPhone: "+91-7752-260910",
  website: "https://www.ggu.ac.in",
  timezone: "Asia/Kolkata",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. **Departments** Collection

Academic and administrative departments

```typescript
{
  id: "dept-cse",
  organizationId: "ggv-bilaspur",
  name: "Computer Science & Engineering",
  code: "CSE",
  buildingId: "bldg-engineering", // Optional
  contactPerson: "Dr. Name",
  contactEmail: "cse@ggu.ac.in",
  contactPhone: "+91-XXX",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3. **Buildings** Collection

Physical infrastructure blocks

```typescript
{
  id: "bldg-engineering",
  organizationId: "ggv-bilaspur",
  departmentId: "dept-cse", // Optional
  name: "Engineering Block A",
  code: "ENG-A",
  location: GeoPoint(22.1335, 82.1470),
  address: "Engineering Block A, GGV Campus, Bilaspur",
  buildingType: "Academic", // Academic, Residential, Administrative, Library, etc.
  floors: 4,
  totalArea: 5000, // in sq meters
  constructionYear: 2010,
  lastRenovation: Timestamp,
  status: "active", // active | under_maintenance | decommissioned
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 4. **Rooms** Collection

Individual rooms within buildings

```typescript
{
  id: "room-101",
  organizationId: "ggv-bilaspur",
  buildingId: "bldg-engineering",
  departmentId: "dept-cse",
  roomNumber: "101",
  floor: 1,
  roomType: "classroom", // classroom | lab | office | auditorium | library | common | restroom | other
  capacity: 60,
  area: 80, // sq meters
  hasAC: true,
  hasProjector: true,
  status: "active", // active | under_maintenance | closed
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 5. **Issues** Collection (Enhanced)

Infrastructure issues with multi-modal support

```typescript
{
  id: "issue-001",
  organizationId: "ggv-bilaspur",
  buildingId: "bldg-engineering",
  departmentId: "dept-cse",
  roomId: "room-101",
  title: "Broken AC in Classroom 201",
  description: "Air conditioning unit not working...",
  category: "HVAC", // Structural | Electrical | Plumbing | HVAC | Safety | Maintenance | Cleanliness | Network | Furniture | Other
  severity: 7, // 1-10 (auto-calculated by AI)
  status: "open", // open | in_progress | resolved | closed
  priority: "high", // low | medium | high | critical (auto-calculated)
  location: GeoPoint(22.1335, 82.1470),

  // Multi-modal submission
  submissionType: "text", // text | voice | image | mixed
  voiceTranscript: "The AC is broken...", // If voice
  voiceAudioUrl: "https://storage.../audio.mp3",
  images: ["https://storage.../img1.jpg", "..."], // Storage URLs
  aiImageAnalysis: "Gemini Vision detected: HVAC unit with visible damage...",

  reportedBy: "user-student1",
  reportedByRole: "student", // student | faculty | staff | facility_manager | admin
  assignedTo: "user-facility",
  estimatedCost: 5000,
  actualCost: 4800,
  estimatedDuration: 3, // days
  actualDuration: 2,

  // AI predictions & insights
  aiRiskScore: 75, // 0-100
  aiPredictedRecurrence: true,
  aiRecommendations: ["Immediate inspection", "Replace unit", "..."],
  aiSummary: "High severity HVAC failure requiring urgent attention...",

  createdAt: Timestamp,
  updatedAt: Timestamp,
  resolvedAt: Timestamp
}
```

### 6. **Users** Collection (Enhanced)

User accounts with role-based permissions

```typescript
{
  id: "user-student1",
  organizationId: "ggv-bilaspur",
  email: "deepak@ggu.ac.in",
  name: "Deepak Soni",
  role: "student", // admin | facility_manager | staff | faculty | student
  departmentId: "dept-cse",
  phone: "+91-XXX",
  isActive: true,
  permissions: {
    canCreateIssues: true,
    canResolveIssues: false,
    canAssignIssues: false,
    canViewAllIssues: false, // Students see only their own
    canManageUsers: false
  },
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLogin: Timestamp,
  preferences: {
    notifications: true,
    emailAlerts: false
  }
}
```

### 7. **Issue Predictions** Collection (NEW)

AI-powered failure predictions

```typescript
{
  id: "pred-001",
  organizationId: "ggv-bilaspur",
  buildingId: "bldg-engineering",
  departmentId: "dept-cse",
  roomId: "room-101",
  predictedCategory: "HVAC",
  predictedSeverity: 8,
  probability: 0.75, // 0-1
  reasoning: "Based on 5 previous HVAC failures in similar conditions...",
  suggestedPreventiveMeasures: [
    "Schedule preventive AC maintenance",
    "Inspect cooling system",
    "Replace aging components"
  ],
  estimatedTimeframe: "within 30 days",
  basedOnHistoricalIssues: ["issue-001", "issue-045", "..."],
  createdAt: Timestamp,
  isActualized: false, // Did prediction come true?
  actualizedIssueId: null,
  actualizedAt: null
}
```

---

## User Roles & Permissions

| Role                 | Can Create Issues | Can Resolve | Can Assign | View All Issues | Manage Users |
| -------------------- | ----------------- | ----------- | ---------- | --------------- | ------------ |
| **Student**          | ✅                | ❌          | ❌         | ❌ (own only)   | ❌           |
| **Faculty**          | ✅                | ❌          | ❌         | ✅ (dept only)  | ❌           |
| **Staff**            | ✅                | ✅          | ❌         | ✅ (dept only)  | ❌           |
| **Facility Manager** | ✅                | ✅          | ✅         | ✅ (all)        | ❌           |
| **Admin**            | ✅                | ✅          | ✅         | ✅ (all)        | ✅           |

---

## GGV Campus Data (Seeded)

### Campus Boundaries

```
Main Campus Center: 22.1310°N, 82.1495°E

Coverage Area:
- North-West: 22.1515°N, 82.1340°E
- North-East: 22.1515°N, 82.1655°E
- South-West: 22.1150°N, 82.1340°E
- South-East: 22.1150°N, 82.1655°E
```

### Departments (10)

- Computer Science & Engineering (CSE)
- Electronics & Communication Engineering (ECE)
- Electrical Engineering (EE)
- Mechanical Engineering (ME)
- Civil Engineering (CIVIL)
- Department of Physics (PHY)
- Department of Chemistry (CHEM)
- Department of Mathematics (MATH)
- Central Library (LIB)
- Administration (ADMIN)

### Buildings (8)

1. **Engineering Block A** - Academic (CSE)
2. **Science Block** - Academic (Physics/Chemistry)
3. **Central Library** - Library
4. **Administrative Block** - Administrative
5. **Boys Hostel Block 1** - Residential
6. **Girls Hostel Block 1** - Residential
7. **University Auditorium** - Auditorium
8. **Sports Complex** - Recreational

---

## Multi-Modal Issue Submission

### 1. Text Submission (Default)

```typescript
POST /api/issues
{
  "title": "Broken AC",
  "description": "AC not working in room 201",
  "category": "HVAC",
  "submissionType": "text"
}
```

### 2. Voice Submission (Speech-to-Text)

```typescript
POST /api/issues
{
  "title": "Voice Report",
  "voiceAudioUrl": "https://storage.../audio.mp3",
  "submissionType": "voice"
}

// Backend: Use speech-to-text API → Extract transcript → Store
```

### 3. Image Submission (Gemini Vision)

```typescript
POST /api/issues
{
  "title": "Issue with equipment",
  "images": ["https://storage.../img1.jpg"],
  "submissionType": "image"
}

// Backend:
// 1. Upload images to Firebase Storage
// 2. Use Gemini Vision to analyze images
// 3. Auto-fill: description, severity, category
// 4. Store aiImageAnalysis for reference
```

### 4. Mixed Submission

Combination of text + voice + images

---

## AI Features

### 1. Image Analysis (Gemini Vision)

```typescript
// Analyze uploaded image
analyzeIssueImage(imageUrl, category?) → {
  description: string,
  severity: number,
  suggestedCategory: string,
  recommendations: string[]
}
```

### 2. Automatic Priority Calculation

```typescript
calculatePriority(severity, category) → "low" | "medium" | "high" | "critical"

// Logic:
// - Structural/Safety/Electrical + severity ≥ 8 → CRITICAL
// - Severity ≥ 8 → HIGH
// - Severity ≥ 6 → MEDIUM
// - Severity < 6 → LOW
```

### 3. Failure Prediction

```typescript
generateFailurePrediction(locationName, historicalIssues) → {
  predictedCategory: string,
  probability: number,
  timeframe: string,
  reasoning: string,
  preventiveMeasures: string[]
}
```

### 4. Risk Assessment

```typescript
generateRiskAssessment(building, recentIssues) → {
  riskScore: number, // 0-100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  reasoning: string
}
```

---

## Firestore Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function belongsToOrg(orgId) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId;
    }

    function hasRole(role) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    // Organizations
    match /organizations/{orgId} {
      allow read: if belongsToOrg(orgId);
      allow write: if hasRole('admin');
    }

    // Issues - Students can create, facility managers can manage
    match /issues/{issueId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if hasRole('facility_manager') || hasRole('admin');
      allow delete: if hasRole('admin');
    }

    // Buildings, Departments, Rooms
    match /{collection}/{docId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin') || hasRole('facility_manager');
    }
  }
}
```

---

## Running the Seeder

```bash
# Seed GGV data
npm run seed:ggv

# Expected output:
# ✅ 1 Organization (GGV)
# ✅ 10 Departments
# ✅ 8 Buildings
# ✅ 9 Rooms
# ✅ 3 Users
# ✅ 5 Sample Issues
```

---

## Next Steps

1. **Implement Issues Module**

   - Create issue CRUD endpoints
   - Add image upload support (Firebase Storage)
   - Integrate voice-to-text
   - Connect Gemini Vision analysis

2. **Build Frontend Components**

   - Issue submission form (text/voice/image)
   - Heatmap with GGV boundaries
   - Priority list sorted by severity
   - Issue detail view with AI insights

3. **Add Authentication**

   - Firebase Auth integration
   - Role-based access control
   - Organization-scoped queries

4. **Implement Predictions**
   - Background job to generate predictions
   - Display predicted failures dashboard
   - Preventive maintenance scheduler

---

## Query Patterns

### Get Issues for Organization

```typescript
const issues = await db
  .collection("issues")
  .where("organizationId", "==", "ggv-bilaspur")
  .where("status", "==", "open")
  .orderBy("severity", "desc")
  .get();
```

### Get Issues by Location (GeoQuery)

```typescript
const center = createGeoPoint(22.131, 82.1495);
const radiusInM = 1000; // 1km

// Use geohash or Firestore GeoPoint queries
```

### Get User's Department Issues

```typescript
const issues = await db
  .collection("issues")
  .where("organizationId", "==", user.organizationId)
  .where("departmentId", "==", user.departmentId)
  .get();
```

### Priority Sorted Issues

```typescript
const issues = await db
  .collection("issues")
  .where("organizationId", "==", "ggv-bilaspur")
  .where("priority", "==", "critical")
  .orderBy("createdAt", "desc")
  .limit(10)
  .get();
```

---

This architecture supports:
✅ Multi-tenancy (multiple universities)
✅ Role-based permissions
✅ Multi-modal issue submission
✅ AI-powered predictions
✅ Geospatial queries
✅ Scalable for nationwide deployment
