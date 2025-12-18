# Real-time System Testing Guide

Complete testing guide for WebSocket and SSE functionality.

## Table of Contents

1. [Manual Testing](#manual-testing)
2. [Integration Testing](#integration-testing)
3. [Load Testing](#load-testing)
4. [Frontend Testing](#frontend-testing)
5. [Troubleshooting](#troubleshooting)

---

## Manual Testing

### Prerequisites

```bash
# Install testing tools
npm install -g wscat
npm install -g artillery  # For load testing

# Ensure server is running
npm run dev
```

### Test 1: Server Health Check

```bash
# Check server status
curl http://localhost:3001/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Test 2: WebSocket Connection

```bash
# Connect to WebSocket
wscat -c ws://localhost:3001

# You should see:
# Connected (press CTRL+C to quit)
```

### Test 3: WebSocket with Authentication

```bash
# Get JWT token first (replace with your auth endpoint)
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# Connect with authentication
wscat -c "ws://localhost:3001" \
  --auth "{\"token\":\"$TOKEN\"}"

# After connection, send subscribe message:
{"event":"subscribe:organization","data":{"organizationId":"org123"}}

# Expected response:
{
  "success": true,
  "room": "org:org123",
  "subscriberCount": 1
}
```

### Test 4: SSE Heatmap Stream

```bash
# Stream heatmap updates
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3001/api/realtime/heatmap/stream?organizationId=org123&token=$TOKEN"

# Expected output (streaming):
event: message
data: {"type":"initial","data":{"type":"FeatureCollection","features":[...]}}

event: message
data: {"type":"heartbeat","timestamp":"2024-01-15T10:30:00Z"}

event: message
data: {"type":"update","data":{"type":"FeatureCollection","features":[...]}}
```

### Test 5: SSE Issue Stream

```bash
# Stream issue updates
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3001/api/realtime/issues/stream?organizationId=org123&priorities=high,critical&token=$TOKEN"

# Expected output:
event: message
data: {"type":"initial","data":[...]}

event: message
data: {"type":"created","data":{"id":"issue123",...}}
```

### Test 6: Connection Statistics

```bash
# Get real-time stats
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/realtime/stats?organizationId=org123"

# Expected response:
{
  "websocket": {
    "totalConnections": 5,
    "rooms": {
      "org:org123": 3,
      "campus:campus456": 2
    }
  },
  "sse": {
    "totalConnections": 8,
    "heatmapStreams": 3,
    "issueStreams": 5
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Integration Testing

### Test Suite 1: Issue Creation Flow

```typescript
// test/realtime/issue-creation.test.ts
import { io, Socket } from "socket.io-client";
import { createIssue } from "../services/issue-service";

describe("Real-time Issue Creation", () => {
  let socket: Socket;
  let receivedEvent: any;

  beforeAll(async () => {
    socket = io("http://localhost:3001", {
      auth: { token: process.env.TEST_TOKEN },
    });

    await new Promise((resolve) => socket.on("connect", resolve));

    socket.emit("subscribe:organization", {
      organizationId: "test-org",
    });
  });

  afterAll(() => {
    socket.disconnect();
  });

  it("should emit issue:created event when issue is created", async () => {
    // Set up listener
    const eventPromise = new Promise((resolve) => {
      socket.once("issue:created", (payload) => {
        receivedEvent = payload;
        resolve(payload);
      });
    });

    // Create issue via API
    const issueData = {
      title: "Test Issue",
      description: "Integration test",
      organizationId: "test-org",
      buildingId: "test-building",
      priority: "high",
      location: { lat: 14.5995, lng: 120.9842 },
    };

    await createIssue(issueData);

    // Wait for event
    await eventPromise;

    // Assertions
    expect(receivedEvent).toBeDefined();
    expect(receivedEvent.action).toBe("created");
    expect(receivedEvent.issue.title).toBe("Test Issue");
    expect(receivedEvent.organizationId).toBe("test-org");
  });

  it("should emit heatmap:updated event after issue creation", async () => {
    const eventPromise = new Promise((resolve) => {
      socket.once("heatmap:updated", (payload) => {
        resolve(payload);
      });
    });

    await createIssue({
      title: "Another Test",
      organizationId: "test-org",
      buildingId: "test-building",
      priority: "medium",
      location: { lat: 14.6, lng: 120.98 },
    });

    const payload: any = await eventPromise;

    expect(payload.changeType).toBe("issue_added");
    expect(payload.organizationId).toBe("test-org");
  });
});
```

### Test Suite 2: SSE Streaming

```typescript
// test/realtime/sse-streaming.test.ts
import fetch from "node-fetch";
import { EventSource } from "eventsource";

describe("SSE Streaming", () => {
  let eventSource: EventSource;
  let receivedMessages: any[] = [];

  beforeEach(() => {
    receivedMessages = [];
  });

  afterEach(() => {
    if (eventSource) {
      eventSource.close();
    }
  });

  it("should receive initial heatmap data", (done) => {
    const url = `http://localhost:3001/api/realtime/heatmap/stream?organizationId=test-org&token=${process.env.TEST_TOKEN}`;

    eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      receivedMessages.push(data);

      if (data.type === "initial") {
        expect(data.data.type).toBe("FeatureCollection");
        expect(data.data.features).toBeDefined();
        expect(data.data.metadata).toBeDefined();
        eventSource.close();
        done();
      }
    };

    eventSource.onerror = (error) => {
      eventSource.close();
      done(error);
    };
  }, 10000);

  it("should receive heartbeat messages", (done) => {
    const url = `http://localhost:3001/api/realtime/heatmap/stream?organizationId=test-org&updateInterval=5000&token=${process.env.TEST_TOKEN}`;

    eventSource = new EventSource(url);

    const timeout = setTimeout(() => {
      const heartbeats = receivedMessages.filter((m) => m.type === "heartbeat");
      expect(heartbeats.length).toBeGreaterThan(0);
      eventSource.close();
      done();
    }, 35000); // Wait 35 seconds to receive at least one heartbeat

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      receivedMessages.push(data);
    };

    eventSource.onerror = () => {
      clearTimeout(timeout);
      eventSource.close();
      done(new Error("SSE connection error"));
    };
  }, 40000);
});
```

### Test Suite 3: Room Subscriptions

```typescript
// test/realtime/room-subscriptions.test.ts
import { io, Socket } from "socket.io-client";

describe("Room Subscriptions", () => {
  let orgSocket: Socket;
  let campusSocket: Socket;
  let buildingSocket: Socket;

  beforeAll(async () => {
    const token = process.env.TEST_TOKEN;

    // Create three sockets for different subscription levels
    orgSocket = io("http://localhost:3001", { auth: { token } });
    campusSocket = io("http://localhost:3001", { auth: { token } });
    buildingSocket = io("http://localhost:3001", { auth: { token } });

    await Promise.all([
      new Promise((resolve) => orgSocket.on("connect", resolve)),
      new Promise((resolve) => campusSocket.on("connect", resolve)),
      new Promise((resolve) => buildingSocket.on("connect", resolve)),
    ]);

    // Subscribe to different levels
    orgSocket.emit("subscribe:organization", { organizationId: "test-org" });
    campusSocket.emit("subscribe:campus", {
      organizationId: "test-org",
      campusId: "test-campus",
    });
    buildingSocket.emit("subscribe:building", {
      organizationId: "test-org",
      buildingId: "test-building",
    });
  });

  afterAll(() => {
    orgSocket.disconnect();
    campusSocket.disconnect();
    buildingSocket.disconnect();
  });

  it("organization subscriber should receive all events", (done) => {
    let eventCount = 0;

    orgSocket.on("issue:created", () => {
      eventCount++;
      if (eventCount >= 1) {
        expect(eventCount).toBeGreaterThanOrEqual(1);
        done();
      }
    });

    // Trigger event
    createIssue({
      organizationId: "test-org",
      campusId: "test-campus",
      buildingId: "test-building",
      title: "Test",
    });
  });

  it("campus subscriber should only receive campus events", (done) => {
    let receivedWrongEvent = false;

    campusSocket.on("issue:created", (payload) => {
      if (payload.issue.campusId !== "test-campus") {
        receivedWrongEvent = true;
      }
    });

    // Create issue in different campus
    createIssue({
      organizationId: "test-org",
      campusId: "other-campus",
      buildingId: "other-building",
      title: "Should not receive",
    });

    setTimeout(() => {
      expect(receivedWrongEvent).toBe(false);
      done();
    }, 2000);
  });
});
```

---

## Load Testing

### Artillery Configuration

```yaml
# artillery-config.yml
config:
  target: "http://localhost:3001"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Spike test"
  variables:
    token: "YOUR_TEST_JWT_TOKEN"
    organizationId: "test-org"

scenarios:
  # WebSocket load test
  - engine: socketio
    flow:
      - emit:
          channel: "authenticate"
          data:
            token: "{{ token }}"
      - emit:
          channel: "subscribe:organization"
          data:
            organizationId: "{{ organizationId }}"
      - think: 30
      - emit:
          channel: "unsubscribe"
          data:
            room: "org:{{ organizationId }}"

  # SSE load test
  - name: "SSE Heatmap Stream"
    flow:
      - get:
          url: "/api/realtime/heatmap/stream?organizationId={{ organizationId }}&token={{ token }}"
          headers:
            Accept: "text/event-stream"
      - think: 60

  # REST API load test
  - name: "Create Issue"
    flow:
      - post:
          url: "/api/issues"
          headers:
            Authorization: "Bearer {{ token }}"
            Content-Type: "application/json"
          json:
            title: "Load test issue"
            organizationId: "{{ organizationId }}"
            buildingId: "test-building"
            priority: "medium"
```

### Run Load Tests

```bash
# Run WebSocket load test
artillery run artillery-config.yml

# Expected output:
# Summary report:
#   scenarios launched: 9000
#   scenarios completed: 9000
#   requests completed: 27000
#   mean response/sec: 150
#   response time (msec):
#     min: 10
#     max: 500
#     median: 50
#     p95: 150
#     p99: 300
```

### Custom Load Test Script

```typescript
// load-test.ts
import { io } from "socket.io-client";

const NUM_CONNECTIONS = 100;
const TEST_DURATION = 60000; // 60 seconds

async function loadTest() {
  const sockets: any[] = [];
  const token = process.env.TEST_TOKEN;

  console.log(`Starting load test with ${NUM_CONNECTIONS} connections...`);

  // Create connections
  for (let i = 0; i < NUM_CONNECTIONS; i++) {
    const socket = io("http://localhost:3001", {
      auth: { token },
    });

    socket.on("connect", () => {
      socket.emit("subscribe:organization", {
        organizationId: "test-org",
      });
    });

    sockets.push(socket);

    // Stagger connections
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`${NUM_CONNECTIONS} connections established`);

  // Wait for test duration
  await new Promise((resolve) => setTimeout(resolve, TEST_DURATION));

  // Cleanup
  console.log("Closing connections...");
  sockets.forEach((socket) => socket.disconnect());

  console.log("Load test complete!");
}

loadTest().catch(console.error);
```

---

## Frontend Testing

### React Component Tests

```typescript
// components/__tests__/LiveIssueList.test.tsx
import { render, waitFor, screen } from '@testing-library/react';
import { LiveIssueList } from '../LiveIssueList';
import { mockSocket } from '../../__mocks__/socket.io-client';

describe('LiveIssueList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial issues', () => {
    const issues = [
      { id: '1', title: 'Test Issue 1', priority: 'high' },
      { id: '2', title: 'Test Issue 2', priority: 'medium' }
    ];

    render(
      <LiveIssueList
        organizationId="test-org"
        initialIssues={issues}
      />
    );

    expect(screen.getByText('Test Issue 1')).toBeInTheDocument();
    expect(screen.getByText('Test Issue 2')).toBeInTheDocument();
  });

  it('adds new issue when WebSocket event received', async () => {
    const { rerender } = render(
      <LiveIssueList
        organizationId="test-org"
        initialIssues={[]}
      />
    );

    // Simulate WebSocket event
    const onIssueCreated = mockSocket.on.mock.calls.find(
      call => call[0] === 'issue:created'
    )?.[1];

    expect(onIssueCreated).toBeDefined();

    onIssueCreated({
      issue: {
        id: '3',
        title: 'New Issue',
        priority: 'critical'
      }
    });

    await waitFor(() => {
      expect(screen.getByText('New Issue')).toBeInTheDocument();
    });
  });

  it('shows connection status', () => {
    mockSocket.connected = true;

    render(
      <LiveIssueList
        organizationId="test-org"
        initialIssues={[]}
      />
    );

    expect(screen.getByText(/Live Updates/i)).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
// hooks/__tests__/useWebSocket.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useWebSocket } from "../useWebSocket";
import { mockSocket } from "../../__mocks__/socket.io-client";

describe("useWebSocket Hook", () => {
  it("connects and subscribes on mount", async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        token: "test-token",
        organizationId: "test-org",
        onIssueCreated: jest.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("subscribe:organization", {
      organizationId: "test-org",
    });
  });

  it("handles connection errors", async () => {
    mockSocket.connected = false;

    const { result } = renderHook(() =>
      useWebSocket({
        token: "invalid-token",
        organizationId: "test-org",
        onIssueCreated: jest.fn(),
      })
    );

    // Simulate error
    const onError = mockSocket.on.mock.calls.find(
      (call) => call[0] === "connect_error"
    )?.[1];

    onError(new Error("Auth failed"));

    await waitFor(() => {
      expect(result.current.error).toBe("Auth failed");
      expect(result.current.isConnected).toBe(false);
    });
  });

  it("cleans up on unmount", () => {
    const { unmount } = renderHook(() =>
      useWebSocket({
        token: "test-token",
        organizationId: "test-org",
        onIssueCreated: jest.fn(),
      })
    );

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith("issue:created");
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
```

---

## Troubleshooting

### Common Issues

#### Issue 1: WebSocket Connection Fails

**Symptoms:**

```
WebSocket connection to 'ws://localhost:3001' failed
```

**Solutions:**

1. Check if server is running
2. Verify CORS configuration
3. Check firewall settings
4. Validate JWT token

**Test:**

```bash
# Test basic connectivity
curl http://localhost:3001/health

# Test with wscat
wscat -c ws://localhost:3001
```

#### Issue 2: SSE Stream Disconnects

**Symptoms:**

```
SSE connection closed unexpectedly
EventSource failed
```

**Solutions:**

1. Increase server timeout
2. Check network stability
3. Implement reconnection logic
4. Verify token expiration

**Test:**

```bash
# Test SSE endpoint
curl -N -H "Accept: text/event-stream" \
  "http://localhost:3001/api/realtime/heatmap/stream?organizationId=test&token=TOKEN" \
  --max-time 60
```

#### Issue 3: Events Not Received

**Symptoms:**

- WebSocket connected but no events
- SSE stream active but no updates

**Debug Steps:**

1. Check room subscription:

```typescript
socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit("subscribe:organization", { organizationId });
});
```

2. Verify event listeners:

```typescript
socket.on("issue:created", (payload) => {
  console.log("Received:", payload);
});
```

3. Check server logs:

```bash
# Should see:
# 📤 Emitted issue:created to org:org123
```

#### Issue 4: High Memory Usage

**Symptoms:**

- Server memory grows over time
- Memory leak warnings

**Solutions:**

1. Clean up listeners:

```typescript
useEffect(() => {
  socket.on("issue:created", handler);
  return () => socket.off("issue:created", handler);
}, []);
```

2. Limit stored data:

```typescript
const [issues, setIssues] = useState<Issue[]>([]);

useEffect(() => {
  // Keep only last 100 issues
  if (issues.length > 100) {
    setIssues((prev) => prev.slice(-100));
  }
}, [issues]);
```

3. Monitor connections:

```bash
curl http://localhost:3001/api/realtime/stats
```

---

## Automated Test Script

```bash
#!/bin/bash
# test-realtime.sh

echo "🧪 Real-time System Test Suite"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Health Check
echo -n "Test 1: Server Health... "
if curl -s http://localhost:3001/health | grep -q "healthy"; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 2: WebSocket Connection
echo -n "Test 2: WebSocket Connection... "
if timeout 5 wscat -c ws://localhost:3001 -x '{"close": true}' &>/dev/null; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 3: SSE Stream
echo -n "Test 3: SSE Heatmap Stream... "
if timeout 5 curl -N -H "Accept: text/event-stream" \
  "http://localhost:3001/api/realtime/heatmap/stream?organizationId=test&token=$TEST_TOKEN" \
  2>/dev/null | grep -q "event: message"; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Test 4: Stats Endpoint
echo -n "Test 4: Stats Endpoint... "
if curl -s -H "Authorization: Bearer $TEST_TOKEN" \
  "http://localhost:3001/api/realtime/stats" | grep -q "websocket"; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

echo ""
echo "✅ All tests passed!"
```

---

## Performance Benchmarks

### Target Metrics

```
┌────────────────────────┬──────────┬──────────┐
│ Metric                 │ Target   │ Actual   │
├────────────────────────┼──────────┼──────────┤
│ WebSocket Connections  │ 1000+    │ [Test]   │
│ SSE Streams            │ 500+     │ [Test]   │
│ Event Latency          │ <100ms   │ [Test]   │
│ Message Throughput     │ 1000/s   │ [Test]   │
│ Memory per Connection  │ <100KB   │ [Test]   │
│ CPU Usage (idle)       │ <10%     │ [Test]   │
│ CPU Usage (load)       │ <50%     │ [Test]   │
└────────────────────────┴──────────┴──────────┘
```

### Run Benchmarks

```bash
# Install dependencies
npm install -g clinic autocannon

# Profile CPU
clinic doctor -- node dist/index.js

# Profile memory
clinic heapprofiler -- node dist/index.js

# Benchmark HTTP endpoints
autocannon -c 100 -d 60 http://localhost:3001/health
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test-realtime.yml
name: Real-time Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      firestore:
        image: google/cloud-sdk
        options: --entrypoint /bin/bash

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Start server
        run: npm run dev &
        env:
          NODE_ENV: test

      - name: Wait for server
        run: npx wait-on http://localhost:3001/health

      - name: Run integration tests
        run: npm test -- --testPathPattern=realtime

      - name: Run load tests
        run: artillery run artillery-config.yml
```

---

**Test Coverage Goals:**

- Unit Tests: >80%
- Integration Tests: >70%
- E2E Tests: Critical paths covered
- Load Tests: Baseline established
