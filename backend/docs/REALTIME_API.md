# Real-time API Documentation

Complete documentation for CIIS real-time update system using WebSocket and Server-Sent Events (SSE).

## Table of Contents

1. [Overview](#overview)
2. [WebSocket API](#websocket-api)
3. [SSE API](#sse-api)
4. [Authentication](#authentication)
5. [Event Types](#event-types)
6. [Room Subscriptions](#room-subscriptions)
7. [Error Codes](#error-codes)
8. [Rate Limits](#rate-limits)

---

## Overview

The CIIS real-time system provides two complementary protocols for live updates:

### WebSocket (Socket.IO)

- **Protocol**: WebSocket with Socket.IO
- **Direction**: Bidirectional
- **Use Cases**: Instant notifications, interactive features
- **Endpoint**: `ws://localhost:3001` or `wss://api.example.com`

### Server-Sent Events (SSE)

- **Protocol**: HTTP with Server-Sent Events
- **Direction**: Unidirectional (server → client)
- **Use Cases**: Continuous data streams, dashboard updates
- **Base URL**: `/api/realtime`

---

## WebSocket API

### Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  auth: {
    token: "your-jwt-token",
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### Server Events (Client → Server)

#### authenticate

Authenticate the WebSocket connection.

```typescript
socket.emit("authenticate", { token: "your-jwt-token" });
```

**Response:**

```typescript
{
  success: true,
  userId: 'user123',
  organizationId: 'org123'
}
```

#### subscribe:organization

Subscribe to all updates for an organization.

```typescript
socket.emit("subscribe:organization", {
  organizationId: "org123",
});
```

**Response:**

```typescript
{
  success: true,
  room: 'org:org123',
  subscriberCount: 5
}
```

#### subscribe:campus

Subscribe to updates for a specific campus.

```typescript
socket.emit("subscribe:campus", {
  organizationId: "org123",
  campusId: "campus456",
});
```

#### subscribe:building

Subscribe to updates for a specific building.

```typescript
socket.emit("subscribe:building", {
  organizationId: "org123",
  buildingId: "building789",
});
```

#### subscribe:heatmap

Subscribe to heatmap updates only.

```typescript
socket.emit("subscribe:heatmap", {
  organizationId: "org123",
});
```

#### unsubscribe

Unsubscribe from a room.

```typescript
socket.emit("unsubscribe", {
  room: "org:org123",
});
```

### Client Events (Server → Client)

#### issue:created

Emitted when a new issue is created.

```typescript
socket.on("issue:created", (payload) => {
  console.log("New issue:", payload);
});
```

**Payload:**

```typescript
{
  issue: {
    id: 'issue123',
    title: 'Broken water fountain',
    description: 'Water fountain on 3rd floor not working',
    priority: 'high',
    status: 'open',
    location: {
      lat: 14.5995,
      lng: 120.9842
    },
    buildingId: 'building789',
    campusId: 'campus456',
    organizationId: 'org123',
    reportedBy: 'user123',
    createdAt: '2024-01-15T10:30:00Z'
  },
  action: 'created',
  timestamp: '2024-01-15T10:30:00Z',
  organizationId: 'org123'
}
```

#### issue:updated

Emitted when an issue is updated.

```typescript
socket.on("issue:updated", (payload) => {
  console.log("Issue updated:", payload);
});
```

**Payload:**

```typescript
{
  issue: { /* updated issue object */ },
  action: 'updated',
  changes: [
    {
      field: 'priority',
      oldValue: 'medium',
      newValue: 'high'
    },
    {
      field: 'status',
      oldValue: 'open',
      newValue: 'in_progress'
    }
  ],
  timestamp: '2024-01-15T10:35:00Z'
}
```

#### issue:resolved

Emitted when an issue is resolved.

```typescript
socket.on("issue:resolved", (payload) => {
  console.log("Issue resolved:", payload);
});
```

**Payload:**

```typescript
{
  issueId: 'issue123',
  resolvedBy: 'user456',
  resolvedAt: '2024-01-15T11:00:00Z',
  resolution: 'Fixed by maintenance team',
  organizationId: 'org123',
  action: 'resolved',
  timestamp: '2024-01-15T11:00:00Z'
}
```

#### issue:deleted

Emitted when an issue is deleted.

```typescript
socket.on("issue:deleted", (payload) => {
  console.log("Issue deleted:", payload);
});
```

**Payload:**

```typescript
{
  issueId: 'issue123',
  deletedBy: 'user789',
  organizationId: 'org123',
  action: 'deleted',
  timestamp: '2024-01-15T11:15:00Z'
}
```

#### issue:assigned

Emitted when an issue is assigned.

```typescript
socket.on("issue:assigned", (payload) => {
  console.log("Issue assigned:", payload);
});
```

**Payload:**

```typescript
{
  issueId: 'issue123',
  assignedTo: 'user456',
  assignedBy: 'user123',
  affectedUsers: ['user456'],
  organizationId: 'org123',
  action: 'assigned',
  timestamp: '2024-01-15T10:45:00Z'
}
```

#### heatmap:updated

Emitted when the heatmap needs to be refreshed.

```typescript
socket.on("heatmap:updated", (payload) => {
  console.log("Heatmap updated:", payload);
});
```

**Payload:**

```typescript
{
  organizationId: 'org123',
  changeType: 'issue_added' | 'issue_updated' | 'issue_resolved',
  affectedRegion: {
    lat: 14.5995,
    lng: 120.9842,
    radius: 500
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

#### stats:updated

Emitted when organization statistics change.

```typescript
socket.on("stats:updated", (payload) => {
  console.log("Stats updated:", payload);
});
```

**Payload:**

```typescript
{
  organizationId: 'org123',
  stats: {
    totalIssues: 150,
    openIssues: 45,
    inProgressIssues: 30,
    resolvedIssues: 75,
    averageResolutionTime: 86400, // seconds
    criticalIssues: 5
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

---

## SSE API

### Base URL

```
GET /api/realtime
```

All SSE endpoints require authentication via JWT token in query parameter or Authorization header.

### Endpoints

#### GET /api/realtime/heatmap/stream

Stream real-time heatmap updates.

**Query Parameters:**

| Parameter      | Type     | Required | Description                            |
| -------------- | -------- | -------- | -------------------------------------- |
| organizationId | string   | Yes      | Organization ID                        |
| campusId       | string   | No       | Filter by campus                       |
| buildingIds    | string[] | No       | Filter by buildings (comma-separated)  |
| categories     | string[] | No       | Filter by categories (comma-separated) |
| updateInterval | number   | No       | Update interval in ms (default: 30000) |
| token          | string   | Yes\*    | JWT token (\*if not in header)         |

**Example:**

```bash
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3001/api/realtime/heatmap/stream?organizationId=org123&campusId=campus456&updateInterval=15000&token=YOUR_JWT_TOKEN"
```

**Event Stream:**

```
event: message
data: {"type":"initial","data":{"type":"FeatureCollection","features":[...]}}

event: message
data: {"type":"update","data":{"type":"FeatureCollection","features":[...]}}

event: message
data: {"type":"heartbeat","timestamp":"2024-01-15T10:30:00Z"}
```

**Response Format:**

```typescript
// Initial data
{
  type: 'initial',
  data: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [120.9842, 14.5995]
        },
        properties: {
          issueId: 'issue123',
          weight: 0.85,
          priority: 'high',
          severity: 0.9,
          timeDecay: 0.95,
          category: 'water',
          title: 'Broken water fountain'
        }
      }
    ],
    metadata: {
      totalIssues: 45,
      totalWeight: 38.5,
      center: { lat: 14.5995, lng: 120.9842 },
      bounds: {
        north: 14.6100,
        south: 14.5890,
        east: 120.9950,
        west: 120.9730
      },
      timestamp: '2024-01-15T10:30:00Z'
    }
  }
}

// Subsequent updates
{
  type: 'update',
  data: { /* same structure as initial */ }
}

// Heartbeat (every 30 seconds)
{
  type: 'heartbeat',
  timestamp: '2024-01-15T10:30:00Z'
}
```

#### GET /api/realtime/issues/stream

Stream real-time issue updates.

**Query Parameters:**

| Parameter      | Type     | Required | Description          |
| -------------- | -------- | -------- | -------------------- |
| organizationId | string   | Yes      | Organization ID      |
| campusId       | string   | No       | Filter by campus     |
| buildingId     | string   | No       | Filter by building   |
| priorities     | string[] | No       | Filter by priorities |
| statuses       | string[] | No       | Filter by statuses   |
| token          | string   | Yes\*    | JWT token            |

**Example:**

```bash
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3001/api/realtime/issues/stream?organizationId=org123&priorities=high,critical&token=YOUR_JWT_TOKEN"
```

**Event Stream:**

```
event: message
data: {"type":"initial","data":[{"id":"issue123","title":"Broken fountain",...}]}

event: message
data: {"type":"created","data":{"id":"issue124","title":"New issue",...}}

event: message
data: {"type":"updated","data":{"id":"issue123","priority":"critical",...}}

event: message
data: {"type":"deleted","data":{"id":"issue125"}}
```

**Response Format:**

```typescript
// Initial issue list
{
  type: 'initial',
  data: [
    {
      id: 'issue123',
      title: 'Broken water fountain',
      description: '...',
      priority: 'high',
      status: 'open',
      location: { lat: 14.5995, lng: 120.9842 },
      // ... other issue fields
    }
  ]
}

// New issue created
{
  type: 'created',
  data: { /* full issue object */ }
}

// Issue updated
{
  type: 'updated',
  data: { /* full updated issue object */ }
}

// Issue deleted
{
  type: 'deleted',
  data: { id: 'issue123' }
}
```

#### GET /api/realtime/stats

Get real-time connection statistics.

**Query Parameters:**

| Parameter      | Type   | Required | Description            |
| -------------- | ------ | -------- | ---------------------- |
| organizationId | string | No       | Filter by organization |
| token          | string | Yes\*    | JWT token              |

**Example:**

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3001/api/realtime/stats?organizationId=org123"
```

**Response:**

```json
{
  "websocket": {
    "totalConnections": 45,
    "rooms": {
      "org:org123": 12,
      "campus:campus456": 8,
      "building:building789": 5,
      "heatmap:org123": 15
    }
  },
  "sse": {
    "totalConnections": 23,
    "heatmapStreams": 10,
    "issueStreams": 13
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Authentication

All real-time endpoints require JWT authentication.

### WebSocket Authentication

```javascript
const socket = io("http://localhost:3001", {
  auth: { token: "your-jwt-token" },
});

// Or authenticate after connection
socket.emit("authenticate", { token: "your-jwt-token" });
```

### SSE Authentication

**Option 1: Query Parameter**

```
GET /api/realtime/heatmap/stream?token=your-jwt-token&organizationId=org123
```

**Option 2: Authorization Header**

```bash
curl -H "Authorization: Bearer your-jwt-token" \
  "http://localhost:3001/api/realtime/heatmap/stream?organizationId=org123"
```

### Token Requirements

- Must be valid Firebase JWT token
- Must include `organizationId` claim
- Must not be expired
- User must have access to requested resources

---

## Event Types

### Issue Events

| Event          | Trigger                | Payload Includes            |
| -------------- | ---------------------- | --------------------------- |
| issue:created  | New issue created      | Full issue object           |
| issue:updated  | Issue fields modified  | Updated issue + change list |
| issue:resolved | Issue marked resolved  | Resolution details          |
| issue:deleted  | Issue removed          | Issue ID only               |
| issue:assigned | Issue assigned to user | Assignment details          |

### Heatmap Events

| Event           | Trigger                      | Payload Includes             |
| --------------- | ---------------------------- | ---------------------------- |
| heatmap:updated | Issue change affects heatmap | Change type, affected region |

### Stats Events

| Event         | Trigger                     | Payload Includes   |
| ------------- | --------------------------- | ------------------ |
| stats:updated | Organization metrics change | Updated statistics |

---

## Room Subscriptions

WebSocket clients can subscribe to specific rooms for filtered updates.

### Room Types

| Room Format     | Description                  | Example                |
| --------------- | ---------------------------- | ---------------------- |
| `org:{id}`      | All updates for organization | `org:org123`           |
| `campus:{id}`   | Campus-specific updates      | `campus:campus456`     |
| `building:{id}` | Building-specific updates    | `building:building789` |
| `heatmap:{id}`  | Heatmap updates only         | `heatmap:org123`       |
| `user:{id}`     | User-specific notifications  | `user:user123`         |

### Subscription Hierarchy

```
Organization (org:org123)
├── Campus A (campus:campus456)
│   ├── Building 1 (building:building789)
│   └── Building 2 (building:building790)
└── Campus B (campus:campus457)
    └── Building 3 (building:building791)
```

Subscribing to a parent room automatically includes all child updates.

---

## Error Codes

### WebSocket Errors

| Code              | Message                  | Description               |
| ----------------- | ------------------------ | ------------------------- |
| AUTH_REQUIRED     | Authentication required  | Token not provided        |
| AUTH_INVALID      | Invalid token            | Token verification failed |
| ROOM_NOT_FOUND    | Room does not exist      | Invalid room identifier   |
| PERMISSION_DENIED | Insufficient permissions | User lacks access rights  |
| RATE_LIMIT        | Too many requests        | Rate limit exceeded       |

### SSE Errors

SSE errors are sent as special event messages:

```
event: error
data: {"code":"AUTH_INVALID","message":"Invalid token"}
```

### HTTP Status Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not found             |
| 429  | Too many requests     |
| 500  | Internal server error |

---

## Rate Limits

### WebSocket

- **Connection**: 5 connections per user per organization
- **Subscriptions**: 10 active subscriptions per connection
- **Events**: 100 events per minute per connection

### SSE

- **Connections**: 3 concurrent streams per user per organization
- **Updates**: Minimum 5 second interval between heatmap updates

### Exceeded Limits

When rate limits are exceeded:

- WebSocket: Connection may be throttled or temporarily disconnected
- SSE: HTTP 429 response, retry after N seconds

---

## Best Practices

### 1. Connection Management

```typescript
// ✅ Good: Single connection per organization
const socket = io(BACKEND_URL, { auth: { token } });
socket.emit("subscribe:organization", { organizationId });

// ❌ Bad: Multiple connections for same data
const socket1 = io(BACKEND_URL);
const socket2 = io(BACKEND_URL);
```

### 2. Subscription Strategy

```typescript
// ✅ Good: Subscribe to broadest applicable scope
socket.emit("subscribe:campus", { campusId: "campus456" });

// ❌ Bad: Over-subscribing to narrow scopes
buildings.forEach((b) => {
  socket.emit("subscribe:building", { buildingId: b.id });
});
```

### 3. Error Handling

```typescript
// ✅ Good: Implement reconnection logic
socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    socket.connect(); // Manual reconnection
  }
});

socket.on("connect_error", (error) => {
  console.error("Connection failed:", error);
  // Implement exponential backoff
});
```

### 4. Memory Management

```typescript
// ✅ Good: Clean up listeners
useEffect(() => {
  socket.on("issue:created", handleIssueCreated);

  return () => {
    socket.off("issue:created", handleIssueCreated);
  };
}, []);
```

### 5. Data Validation

```typescript
// ✅ Good: Validate incoming data
socket.on("issue:created", (payload) => {
  if (!payload?.issue?.id) {
    console.error("Invalid payload");
    return;
  }
  handleNewIssue(payload.issue);
});
```

---

## Examples

### Complete WebSocket Example

```typescript
import { io } from "socket.io-client";

const token = "your-jwt-token";
const organizationId = "org123";

// Initialize connection
const socket = io("http://localhost:3001", {
  auth: { token },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection events
socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // Subscribe to organization updates
  socket.emit("subscribe:organization", { organizationId });
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});

// Issue events
socket.on("issue:created", (payload) => {
  console.log("New issue:", payload.issue);
  addIssueToList(payload.issue);
  showNotification(`New issue: ${payload.issue.title}`);
});

socket.on("issue:updated", (payload) => {
  console.log("Issue updated:", payload.issue);
  updateIssueInList(payload.issue);
});

socket.on("heatmap:updated", (payload) => {
  console.log("Heatmap changed:", payload.changeType);
  refreshHeatmap();
});

// Cleanup
window.addEventListener("beforeunload", () => {
  socket.disconnect();
});
```

### Complete SSE Example

```typescript
const token = "your-jwt-token";
const organizationId = "org123";

const eventSource = new EventSource(
  `http://localhost:3001/api/realtime/heatmap/stream?organizationId=${organizationId}&token=${token}`
);

eventSource.onopen = () => {
  console.log("SSE connection opened");
};

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "initial" || data.type === "update") {
    updateHeatmapLayer(data.data);
  }
};

eventSource.onerror = (error) => {
  console.error("SSE error:", error);
  eventSource.close();

  // Retry after 5 seconds
  setTimeout(() => {
    location.reload();
  }, 5000);
};

// Cleanup
window.addEventListener("beforeunload", () => {
  eventSource.close();
});
```

---

## Troubleshooting

### Connection Issues

**Problem**: WebSocket connection fails

```
Solution: Check CORS settings, verify token, ensure firewall allows WebSocket
```

**Problem**: SSE stream disconnects frequently

```
Solution: Increase timeout, check network stability, implement retry logic
```

### Performance Issues

**Problem**: Too many events causing lag

```
Solution: Implement throttling, use batching, subscribe to narrower scopes
```

**Problem**: High memory usage

```
Solution: Clean up listeners, limit stored data, use pagination
```

### Authentication Issues

**Problem**: 401 Unauthorized

```
Solution: Refresh JWT token, verify token format, check expiration
```

---

## Support

For additional help:

- Backend API: [http://localhost:3001/api](http://localhost:3001/api)
- Health Check: [http://localhost:3001/health](http://localhost:3001/health)
- Documentation: [README.md](../README.md)
