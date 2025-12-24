import { Request, Response } from "express";
import {
  getHeatmapData,
  HeatmapFilters,
  HeatmapConfig,
} from "../modules/heatmap/heatmap.service";
import { getIssues } from "../modules/issues/issues.service";
import { IssuePriority, IssueStatus } from "../types";

/**
 * SSE Client interface
 */
interface SSEClient {
  id: string;
  response: Response;
  organizationId: string;
  campusId?: string;
  buildingId?: string;
  filters?: any;
  lastEventId?: string;
}

/**
 * Server-Sent Events (SSE) Service for real-time updates
 */
export class SSEService {
  private static instance: SSEService;
  private clients: Map<string, SSEClient> = new Map();
  private heatmapClients: Map<string, SSEClient> = new Map();
  private issueClients: Map<string, SSEClient> = new Map();

  // Heatmap cache and per-organization update intervals to avoid duplicate reads
  private heatmapCache: Map<
    string,
    {
      data: any;
      timestamp: number;
      interval?: NodeJS.Timeout;
      updateIntervalMs?: number;
    }
  > = new Map();

  private constructor() {
    // Cleanup disconnected clients every minute
    setInterval(() => {
      this.cleanupDisconnectedClients();
    }, 60000);
  }

  /**
   * Get SSE service instance (singleton)
   */
  public static getInstance(): SSEService {
    if (!SSEService.instance) {
      SSEService.instance = new SSEService();
      console.log("✅ SSE service initialized");
    }
    return SSEService.instance;
  }

  /**
   * Setup SSE connection
   */
  public setupSSEConnection(
    req: Request,
    res: Response,
    clientId: string,
    filters: any
  ): void {
    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering

    // Send initial connection message
    this.sendEvent(res, "connected", { clientId, timestamp: new Date() });

    // Store client
    const client: SSEClient = {
      id: clientId,
      response: res,
      organizationId: filters.organizationId,
      campusId: filters.campusId,
      buildingId: filters.buildingId,
      filters,
      lastEventId: req.headers["last-event-id"] as string,
    };

    this.clients.set(clientId, client);

    // Handle client disconnect
    req.on("close", () => {
      this.clients.delete(clientId);
      console.log(`🔌 SSE client disconnected: ${clientId}`);
    });

    console.log(`🔌 SSE client connected: ${clientId}`);
  }

