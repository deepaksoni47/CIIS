import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { initializeFirebase } from "./config/firebase";

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin SDK
try {
  initializeFirebase();
} catch (error) {
  console.error("Failed to initialize Firebase. Server cannot start.");
  process.exit(1);
}

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

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
      issues: "/api/issues",
      buildings: "/api/buildings",
      analytics: "/api/analytics",
      ai: "/api/ai",
    },
  });
});

// Import and mount route modules
import aiRoutes from "./modules/ai/routes";
// TODO: Uncomment when other modules are ready
// import issueRoutes from './modules/issues/routes';
// import buildingRoutes from './modules/buildings/routes';
// import analyticsRoutes from './modules/analytics/routes';

app.use("/api/ai", aiRoutes);
// TODO: Mount other routes when ready
// app.use('/api/issues', issueRoutes);
// app.use('/api/buildings', buildingRoutes);
// app.use('/api/analytics', analyticsRoutes);

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
app.listen(PORT, () => {
  console.log(`
🚀 CIIS Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server:      http://localhost:${PORT}
🏥 Health:      http://localhost:${PORT}/health
🔧 Environment: ${process.env.NODE_ENV || "development"}
🔥 Firebase:    Connected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
