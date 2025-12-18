# Real-time System Architecture

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │   WebSocket     │         │   SSE Client    │                │
│  │   (Socket.IO)   │         │  (EventSource)  │                │
│  └────────┬────────┘         └────────┬────────┘                │
│           │                           │                          │
│           │ Bidirectional             │ Unidirectional          │
│           │ (instant events)          │ (streaming data)        │
└───────────┼───────────────────────────┼──────────────────────────┘
            │                           │
            │                           │
┌───────────┼───────────────────────────┼──────────────────────────┐
│           │      SERVER LAYER         │                          │
├───────────┼───────────────────────────┼──────────────────────────┤
│           │                           │                          │
│           ▼                           ▼                          │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │  WebSocket      │         │  SSE Service    │                │
│  │  Service        │         │                 │                │
│  │  (Socket.IO)    │         │  • Heatmap      │                │
│  │                 │         │    Stream       │                │
│  │  • Rooms        │         │  • Issue        │                │
│  │  • Auth         │         │    Stream       │                │
│  │  • Events       │         │  • Stats        │                │
│  └────────┬────────┘         └────────┬────────┘                │
│           │                           │                          │
│           └────────────┬──────────────┘                          │
│                        │                                         │
│                        ▼                                         │
│           ┌────────────────────────┐                            │
│           │   Real-time Routes     │                            │
│           │  /api/realtime/*       │                            │
│           └────────────┬───────────┘                            │
│                        │                                         │
└────────────────────────┼──────────────────────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────────────────────┐
│                        │   BUSINESS LOGIC LAYER                   │
├────────────────────────┼──────────────────────────────────────────┤
│                        ▼                                         │
│           ┌────────────────────────┐                            │
│           │   Issue Service        │                            │
│           │                        │                            │
│           │  • createIssue()   ──┐ │                            │
│           │  • updateIssue()   ──┤ │                            │
│           │  • resolveIssue()  ──┤ │ Emit Events                │
│           │  • assignIssue()   ──┤ │                            │
│           │  • deleteIssue()   ──┘ │                            │
│           └────────────┬───────────┘                            │
│                        │                                         │
└────────────────────────┼──────────────────────────────────────────┘
                         │
┌────────────────────────┼──────────────────────────────────────────┐
│                        │   DATA LAYER                             │
├────────────────────────┼──────────────────────────────────────────┤
│                        ▼                                         │
│           ┌────────────────────────┐                            │
│           │   Firestore Database   │                            │
│           │                        │                            │
│           │  • Issues Collection   │                            │
│           │  • Organizations       │                            │
│           │  • Buildings           │                            │
│           └────────────────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Event Flow Diagram

```
┌──────────────┐
│ User Action  │
│ (Frontend)   │
└──────┬───────┘
       │
       │ HTTP Request
       ▼
┌──────────────────────┐
│ Issue Controller     │
│ (REST Endpoint)      │
└──────┬───────────────┘
       │
       │ Call Service Method
       ▼
┌──────────────────────┐
│ Issue Service        │
│ • createIssue()      │
│ • updateIssue()      │
│ • resolveIssue()     │
└──────┬───────────────┘
       │
       ├─────────────────────┬─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐   ┌──────────────────┐   ┌─────────────┐
│  Firestore   │   │  WebSocket       │   │  SSE        │
│  Update      │   │  Emit            │   │  Broadcast  │
└──────────────┘   └──────┬───────────┘   └──────┬──────┘
                          │                      │
                          │                      │
    ┌─────────────────────┴──────────────────────┴───────┐
    │                                                     │
    ▼                                                     ▼
┌────────────────────┐                        ┌──────────────────┐
│ WebSocket Rooms    │                        │ SSE Clients      │
│                    │                        │                  │
│ • org:org123       │                        │ • Heatmap        │
│ • campus:campus456 │                        │   Subscribers    │
│ • building:bldg789 │                        │ • Issue List     │
│ • heatmap:org123   │                        │   Subscribers    │
└────────┬───────────┘                        └─────────┬────────┘
         │                                              │
         │ Emit to subscribers                          │ Push update
         ▼                                              ▼
┌─────────────────────┐                      ┌──────────────────┐
│ Connected Clients   │                      │ Streaming        │
│ (WebSocket)         │                      │ Clients          │
│                     │                      │ (EventSource)    │
│ • Dashboard         │                      │                  │
│ • Mobile App        │                      │ • Live Map       │
│ • Admin Panel       │                      │ • Dashboards     │
└─────────────────────┘                      └──────────────────┘
```

---

## WebSocket Room Hierarchy

```
Organization Level
├── org:org123
│   ├── All organization events
│   └── Stats updates
│
Campus Level
├── campus:campus456
│   ├── Campus-specific issues
│   └── Campus heatmap updates
│
Building Level
├── building:bldg789
│   ├── Building-specific issues
│   └── Maintenance alerts
│
Specialized Rooms
└── heatmap:org123
    └── Heatmap-only updates
```

---

## Event Type Matrix

```
┌─────────────────────┬──────────┬─────────┬────────────────────┐
│ Event Type          │ Protocol │ Room    │ Trigger            │
├─────────────────────┼──────────┼─────────┼────────────────────┤
│ issue:created       │ WS       │ org/*   │ createIssue()      │
│ issue:updated       │ WS       │ org/*   │ updateIssue()      │
│ issue:resolved      │ WS       │ org/*   │ resolveIssue()     │
│ issue:deleted       │ WS       │ org/*   │ deleteIssue()      │
│ issue:assigned      │ WS       │ org/*   │ assignIssue()      │
│ heatmap:updated     │ WS       │ heatmap │ issue change       │
│ stats:updated       │ WS       │ org/*   │ stats change       │
├─────────────────────┼──────────┼─────────┼────────────────────┤
│ heatmap stream      │ SSE      │ N/A     │ periodic + changes │
│ issue stream        │ SSE      │ N/A     │ issue operations   │
└─────────────────────┴──────────┴─────────┴────────────────────┘

WS = WebSocket (bidirectional)
SSE = Server-Sent Events (unidirectional)
```

---

## Data Flow: Issue Creation

```
1. User submits issue
   │
   ▼
2. POST /api/issues
   │
   ▼
3. IssueController.createIssue()
   │
   ▼
4. IssueService.createIssue()
   │
   ├─► Firestore: Save issue document
   │   └─► Returns: Saved issue
   │
   ├─► WebSocket: Emit events
   │   ├─► issue:created → org:org123, campus:campus456, building:bldg789
   │   └─► heatmap:updated → heatmap:org123
   │
   └─► SSE: Broadcast updates
       ├─► Organization clients
       ├─► Campus clients
       └─► Building clients

5. Response: 201 Created
   │
   ▼
6. Real-time updates delivered
   │
   ├─► WebSocket clients receive event immediately
   └─► SSE clients receive in next stream message
```

---

## Subscription Model

```
Client connects
     │
     ▼
Authenticate with JWT
     │
     ├─── Valid token?
     │    │
     │    ├─── Yes ─┐
     │    │         │
     │    └─── No ──┴─► Disconnect
     │
     ▼
Subscribe to rooms
     │
     ├─► Organization level
     │   └─► Receives ALL events
     │
     ├─► Campus level
     │   └─► Receives campus + building events
     │
     ├─► Building level
     │   └─► Receives building events only
     │
     └─► Heatmap only
         └─► Receives heatmap updates only
```

---

## Scaling Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│              (Sticky Sessions Enabled)                   │
└────────────┬──────────────┬──────────────┬──────────────┘
             │              │              │
    ┌────────▼────┐  ┌──────▼──────┐  ┌───▼──────────┐
    │  Server 1   │  │  Server 2   │  │  Server 3    │
    │             │  │             │  │              │
    │ WebSocket   │  │ WebSocket   │  │ WebSocket    │
    │ SSE         │  │ SSE         │  │ SSE          │
    └──────┬──────┘  └──────┬──────┘  └──────┬───────┘
           │                │                 │
           └────────────────┼─────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Redis Adapter │
                    │  (Socket.IO)   │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │   Firestore    │
                    └────────────────┘

Notes:
• Sticky sessions ensure WebSocket connections stay on same server
• Redis adapter syncs events across server instances
• Each server maintains own SSE connections
• Horizontal scaling supported
```

---

## Security Flow

```
┌─────────────────┐
│ Client Request  │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│ JWT Token Present? │
└────────┬───────────┘
         │
    ┌────┴─────┐
    │          │
   Yes        No
    │          │
    ▼          ▼
┌────────┐  ┌──────────┐
│ Verify │  │  Reject  │
│ Token  │  │  (401)   │
└───┬────┘  └──────────┘
    │
    ├─── Valid?
    │     │
    │     ├─── Yes ─┐
    │     │         │
    │     └─── No ──┴─► Reject (401)
    │
    ▼
┌──────────────────────┐
│ Extract Claims       │
│ • userId             │
│ • organizationId     │
│ • role               │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Check Permissions    │
│ • Can access org?    │
│ • Can view issues?   │
└────────┬─────────────┘
         │
    ┌────┴─────┐
    │          │
   Yes        No
    │          │
    ▼          ▼
┌────────┐  ┌──────────┐
│ Allow  │  │  Reject  │
│ Access │  │  (403)   │
└────────┘  └──────────┘
```

---

## Performance Characteristics

```
┌────────────────────┬─────────────┬──────────────┐
│ Metric             │ WebSocket   │ SSE          │
├────────────────────┼─────────────┼──────────────┤
│ Connection Setup   │ ~50ms       │ ~20ms        │
│ Event Latency      │ <50ms       │ <100ms       │
│ Throughput         │ Very High   │ High         │
│ CPU Usage          │ Low         │ Very Low     │
│ Memory/Connection  │ ~50KB       │ ~30KB        │
│ Max Connections    │ 10,000+     │ 5,000+       │
│ Reconnect Time     │ Auto (1s)   │ Manual (3s)  │
└────────────────────┴─────────────┴──────────────┘

Assumptions:
• Node.js 18+
• 4 CPU cores
• 8GB RAM
• Local network
```

---

## Error Handling Flow

```
Service Operation
     │
     ├─► Try: Execute operation
     │   └─► Firestore update
     │
     ├─► Try: Emit WebSocket events
     │   ├─── Success ─► Continue
     │   └─── Error ───► Log + Continue
     │
     ├─► Try: Broadcast SSE
     │   ├─── Success ─► Continue
     │   └─── Error ───► Log + Continue
     │
     └─► Return: Operation result

Note: Real-time failures don't affect core operation
```

---

## Monitoring Points

```
┌─────────────────────────────────────────────────────────┐
│                   Metrics to Monitor                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  WebSocket Metrics                                       │
│  ├─ Active connections                                   │
│  ├─ Connection rate (per second)                        │
│  ├─ Disconnection rate                                  │
│  ├─ Events emitted (per second)                         │
│  ├─ Room subscriber count                               │
│  └─ Average event latency                               │
│                                                          │
│  SSE Metrics                                            │
│  ├─ Active streams                                      │
│  ├─ Heatmap subscribers                                 │
│  ├─ Issue stream subscribers                            │
│  ├─ Messages sent (per second)                          │
│  ├─ Stream errors                                       │
│  └─ Average message size                                │
│                                                          │
│  System Metrics                                         │
│  ├─ CPU usage                                           │
│  ├─ Memory usage                                        │
│  ├─ Network throughput                                  │
│  ├─ Response time                                       │
│  └─ Error rate                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

```
┌────────────────────────────────────────┐
│           Frontend Stack                │
├────────────────────────────────────────┤
│ • React 18                             │
│ • Socket.IO Client 4.x                 │
│ • EventSource API (native)             │
│ • TypeScript 5.x                       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│           Backend Stack                 │
├────────────────────────────────────────┤
│ • Node.js 18+                          │
│ • Express 4.x                          │
│ • Socket.IO 4.8+                       │
│ • TypeScript 5.x                       │
│ • Firebase Admin SDK                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│           Data Layer                    │
├────────────────────────────────────────┤
│ • Firestore                            │
│ • Redis (for scaling)                  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│           Protocols                     │
├────────────────────────────────────────┤
│ • WebSocket (bidirectional)            │
│ • Server-Sent Events (streaming)       │
│ • HTTP/HTTPS (REST)                    │
└────────────────────────────────────────┘
```

---

This architecture provides:
✅ Real-time bidirectional communication (WebSocket)  
✅ Efficient streaming updates (SSE)  
✅ Scalable room-based filtering  
✅ Error-resilient event emission  
✅ Multi-protocol support  
✅ Horizontal scaling ready