  /**
   * Send SSE event
   */
  public sendEvent(res: Response, event: string, data: any, id?: string): void {
    if (id) {
      res.write(`id: ${id}\n`);
    }
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * Broadcast to all clients in organization
   */
  public broadcastToOrganization(
    organizationId: string,
    event: string,
    data: any
  ): void {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.organizationId === organizationId) {
        try {
          this.sendEvent(client.response, event, data, `${Date.now()}`);
          count++;
        } catch (error) {
          console.error(`Error sending to client ${client.id}:`, error);
          this.clients.delete(client.id);
        }
      }
    });
    console.log(
      `📤 Broadcasted ${event} to ${count} clients in org:${organizationId}`
    );
  }

  /**
   * Broadcast to campus clients
   */
  public broadcastToCampus(
    organizationId: string,
    campusId: string,
    event: string,
    data: any
  ): void {
    let count = 0;
    this.clients.forEach((client) => {
      if (
        client.organizationId === organizationId &&
        client.campusId === campusId
      ) {
        try {
          this.sendEvent(client.response, event, data, `${Date.now()}`);
          count++;
        } catch (error) {
          console.error(`Error sending to client ${client.id}:`, error);
          this.clients.delete(client.id);
        }
      }
    });
    console.log(
      `📤 Broadcasted ${event} to ${count} clients in campus:${campusId}`
    );
  }

  /**
   * Send heatmap update to subscribed clients
   */
  public sendHeatmapUpdate(
    organizationId: string,
    campusId: string | undefined,
    data: any
  ): void {
    let count = 0;
    this.heatmapClients.forEach((client) => {
      if (
        client.organizationId === organizationId &&
        (!campusId || client.campusId === campusId)
      ) {
        try {
          this.sendEvent(
            client.response,
            "heatmap:update",
            data,
            `${Date.now()}`
          );
          count++;
        } catch (error) {
          console.error(`Error sending heatmap to client ${client.id}:`, error);
          this.heatmapClients.delete(client.id);
        }
      }
    });
    console.log(`📤 Sent heatmap update to ${count} clients`);
  }

  /**
   * Heatmap cache helpers
   */
  public getCachedHeatmap(organizationId: string) {
    const entry = this.heatmapCache.get(organizationId);
    if (!entry) return null;
    return entry;
  }

  public setCachedHeatmap(
    organizationId: string,
    data: any,
    updateIntervalMs: number
  ) {
    this.heatmapCache.set(organizationId, {
      data,
      timestamp: Date.now(),
      updateIntervalMs,
    });
  }

  public ensureHeatmapUpdater(
    organizationId: string,
    updateIntervalMs: number
  ) {
    const entry = this.heatmapCache.get(organizationId);
    if (entry && entry.interval) {
      // If update interval changed, restart
      if (entry.updateIntervalMs !== updateIntervalMs) {
        clearInterval(entry.interval);
        entry.interval = undefined;
      } else {
        return; // already running
      }
    }

    // Start a new interval to fetch and broadcast heatmap for this org
    const interval = setInterval(async () => {
      try {
        const filters: HeatmapFilters = { organizationId };
        const config: HeatmapConfig = {
          timeDecayFactor: 0.5,
          severityWeightMultiplier: 2.0,
          normalizeWeights: true,
        };
        const data = await getHeatmapData(filters, config);
        this.setCachedHeatmap(organizationId, data, updateIntervalMs);
        this.broadcastHeatmapUpdate(organizationId, data);
      } catch (err) {
        console.error("Error in heatmap updater for org", organizationId, err);
      }
    }, updateIntervalMs);

    this.heatmapCache.set(organizationId, {
      data: entry?.data,
      timestamp: entry?.timestamp || Date.now(),
      interval,
      updateIntervalMs,
    });
  }

  public stopHeatmapUpdater(organizationId: string) {
    const entry = this.heatmapCache.get(organizationId);
    if (entry && entry.interval) {
      clearInterval(entry.interval);
    }
    this.heatmapCache.delete(organizationId);
  }

  private broadcastHeatmapUpdate(organizationId: string, data: any) {
    // Broadcast to all org clients
    this.heatmapClients.forEach((client) => {
      if (client.organizationId === organizationId) {
        try {
          this.sendEvent(
            client.response,
            "heatmap:update",
            data,
            `${Date.now()}`
          );
        } catch (err) {
          console.error(
            "Error broadcasting heatmap update to client",
            client.id,
            err
          );
          this.heatmapClients.delete(client.id);
        }
      }
    });
    console.log(`📤 Broadcasted heatmap update for org ${organizationId}`);
  }

  /**
   * Send issue update to subscribed clients
   */
  public sendIssueUpdate(
    organizationId: string,
    campusId: string | undefined,
    buildingId: string | undefined,
    event: string,
    data: any
  ): void {
    let count = 0;
    this.issueClients.forEach((client) => {
      if (
        client.organizationId === organizationId &&
        (!campusId || client.campusId === campusId) &&
        (!buildingId || client.buildingId === buildingId)
      ) {
        try {
          this.sendEvent(client.response, event, data, `${Date.now()}`);
          count++;
        } catch (error) {
          console.error(
            `Error sending issue update to client ${client.id}:`,
            error
          );
          this.issueClients.delete(client.id);
        }
      }
    });
    console.log(`📤 Sent ${event} to ${count} clients`);
  }

  /**
   * Add heatmap client
   */
  public addHeatmapClient(client: SSEClient): void {
    this.heatmapClients.set(client.id, client);
  }

  /**
   * Add issue client
   */
  public addIssueClient(client: SSEClient): void {
    this.issueClients.set(client.id, client);
  }

  /**
   * Cleanup disconnected clients
   */
  private cleanupDisconnectedClients(): void {
    let cleaned = 0;

    // Check all clients
    this.clients.forEach((client, id) => {
      if (client.response.writableEnded) {
        this.clients.delete(id);
        cleaned++;
      }
    });

    // Check heatmap clients
    this.heatmapClients.forEach((client, id) => {
      if (client.response.writableEnded) {
        this.heatmapClients.delete(id);
        cleaned++;
      }
    });

    // Check issue clients
    this.issueClients.forEach((client, id) => {
      if (client.response.writableEnded) {
        this.issueClients.delete(id);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} disconnected SSE clients`);
    }
  }

  /**
   * Get connected clients count
   */
  public getConnectedClientsCount(): number {
    return (
      this.clients.size + this.heatmapClients.size + this.issueClients.size
    );
  }

  /**
   * Get clients by organization
   */
  public getOrganizationClientsCount(organizationId: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.organizationId === organizationId) {
        count++;
      }
    });
    return count;
  }
}

/**
 * SSE Controller functions
 */

/**
 * Stream heatmap updates
 * GET /api/realtime/heatmap/stream
 */
export async function streamHeatmapUpdates(
  req: Request,
  res: Response
): Promise<void> {
  const {
    organizationId,
    campusId,
    buildingIds,
    categories,
    updateInterval = 30000, // 30 seconds default
  } = req.query;

  if (!organizationId) {
    res.status(400).json({ error: "organizationId is required" });
    return;
  }

  const clientId = `heatmap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const sseService = SSEService.getInstance();

  // Setup SSE connection
  sseService.setupSSEConnection(req, res, clientId, {
    organizationId,
    campusId,
    buildingIds,
    categories,
  });

  // Add to heatmap clients
  const client: SSEClient = {
    id: clientId,
    response: res,
    organizationId: organizationId as string,
    campusId: campusId as string,
    buildingId: buildingIds as string,
    filters: { organizationId, campusId, buildingIds, categories },
  };
  sseService.addHeatmapClient(client);

  // Use per-organization cached heatmap and a single updater to prevent duplicate reads
  const orgId = organizationId as string;

  try {
    // Clamp requested interval to a safe minimum to avoid very frequent reads
    const MIN_UPDATE_INTERVAL_MS = parseInt(
      process.env.HEATMAP_MIN_INTERVAL_MS || "60000",
      10
    ); // 60s
    const requestedInterval = Math.max(
      MIN_UPDATE_INTERVAL_MS,
      parseInt(updateInterval as string, 10) || MIN_UPDATE_INTERVAL_MS
    );

    // Ensure there is an updater for this organization (single background fetch)
    sseService.ensureHeatmapUpdater(orgId, requestedInterval);

    // Send cached data immediately if available (avoid a DB read)
    const cached = sseService.getCachedHeatmap(orgId);
    if (cached) {
      try {
        console.log(
          `📥 Serving cached heatmap for org ${orgId} (age=${Date.now() - cached.timestamp}ms)`
        );
        sseService.sendEvent(
          res,
          "heatmap:initial",
          cached.data,
          `${Date.now()}`
        );
      } catch (err) {
        console.error("Error sending cached heatmap to client:", err);
      }
    } else {
      // No cache yet - do a single initial fetch and populate cache
      const filters: HeatmapFilters = {
        organizationId: orgId,
      };
      if (campusId) filters.campusId = campusId as string;
      if (buildingIds) {
        filters.buildingIds = Array.isArray(buildingIds)
          ? (buildingIds as string[])
          : [buildingIds as string];
      }
      if (categories) {
        filters.categories = Array.isArray(categories)
          ? (categories as string[])
          : [categories as string];
      }

      const config: HeatmapConfig = {
        timeDecayFactor: 0.5,
        severityWeightMultiplier: 2.0,
        normalizeWeights: true,
      };

      try {
        const heatmapData = await getHeatmapData(filters, config);
        sseService.setCachedHeatmap(orgId, heatmapData, requestedInterval);
        sseService.sendEvent(
          res,
          "heatmap:initial",
          heatmapData,
          `${Date.now()}`
        );
      } catch (error) {
        console.error("Error fetching initial heatmap:", error);
      }
    }
  } catch (e) {
    console.error("Error ensuring heatmap updater:", e);
  }

  // Cleanup on disconnect - stop updater if no clients left for the organization
  req.on("close", () => {
    if (sseService.getOrganizationClientsCount(orgId) === 0) {
      sseService.stopHeatmapUpdater(orgId);
    }
  });
}

/**
 * Stream issue updates
 * GET /api/realtime/issues/stream
 */
export async function streamIssueUpdates(
  req: Request,
  res: Response
): Promise<void> {
  const { organizationId, campusId, buildingId, priorities, statuses } =
    req.query;

  if (!organizationId) {
    res.status(400).json({ error: "organizationId is required" });
    return;
  }

  const clientId = `issues-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const sseService = SSEService.getInstance();

  // Setup SSE connection
  sseService.setupSSEConnection(req, res, clientId, {
    organizationId,
    campusId,
    buildingId,
    priorities,
    statuses,
  });

  // Add to issue clients
  const client: SSEClient = {
    id: clientId,
    response: res,
    organizationId: organizationId as string,
    campusId: campusId as string,
    buildingId: buildingId as string,
    filters: { organizationId, campusId, buildingId, priorities, statuses },
  };
  sseService.addIssueClient(client);

  // Send initial issues list
  try {
    const issuesResult = await getIssues({
      organizationId: organizationId as string,
      buildingId: buildingId as string,
      priority: priorities
        ? Array.isArray(priorities)
          ? (priorities[0] as IssuePriority)
          : (priorities as IssuePriority)
        : undefined,
      status: statuses
        ? Array.isArray(statuses)
          ? (statuses[0] as IssueStatus)
          : (statuses as IssueStatus)
        : undefined,
    });
    sseService.sendEvent(
      res,
      "issues:initial",
      { issues: issuesResult.issues, count: issuesResult.issues.length },
      `${Date.now()}`
    );
  } catch (error) {
    console.error("Error fetching initial issues:", error);
  }
}

/**
 * Get SSE connection stats
 * GET /api/realtime/stats
 */
export async function getSSEStats(req: Request, res: Response): Promise<void> {
  try {
    const sseService = SSEService.getInstance();
    const { organizationId } = req.query;

    const stats = {
      totalConnections: sseService.getConnectedClientsCount(),
      organizationConnections: organizationId
        ? sseService.getOrganizationClientsCount(organizationId as string)
        : undefined,
      timestamp: new Date(),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting SSE stats:", error);
    res.status(500).json({
      error: "Failed to get SSE stats",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export default SSEService;
