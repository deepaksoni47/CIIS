# Real-time Frontend Integration Guide

This guide demonstrates how to integrate WebSocket and Server-Sent Events (SSE) in your frontend application for real-time updates.

## Table of Contents

1. [Overview](#overview)
2. [WebSocket Integration](#websocket-integration)
3. [SSE Integration](#sse-integration)
4. [React Hooks](#react-hooks)
5. [Component Examples](#component-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Overview

The CIIS backend provides two real-time communication methods:

- **WebSocket (Socket.IO)**: Bidirectional communication for instant notifications
- **SSE (Server-Sent Events)**: Unidirectional streaming for continuous data feeds

### When to Use Each

| Use Case                    | Recommended Protocol |
| --------------------------- | -------------------- |
| Instant issue notifications | WebSocket            |
| Live heatmap updates        | SSE                  |
| Two-way communication       | WebSocket            |
| Periodic data feeds         | SSE                  |
| Chat/messaging              | WebSocket            |
| Dashboard metrics           | SSE                  |

---

## WebSocket Integration

### Installation

```bash
npm install socket.io-client
```

### Basic Setup

```typescript
import { io, Socket } from "socket.io-client";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

let socket: Socket | null = null;

export const initializeWebSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(BACKEND_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("✅ WebSocket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ WebSocket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("WebSocket connection error:", error);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectWebSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};
```

### Event Listeners

```typescript
import { Issue } from "../types";

interface IssueCreatedPayload {
  issue: Issue;
  action: "created";
  timestamp: string;
  organizationId: string;
}

interface IssueUpdatedPayload {
  issue: Issue;
  action: "updated";
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: string;
}

interface HeatmapUpdatedPayload {
  organizationId: string;
  changeType: "issue_added" | "issue_updated" | "issue_resolved";
  affectedRegion?: {
    lat: number;
    lng: number;
    radius: number;
  };
  timestamp: string;
}

// Subscribe to events
export const subscribeToIssueEvents = (
  socket: Socket,
  organizationId: string,
  callbacks: {
    onIssueCreated?: (payload: IssueCreatedPayload) => void;
    onIssueUpdated?: (payload: IssueUpdatedPayload) => void;
    onIssueResolved?: (payload: any) => void;
    onIssueDeleted?: (payload: any) => void;
    onHeatmapUpdated?: (payload: HeatmapUpdatedPayload) => void;
  }
) => {
  // Subscribe to organization room
  socket.emit("subscribe:organization", { organizationId });

  // Set up event listeners
  if (callbacks.onIssueCreated) {
    socket.on("issue:created", callbacks.onIssueCreated);
  }

  if (callbacks.onIssueUpdated) {
    socket.on("issue:updated", callbacks.onIssueUpdated);
  }

  if (callbacks.onIssueResolved) {
    socket.on("issue:resolved", callbacks.onIssueResolved);
  }

  if (callbacks.onIssueDeleted) {
    socket.on("issue:deleted", callbacks.onIssueDeleted);
  }

  if (callbacks.onHeatmapUpdated) {
    socket.on("heatmap:updated", callbacks.onHeatmapUpdated);
  }
};

// Unsubscribe from events
export const unsubscribeFromIssueEvents = (socket: Socket) => {
  socket.off("issue:created");
  socket.off("issue:updated");
  socket.off("issue:resolved");
  socket.off("issue:deleted");
  socket.off("heatmap:updated");
};
```

---

## SSE Integration

### Basic SSE Client

```typescript
export class SSEClient {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay = 3000;

  constructor(
    private url: string,
    private token: string,
    private onMessage: (data: any) => void,
    private onError?: (error: Event) => void
  ) {}

  connect() {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      return;
    }

    const urlWithToken = `${this.url}?token=${this.token}`;
    this.eventSource = new EventSource(urlWithToken);

    this.eventSource.onopen = () => {
      console.log("✅ SSE connection opened:", this.url);
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error("SSE error:", error);

      if (this.onError) {
        this.onError(error);
      }

      // Auto-reconnect
      this.disconnect();
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = setTimeout(() => {
      console.log("🔄 Attempting SSE reconnection...");
      this.connect();
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}
```

---

## React Hooks

### useWebSocket Hook

```typescript
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import {
  initializeWebSocket,
  disconnectWebSocket,
} from "../services/websocket";

interface UseWebSocketOptions {
  token: string;
  organizationId: string;
  onIssueCreated?: (payload: any) => void;
  onIssueUpdated?: (payload: any) => void;
  onIssueResolved?: (payload: any) => void;
  onIssueDeleted?: (payload: any) => void;
  onHeatmapUpdated?: (payload: any) => void;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!options.token || !options.organizationId) {
      return;
    }

    try {
      const socket = initializeWebSocket(options.token);
      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        setError(null);

        // Subscribe to organization
        socket.emit("subscribe:organization", {
          organizationId: options.organizationId,
        });
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        setError(err.message);
        setIsConnected(false);
      });

      // Event listeners
      if (options.onIssueCreated) {
        socket.on("issue:created", options.onIssueCreated);
      }
      if (options.onIssueUpdated) {
        socket.on("issue:updated", options.onIssueUpdated);
      }
      if (options.onIssueResolved) {
        socket.on("issue:resolved", options.onIssueResolved);
      }
      if (options.onIssueDeleted) {
        socket.on("issue:deleted", options.onIssueDeleted);
      }
      if (options.onHeatmapUpdated) {
        socket.on("heatmap:updated", options.onHeatmapUpdated);
      }
    } catch (err: any) {
      setError(err.message);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("issue:created");
        socketRef.current.off("issue:updated");
        socketRef.current.off("issue:resolved");
        socketRef.current.off("issue:deleted");
        socketRef.current.off("heatmap:updated");
      }
      disconnectWebSocket();
    };
  }, [options.token, options.organizationId]);

  return { isConnected, error, socket: socketRef.current };
};
```

### useSSEStream Hook

```typescript
import { useEffect, useRef, useState } from "react";
import { SSEClient } from "../services/sse";

interface UseSSEStreamOptions<T> {
  url: string;
  token: string;
  enabled?: boolean;
  onMessage: (data: T) => void;
  onError?: (error: Event) => void;
}

export const useSSEStream = <T>(options: UseSSEStreamOptions<T>) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<SSEClient | null>(null);

  useEffect(() => {
    if (!options.enabled || !options.token) {
      return;
    }

    const client = new SSEClient(
      options.url,
      options.token,
      (data: T) => {
        setIsConnected(true);
        setError(null);
        options.onMessage(data);
      },
      (error) => {
        setError("SSE connection error");
        setIsConnected(false);
        if (options.onError) {
          options.onError(error);
        }
      }
    );

    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
    };
  }, [options.url, options.token, options.enabled]);

  return { isConnected, error };
};
```

### useHeatmapStream Hook

```typescript
import { useState, useCallback } from "react";
import { useSSEStream } from "./useSSEStream";

interface HeatmapData {
  type: "FeatureCollection";
  features: any[];
  metadata: {
    totalIssues: number;
    totalWeight: number;
    center: { lat: number; lng: number };
    bounds: { north: number; south: number; east: number; west: number };
  };
}

interface UseHeatmapStreamOptions {
  organizationId: string;
  campusId?: string;
  token: string;
  updateInterval?: number;
  enabled?: boolean;
}

export const useHeatmapStream = (options: UseHeatmapStreamOptions) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleMessage = useCallback((data: any) => {
    if (data.type === "initial" || data.type === "update") {
      setHeatmapData(data.data);
      setLastUpdate(new Date());
    }
  }, []);

  const url = `${process.env.REACT_APP_BACKEND_URL}/api/realtime/heatmap/stream?organizationId=${options.organizationId}${
    options.campusId ? `&campusId=${options.campusId}` : ""
  }${options.updateInterval ? `&updateInterval=${options.updateInterval}` : ""}`;

  const { isConnected, error } = useSSEStream({
    url,
    token: options.token,
    enabled: options.enabled !== false,
    onMessage: handleMessage,
  });

  return {
    heatmapData,
    lastUpdate,
    isConnected,
    error,
  };
};
```

---

## Component Examples

### Live Heatmap Component

```typescript
import React, { useEffect, useRef } from 'react';
import { useHeatmapStream } from '../hooks/useHeatmapStream';
import { useAuth } from '../contexts/AuthContext';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface LiveHeatmapProps {
  organizationId: string;
  campusId?: string;
  updateInterval?: number;
}

const HeatmapLayer: React.FC<{ data: any[] }> = ({ data }) => {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Convert features to heatmap points
    const points = data.flatMap(feature => {
      const coords = feature.geometry.coordinates;
      const weight = feature.properties.weight || 1;

      if (feature.geometry.type === 'Point') {
        return [[coords[1], coords[0], weight]];
      }
      return [];
    });

    // Create new heat layer
    heatLayerRef.current = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: 'blue',
        0.4: 'cyan',
        0.6: 'lime',
        0.8: 'yellow',
        1.0: 'red',
      },
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [data, map]);

  return null;
};

export const LiveHeatmap: React.FC<LiveHeatmapProps> = ({
  organizationId,
  campusId,
  updateInterval = 30000,
}) => {
  const { token } = useAuth();
  const { heatmapData, lastUpdate, isConnected, error } = useHeatmapStream({
    organizationId,
    campusId,
    token: token!,
    updateInterval,
  });

  if (error) {
    return <div className="error">Error loading heatmap: {error}</div>;
  }

  return (
    <div className="live-heatmap">
      <div className="status-bar">
        <span className={isConnected ? 'connected' : 'disconnected'}>
          {isConnected ? '🟢 Live' : '🔴 Disconnected'}
        </span>
        {lastUpdate && (
          <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>

      <MapContainer
        center={[14.5995, 120.9842]}
        zoom={13}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {heatmapData && (
          <HeatmapLayer data={heatmapData.features} />
        )}
      </MapContainer>
    </div>
  );
};
```

### Live Issue List Component

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext';
import { Issue } from '../types';

interface LiveIssueListProps {
  organizationId: string;
  initialIssues: Issue[];
}

export const LiveIssueList: React.FC<LiveIssueListProps> = ({
  organizationId,
  initialIssues,
}) => {
  const { token } = useAuth();
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleIssueCreated = useCallback((payload: any) => {
    setIssues(prev => [payload.issue, ...prev]);
    showNotification(`New issue: ${payload.issue.title}`);
  }, []);

  const handleIssueUpdated = useCallback((payload: any) => {
    setIssues(prev =>
      prev.map(issue =>
        issue.id === payload.issue.id ? payload.issue : issue
      )
    );
    showNotification(`Issue updated: ${payload.issue.title}`);
  }, []);

  const handleIssueResolved = useCallback((payload: any) => {
    setIssues(prev =>
      prev.map(issue =>
        issue.id === payload.issueId
          ? { ...issue, status: 'resolved' }
          : issue
      )
    );
    showNotification('Issue resolved');
  }, []);

  const handleIssueDeleted = useCallback((payload: any) => {
    setIssues(prev => prev.filter(issue => issue.id !== payload.issueId));
    showNotification('Issue deleted');
  }, []);

  const { isConnected, error } = useWebSocket({
    token: token!,
    organizationId,
    onIssueCreated: handleIssueCreated,
    onIssueUpdated: handleIssueUpdated,
    onIssueResolved: handleIssueResolved,
    onIssueDeleted: handleIssueDeleted,
  });

  return (
    <div className="live-issue-list">
      <div className="header">
        <h2>Issues</h2>
        <div className="status">
          <span className={isConnected ? 'connected' : 'disconnected'}>
            {isConnected ? '🟢 Live Updates' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      {notification && (
        <div className="notification">{notification}</div>
      )}

      {error && (
        <div className="error">Connection error: {error}</div>
      )}

      <div className="issue-grid">
        {issues.map(issue => (
          <div key={issue.id} className="issue-card">
            <h3>{issue.title}</h3>
            <p>{issue.description}</p>
            <div className="meta">
              <span className={`priority ${issue.priority}`}>
                {issue.priority}
              </span>
              <span className={`status ${issue.status}`}>
                {issue.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Error Handling

### Retry Logic

```typescript
export class RetryHandler {
  private retryCount = 0;
  private maxRetries = 5;
  private baseDelay = 1000;

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number) => void
  ): Promise<T> {
    try {
      const result = await operation();
      this.retryCount = 0; // Reset on success
      return result;
    } catch (error) {
      if (this.retryCount >= this.maxRetries) {
        this.retryCount = 0;
        throw new Error(`Max retries (${this.maxRetries}) exceeded`);
      }

      this.retryCount++;
      const delay = this.baseDelay * Math.pow(2, this.retryCount - 1);

      if (onRetry) {
        onRetry(this.retryCount);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.executeWithRetry(operation, onRetry);
    }
  }

  reset() {
    this.retryCount = 0;
  }
}
```

---

## Best Practices

### 1. Connection Management

- ✅ Initialize connections once per organization/session
- ✅ Clean up connections on component unmount
- ✅ Implement auto-reconnection logic
- ✅ Handle token refresh for long-lived connections

### 2. Performance

- ✅ Use React.memo for issue list items
- ✅ Implement virtual scrolling for large lists
- ✅ Debounce rapid updates
- ✅ Use useCallback for event handlers

### 3. Error Handling

- ✅ Display connection status to users
- ✅ Implement exponential backoff for reconnection
- ✅ Log errors for debugging
- ✅ Provide fallback to polling if real-time fails

### 4. Security

- ✅ Always send JWT token for authentication
- ✅ Validate incoming data structure
- ✅ Use HTTPS/WSS in production
- ✅ Implement rate limiting on client side

### 5. User Experience

- ✅ Show visual indicators for connection status
- ✅ Display toast notifications for new issues
- ✅ Animate new items in lists
- ✅ Provide manual refresh option

---

## Testing

### Mock WebSocket for Tests

```typescript
// __mocks__/socket.io-client.ts
export const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
};

export const io = jest.fn(() => mockSocket);
```

### Test Example

```typescript
import { render, waitFor } from '@testing-library/react';
import { LiveIssueList } from './LiveIssueList';
import { mockSocket } from './__mocks__/socket.io-client';

test('updates issue list when WebSocket event received', async () => {
  const { getByText } = render(
    <LiveIssueList organizationId="org123" initialIssues={[]} />
  );

  // Simulate WebSocket event
  const onIssueCreated = mockSocket.on.mock.calls.find(
    call => call[0] === 'issue:created'
  )?.[1];

  onIssueCreated({
    issue: {
      id: '1',
      title: 'Test Issue',
      priority: 'high',
      status: 'open',
    },
  });

  await waitFor(() => {
    expect(getByText('Test Issue')).toBeInTheDocument();
  });
});
```

---

## Environment Variables

```env
# .env
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_WS_RECONNECT_DELAY=3000
REACT_APP_SSE_UPDATE_INTERVAL=30000
```

---

## Additional Resources

- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [EventSource API (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [Leaflet.heat Plugin](https://github.com/Leaflet/Leaflet.heat)
- [Real-time Backend API Docs](./REALTIME_API.md)
