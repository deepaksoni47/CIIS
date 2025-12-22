import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { Issue } from "../types";

/**
 * WebSocket event types
 */
export enum WebSocketEvent {
  // Server → Client
  ISSUE_CREATED = "issue:created",
  ISSUE_UPDATED = "issue:updated",
  ISSUE_RESOLVED = "issue:resolved",
  ISSUE_DELETED = "issue:deleted",
  ISSUE_ASSIGNED = "issue:assigned",
  HEATMAP_UPDATED = "heatmap:updated",
  STATS_UPDATED = "stats:updated",

  // Client → Server
  SUBSCRIBE_ORGANIZATION = "subscribe:organization",
  SUBSCRIBE_CAMPUS = "subscribe:campus",
  SUBSCRIBE_BUILDING = "subscribe:building",
  SUBSCRIBE_HEATMAP = "subscribe:heatmap",
  UNSUBSCRIBE = "unsubscribe",

  // Connection
  AUTHENTICATE = "authenticate",
  AUTHENTICATED = "authenticated",
  ERROR = "error",
}

/**
 * Real-time update payload types
 */
export interface IssueUpdatePayload {
  issue: Issue;
  action: "created" | "updated" | "resolved" | "deleted" | "assigned";
  timestamp: Date;
  organizationId: string;
  campusId?: string;
  buildingId?: string;
  affectedUsers?: string[];
}

export interface HeatmapUpdatePayload {
  organizationId: string;
  campusId?: string;
  buildingId?: string;
  timestamp: Date;
  changeType: "issue_added" | "issue_updated" | "issue_resolved";
  affectedArea?: {
    latitude: number;
    longitude: number;
    radius: number; // meters
  };
}

export interface StatsUpdatePayload {
  organizationId: string;
  campusId?: string;
  stats: {
    totalIssues: number;
    openIssues: number;
    criticalIssues: number;
    highPriorityIssues: number;
    resolvedToday: number;
  };
  timestamp: Date;
}

/**
 * WebSocket Service for real-time updates
 */
export class WebSocketService {
  private io: SocketIOServer;
  private static instance: WebSocketService;

