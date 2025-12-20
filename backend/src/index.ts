// CRITICAL: Load environment variables FIRST before any other imports
import "./env";

import express, { Application, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { initializeFirebase } from "./config/firebase";
import { WebSocketService } from "./services/websocket.service";
import { SSEService } from "./services/sse.service";
import {
  securityHeaders,
  preventCommonAttacks,
  logSuspiciousActivity,
  enforceHTTPS,
  addRequestId,
} from "./utils/security.utils";
import { globalRateLimiter } from "./middlewares/rateLimiter.middleware";

// Initialize Express app
const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin SDK
try {
  initializeFirebase();
} catch (error) {
  console.error("Failed to initialize Firebase. Server cannot start.");
  process.exit(1);
}

// Initialize WebSocket service
try {
  WebSocketService.initialize(httpServer);
  SSEService.getInstance();
} catch (error) {
  console.error("Failed to initialize real-time services:", error);
}

// Security middleware (order matters!)
app.use(addRequestId); // Add request ID for tracking
app.use(enforceHTTPS); // Force HTTPS in production

// CORS configuration - MUST be before helmet to avoid conflicts
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Reject origin
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: ["X-Request-ID"],
    maxAge: 86400, // 24 hours
  })
);

// Helmet security headers (configured to not interfere with CORS)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(securityHeaders); // Additional security headers
app.use(logSuspiciousActivity); // Log suspicious requests
app.use(preventCommonAttacks); // Prevent SQL injection, XSS, etc.
app.use(globalRateLimiter); // Global rate limiting

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.get("/api", (_req: Request, res: Response) => {
  res.json({
    message: "Campus Infrastructure Intelligence System API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      issues: "/api/issues",
      buildings: "/api/buildings",
      analytics: "/api/analytics",
      ai: "/api/ai",
      priority: "/api/priority",
      heatmap: "/api/heatmap",
      realtime: "/api/realtime",
    },
  });
});

// Import and mount route modules
import authRoutes from "./modules/auth/routes";
import aiRoutes from "./modules/ai/routes";
import issueRoutes from "./modules/issues/routes";
import priorityRoutes from "./modules/priority/routes";
import heatmapRoutes from "./modules/heatmap/routes";
import realtimeRoutes from "./modules/realtime/routes";

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/priority", priorityRoutes);
app.use("/api/heatmap", heatmapRoutes);
app.use("/api/realtime", realtimeRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`
🚀 CIIS Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server:      http://localhost:${PORT}
🏥 Health:      http://localhost:${PORT}/health
🔧 Environment: ${process.env.NODE_ENV || "development"}
🔥 Firebase:    Connected
⚡ WebSocket:   Enabled
📡 SSE:         Enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
