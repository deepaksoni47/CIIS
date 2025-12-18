# Real-time System Quick Reference

Quick reference guide for the CIIS real-time update system.

## 🎯 What's Included

The real-time system provides:

✅ **WebSocket (Socket.IO)** - Bidirectional instant notifications  
✅ **SSE (Server-Sent Events)** - Unidirectional streaming updates  
✅ **Automatic Event Emission** - All issue operations trigger real-time updates  
✅ **Room-based Filtering** - Subscribe to organization/campus/building levels  
✅ **Heatmap Auto-sync** - Maps update automatically on issue changes

---

## 📡 Protocols Comparison

| Feature               | WebSocket           | SSE                          |
| --------------------- | ------------------- | ---------------------------- |
| **Direction**         | Bidirectional       | Server → Client only         |
| **Protocol**          | WS/WSS              | HTTP/HTTPS                   |
| **Reconnection**      | Built-in            | Manual implementation needed |
| **Browser Support**   | Excellent           | Good (not IE)                |
| **Firewall Friendly** | Sometimes blocked   | Always works                 |
| **Best For**          | Chat, notifications | Dashboards, feeds            |

---

## 🔌 WebSocket Quick Start

### Client Setup (React)

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  auth: { token: "your-jwt-token" },
});

// Subscribe to organization
socket.emit("subscribe:organization", {
  organizationId: "org123",
});

// Listen for new issues
socket.on("issue:created", (payload) => {
  console.log("New issue:", payload.issue);
});

// Listen for heatmap updates
socket.on("heatmap:updated", () => {
  refreshHeatmap();
});
```

### Events You Can Listen To

```typescript
"issue:created"; // New issue added
"issue:updated"; // Issue modified
"issue:resolved"; // Issue marked resolved
"issue:deleted"; // Issue removed
"issue:assigned"; // Issue assigned to user
"heatmap:updated"; // Heatmap data changed
"stats:updated"; // Organization stats changed
```

---

## 📊 SSE Quick Start

### Heatmap Stream

```typescript
const eventSource = new EventSource(
  "/api/realtime/heatmap/stream?organizationId=org123&token=JWT_TOKEN"
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "initial" || data.type === "update") {
    updateHeatmap(data.data); // GeoJSON FeatureCollection
  }
};
```

### Issue Stream

```typescript
const eventSource = new EventSource(
  "/api/realtime/issues/stream?organizationId=org123&priorities=high,critical&token=JWT_TOKEN"
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "initial":
      setIssues(data.data);
      break;
    case "created":
      addIssue(data.data);
      break;
    case "updated":
      updateIssue(data.data);
      break;
    case "deleted":
      removeIssue(data.data.id);
      break;
  }
};
```

---

## 🎣 React Hooks

### useWebSocket Hook

```typescript
const { isConnected, socket } = useWebSocket({
  token: authToken,
  organizationId: 'org123',
  onIssueCreated: (payload) => {
    addIssueToList(payload.issue);
    showNotification('New issue!');
  },
  onHeatmapUpdated: () => {
    refreshHeatmap();
  }
});

return (
  <div>
    Status: {isConnected ? '🟢 Live' : '🔴 Offline'}
  </div>
);
```

### useHeatmapStream Hook

```typescript
const { heatmapData, lastUpdate, isConnected } = useHeatmapStream({
  organizationId: "org123",
  campusId: "campus456",
  token: authToken,
  updateInterval: 30000, // 30 seconds
});

useEffect(() => {
  if (heatmapData) {
    renderHeatmapLayer(heatmapData.features);
  }
}, [heatmapData]);
```

---

## 🔐 Authentication

All endpoints require JWT authentication.

### WebSocket

```javascript
// Option 1: Connection auth
const socket = io("http://localhost:3001", {
  auth: { token: "your-jwt-token" },
});

// Option 2: Post-connection auth
socket.emit("authenticate", { token: "your-jwt-token" });
```

### SSE

```javascript
// Option 1: Query parameter
const url = `/api/realtime/heatmap/stream?organizationId=org123&token=${token}`;