  private constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
          o.trim()
        ) || ["http://localhost:3000", "https://ciis-innovex.vercel.app"],
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
  }

  /**
   * Initialize WebSocket service (singleton)
   */
  public static initialize(httpServer: HTTPServer): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(httpServer);
      console.log("✅ WebSocket service initialized");
    }
    return WebSocketService.instance;
  }

  /**
   * Get WebSocket service instance
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      throw new Error(
        "WebSocket service not initialized. Call initialize() first."
      );
    }
    return WebSocketService.instance;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Authentication
      socket.on(
        WebSocketEvent.AUTHENTICATE,
        async (_data: { token: string }) => {
          try {
            // TODO: Verify JWT token
            // const user = await verifyToken(data.token);

            // For now, accept all connections
            socket.emit(WebSocketEvent.AUTHENTICATED, {
              success: true,
              socketId: socket.id,
            });
          } catch (error) {
            socket.emit(WebSocketEvent.ERROR, {
              message: "Authentication failed",
              error: error instanceof Error ? error.message : "Unknown error",
            });
            socket.disconnect();
          }
        }
      );

      // Subscribe to organization updates
      socket.on(
        WebSocketEvent.SUBSCRIBE_ORGANIZATION,
        (data: { organizationId: string }) => {
          socket.join(`org:${data.organizationId}`);
          console.log(
            `📡 ${socket.id} subscribed to org:${data.organizationId}`
          );
        }
      );

      // Subscribe to campus updates
      socket.on(
        WebSocketEvent.SUBSCRIBE_CAMPUS,
        (data: { organizationId: string; campusId: string }) => {
          socket.join(`org:${data.organizationId}`);
          socket.join(`campus:${data.campusId}`);
          console.log(`📡 ${socket.id} subscribed to campus:${data.campusId}`);
        }
      );

      // Subscribe to building updates
      socket.on(
        WebSocketEvent.SUBSCRIBE_BUILDING,
        (data: { organizationId: string; buildingId: string }) => {
          socket.join(`org:${data.organizationId}`);
          socket.join(`building:${data.buildingId}`);
          console.log(
            `📡 ${socket.id} subscribed to building:${data.buildingId}`
          );
        }
      );

      // Subscribe to heatmap updates
      socket.on(
        WebSocketEvent.SUBSCRIBE_HEATMAP,
        (data: { organizationId: string; campusId?: string }) => {
          const room = data.campusId
            ? `heatmap:${data.organizationId}:${data.campusId}`
            : `heatmap:${data.organizationId}`;
          socket.join(room);
          console.log(`📡 ${socket.id} subscribed to ${room}`);
        }
      );

      // Unsubscribe from all rooms
      socket.on(WebSocketEvent.UNSUBSCRIBE, () => {
        socket.rooms.forEach((room) => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });
        console.log(`📡 ${socket.id} unsubscribed from all rooms`);
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Emit issue created event
   */
  public emitIssueCreated(payload: IssueUpdatePayload): void {
    const rooms: string[] = [`org:${payload.organizationId}`];

    if (payload.campusId) {
      rooms.push(`campus:${payload.campusId}`);
    }

    if (payload.buildingId) {
      rooms.push(`building:${payload.buildingId}`);
    }

    rooms.forEach((room) => {
      this.io.to(room).emit(WebSocketEvent.ISSUE_CREATED, payload);
    });

    console.log(`📤 Emitted issue:created to ${rooms.join(", ")}`);
  }

  /**
   * Emit issue updated event
   */
  public emitIssueUpdated(payload: IssueUpdatePayload): void {
    const rooms: string[] = [`org:${payload.organizationId}`];

    if (payload.campusId) {
      rooms.push(`campus:${payload.campusId}`);
    }

    if (payload.buildingId) {
      rooms.push(`building:${payload.buildingId}`);
    }

    rooms.forEach((room) => {
      this.io.to(room).emit(WebSocketEvent.ISSUE_UPDATED, payload);
    });

    console.log(`📤 Emitted issue:updated to ${rooms.join(", ")}`);
  }

  /**
   * Emit issue resolved event
   */
  public emitIssueResolved(payload: IssueUpdatePayload): void {
    const rooms: string[] = [`org:${payload.organizationId}`];

    if (payload.campusId) {
      rooms.push(`campus:${payload.campusId}`);
    }

    if (payload.buildingId) {
      rooms.push(`building:${payload.buildingId}`);
    }

    rooms.forEach((room) => {
      this.io.to(room).emit(WebSocketEvent.ISSUE_RESOLVED, payload);
    });

    console.log(`📤 Emitted issue:resolved to ${rooms.join(", ")}`);
  }

  /**
   * Emit issue deleted event
   */
  public emitIssueDeleted(payload: IssueUpdatePayload): void {
    const rooms: string[] = [`org:${payload.organizationId}`];

    if (payload.campusId) {
      rooms.push(`campus:${payload.campusId}`);
    }

    if (payload.buildingId) {
      rooms.push(`building:${payload.buildingId}`);
    }

    rooms.forEach((room) => {
      this.io.to(room).emit(WebSocketEvent.ISSUE_DELETED, payload);
    });

    console.log(`📤 Emitted issue:deleted to ${rooms.join(", ")}`);
  }

  /**
   * Emit issue assigned event
   */
  public emitIssueAssigned(payload: IssueUpdatePayload): void {
    const rooms: string[] = [`org:${payload.organizationId}`];

    if (payload.campusId) {
      rooms.push(`campus:${payload.campusId}`);
    }

    if (payload.buildingId) {
      rooms.push(`building:${payload.buildingId}`);
    }

    // Notify assigned user
    if (payload.affectedUsers) {
      payload.affectedUsers.forEach((userId) => {
        this.io
          .to(`user:${userId}`)
          .emit(WebSocketEvent.ISSUE_ASSIGNED, payload);
      });
    }

    rooms.forEach((room) => {
      this.io.to(room).emit(WebSocketEvent.ISSUE_ASSIGNED, payload);
    });

    console.log(`📤 Emitted issue:assigned to ${rooms.join(", ")}`);
  }

  /**
   * Emit heatmap updated event
   */
  public emitHeatmapUpdated(payload: HeatmapUpdatePayload): void {
    const room = payload.campusId
      ? `heatmap:${payload.organizationId}:${payload.campusId}`
      : `heatmap:${payload.organizationId}`;

    this.io.to(room).emit(WebSocketEvent.HEATMAP_UPDATED, payload);
    console.log(`📤 Emitted heatmap:updated to ${room}`);
  }

  /**
   * Emit stats updated event
   */
  public emitStatsUpdated(payload: StatsUpdatePayload): void {
    const room = payload.campusId
      ? `org:${payload.organizationId}:stats:${payload.campusId}`
      : `org:${payload.organizationId}:stats`;

    this.io.to(room).emit(WebSocketEvent.STATS_UPDATED, payload);
    console.log(`📤 Emitted stats:updated to ${room}`);
  }

  /**
   * Get connected clients count
   */
  public getConnectedClientsCount(): number {
    return this.io.sockets.sockets.size;
  }

  /**
   * Get room subscribers count
   */
  public async getRoomSubscribersCount(room: string): Promise<number> {
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.length;
  }
}

export default WebSocketService;