// Option 2: Authorization header (preferred)
fetch(url, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "text/event-stream",
  },
});
```

---

## 🏢 Room Subscriptions

Subscribe to specific scopes for filtered updates:

```typescript
// Organization level (all updates)
socket.emit("subscribe:organization", { organizationId: "org123" });

// Campus level
socket.emit("subscribe:campus", {
  organizationId: "org123",
  campusId: "campus456",
});

// Building level
socket.emit("subscribe:building", {
  organizationId: "org123",
  buildingId: "building789",
});

// Heatmap only
socket.emit("subscribe:heatmap", { organizationId: "org123" });

// Unsubscribe
socket.emit("unsubscribe", { room: "org:org123" });
```

---

## 📋 API Endpoints

### SSE Streaming Endpoints

| Endpoint                       | Method | Description               |
| ------------------------------ | ------ | ------------------------- |
| `/api/realtime/heatmap/stream` | GET    | Stream heatmap updates    |
| `/api/realtime/issues/stream`  | GET    | Stream issue list updates |
| `/api/realtime/stats`          | GET    | Get connection statistics |

### Query Parameters

**Heatmap Stream:**

```
?organizationId=org123
&campusId=campus456
&buildingIds=b1,b2
&categories=water,electrical
&updateInterval=30000
&token=JWT_TOKEN
```

**Issue Stream:**

```
?organizationId=org123
&campusId=campus456
&buildingId=building789
&priorities=high,critical
&statuses=open,in_progress
&token=JWT_TOKEN
```

---

## 🎨 Component Examples

### Live Issue List

```typescript
export const LiveIssueList = () => {
  const [issues, setIssues] = useState<Issue[]>([]);

  useWebSocket({
    token: authToken,
    organizationId,
    onIssueCreated: (p) => setIssues(prev => [p.issue, ...prev]),
    onIssueUpdated: (p) => setIssues(prev =>
      prev.map(i => i.id === p.issue.id ? p.issue : i)
    ),
    onIssueDeleted: (p) => setIssues(prev =>
      prev.filter(i => i.id !== p.issueId)
    )
  });

  return (
    <div>
      {issues.map(issue => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
};
```

### Live Heatmap

```typescript
export const LiveHeatmap = () => {
  const { heatmapData, isConnected } = useHeatmapStream({
    organizationId,
    token: authToken,
    updateInterval: 30000
  });

  return (
    <div>
      <StatusBadge connected={isConnected} />
      <Map>
        {heatmapData && (
          <HeatmapLayer data={heatmapData.features} />
        )}
      </Map>
    </div>
  );
};
```

---

## ⚡ Event Payload Examples

### issue:created

```json
{
  "issue": {
    "id": "issue123",
    "title": "Broken water fountain",
    "priority": "high",
    "status": "open",
    "location": { "lat": 14.5995, "lng": 120.9842 }
  },
  "action": "created",
  "timestamp": "2024-01-15T10:30:00Z",
  "organizationId": "org123"
}
```

### heatmap:updated

```json
{
  "organizationId": "org123",
  "changeType": "issue_added",
  "affectedRegion": {
    "lat": 14.5995,
    "lng": 120.9842,
    "radius": 500
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### SSE Heatmap Update

```json
{
  "type": "update",
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [120.9842, 14.5995]
        },
        "properties": {
          "issueId": "issue123",
          "weight": 0.85,
          "priority": "high",
          "timeDecay": 0.95
        }
      }
    ],
    "metadata": {
      "totalIssues": 45,
      "totalWeight": 38.5,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## ❌ Error Handling

### Connection Errors

```typescript
socket.on("connect_error", (error) => {
  console.error("Connection failed:", error);
  // Show error to user
  showErrorNotification("Connection lost");
});

socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    // Server disconnected, manual reconnection needed
    socket.connect();
  }
  // Auto-reconnect for other reasons
});
```

### SSE Errors

```typescript
eventSource.onerror = (error) => {
  console.error("SSE error:", error);
  eventSource.close();

  // Exponential backoff
  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
  setTimeout(() => connectSSE(), delay);
};
```

---

## 🔄 Backend Integration

Real-time events are automatically emitted when:

```typescript
// Create issue
const issue = await issueService.createIssue(data);
// ✅ Emits: issue:created, heatmap:updated

// Update issue
await issueService.updateIssue(issueId, updates);
// ✅ Emits: issue:updated, heatmap:updated (if location/priority changed)

// Resolve issue
await issueService.resolveIssue(issueId, resolution);
// ✅ Emits: issue:resolved, heatmap:updated

// Assign issue
await issueService.assignIssue(issueId, userId);
// ✅ Emits: issue:assigned

// Delete issue
await issueService.deleteIssue(issueId);
// ✅ Emits: issue:deleted, heatmap:updated
```

No additional code needed - events are automatically triggered!

---

## 📊 Server Status

Check real-time service status:

```bash
GET /api/realtime/stats
```

**Response:**

```json
{
  "websocket": {
    "totalConnections": 45,
    "rooms": {
      "org:org123": 12,
      "campus:campus456": 8
    }
  },
  "sse": {
    "totalConnections": 23,
    "heatmapStreams": 10,
    "issueStreams": 13
  }
}
```

---

## 🚦 Rate Limits

| Resource                            | Limit     |
| ----------------------------------- | --------- |
| WebSocket connections per user      | 5         |
| Active subscriptions per connection | 10        |
| Events per minute per connection    | 100       |
| SSE concurrent streams per user     | 3         |
| Min heatmap update interval         | 5 seconds |

---

## ✅ Best Practices

### 1. Single Connection Per Organization

```typescript
// ✅ Good
const socket = initializeWebSocket(token);
socket.emit("subscribe:organization", { organizationId });

// ❌ Bad
buildings.forEach((b) => {
  const socket = io(url);
  socket.emit("subscribe:building", { buildingId: b.id });
});
```

### 2. Clean Up Listeners

```typescript
useEffect(() => {
  socket.on("issue:created", handleCreate);

  return () => {
    socket.off("issue:created", handleCreate);
  };
}, []);
```

### 3. Handle Reconnection

```typescript
const socket = io(url, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### 4. Implement Fallback

```typescript
if (!socket.connected) {
  // Fall back to polling
  const interval = setInterval(fetchIssues, 5000);
}
```

### 5. Validate Data

```typescript
socket.on("issue:created", (payload) => {
  if (!payload?.issue?.id) {
    console.error("Invalid payload");
    return;
  }
  handleNewIssue(payload.issue);
});
```

---

## 🛠️ Testing

### Test WebSocket Connection

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:3001 --auth '{"token":"YOUR_JWT_TOKEN"}'

# Subscribe
{"event":"subscribe:organization","data":{"organizationId":"org123"}}
```

### Test SSE Connection

```bash
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3001/api/realtime/heatmap/stream?organizationId=org123&token=YOUR_JWT_TOKEN"
```

---

## 📚 Full Documentation

- **[Complete API Documentation](./REALTIME_API.md)** - All endpoints, events, and parameters
- **[Frontend Integration Guide](./REALTIME_FRONTEND_INTEGRATION.md)** - React hooks and components
- **[Heatmap API Documentation](./HEATMAP_API.md)** - Heatmap endpoints and algorithms

---

## 🆘 Troubleshooting

| Issue                      | Solution                                 |
| -------------------------- | ---------------------------------------- |
| WebSocket won't connect    | Check CORS, verify token, check firewall |
| SSE disconnects frequently | Increase timeout, implement retry logic  |
| Too many events            | Throttle updates, use batching           |
| High memory usage          | Clean up listeners, limit stored data    |
| 401 Unauthorized           | Refresh JWT token, verify format         |

---

## 📞 Support

- Health Check: http://localhost:3001/health
- API Status: http://localhost:3001/api
- Stats: http://localhost:3001/api/realtime/stats

Server logs show:

```
⚡ WebSocket:   Enabled
📡 SSE:         Enabled
```

---

**Ready to go!** Start with the [Frontend Integration Guide](./REALTIME_FRONTEND_INTEGRATION.md) for step-by-step implementation.
