import { Request, Response } from "express";
import {
  getHeatmapData,
  getHeatmapStats,
  getClusteredHeatmapData,
  getGridHeatmapData,
  HeatmapFilters,
  HeatmapConfig,
} from "./heatmap.service";
import { IssuePriority, IssueStatus } from "../../types";

/**
 * Get heatmap data with time decay and severity weighting
 * GET /api/heatmap/data
 */
export async function getHeatmap(req: Request, res: Response): Promise<void> {
  try {
    const {
      organizationId,
      campusId,
      buildingIds,
      categories,
      priorities,
      statuses,
      startDate,
      endDate,
      minSeverity,
      maxAge,
      timeDecayFactor,
      severityWeightMultiplier,
      clusterRadius,
      minClusterSize,
      gridSize,
      normalizeWeights,
    } = req.query;

    // Validate required fields
    if (!organizationId) {
      res.status(400).json({ error: "organizationId is required" });
      return;
    }

    // Build filters
    const filters: HeatmapFilters = {
      organizationId: organizationId as string,
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
        : (categories as string).includes(",")
          ? (categories as string).split(",").map((c) => c.trim())
          : [categories as string];
    }
    if (priorities) {
      const priorityArray = Array.isArray(priorities)
        ? priorities
        : (priorities as string).includes(",")
          ? (priorities as string).split(",").map((p) => p.trim())
          : [priorities];
      filters.priorities = priorityArray as IssuePriority[];
    }
    if (statuses) {
      const statusArray = Array.isArray(statuses)
        ? statuses
        : (statuses as string).includes(",")
          ? (statuses as string).split(",").map((s) => s.trim())
          : [statuses];
      filters.statuses = statusArray as IssueStatus[];
    }
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (minSeverity) filters.minSeverity = parseInt(minSeverity as string);
    if (maxAge) filters.maxAge = parseInt(maxAge as string);

    // Build config
    const config: HeatmapConfig = {
      timeDecayFactor: timeDecayFactor
        ? parseFloat(timeDecayFactor as string)
        : 0.5,
      severityWeightMultiplier: severityWeightMultiplier
        ? parseFloat(severityWeightMultiplier as string)
        : 2.0,
      normalizeWeights:
        normalizeWeights === "true" || normalizeWeights === undefined,
    };

    if (clusterRadius) config.clusterRadius = parseInt(clusterRadius as string);
    if (minClusterSize)
      config.minClusterSize = parseInt(minClusterSize as string);
    if (gridSize) config.gridSize = parseInt(gridSize as string);

    const heatmapData = await getHeatmapData(filters, config);

    // Always return success, even if no data (empty features array)
    res.json({
      success: true,
      data: heatmapData,
      message:
        heatmapData.features.length === 0
          ? "No heatmap data found for the specified filters"
          : `Found ${heatmapData.features.length} heatmap points`,
    });
  } catch (error) {
    console.error("Error getting heatmap data:", error);

    // Log full error for debugging
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }

    // Return detailed error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      errorMessage.includes("permission") ||
      errorMessage.includes("unauthorized")
        ? 403
        : errorMessage.includes("not found") ||
            errorMessage.includes("does not exist")
          ? 404
          : 500;

    res.status(statusCode).json({
      success: false,
      error: "Failed to get heatmap data",
      message: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}

/**
 * Get heatmap data in GeoJSON format (simplified)
 * GET /api/heatmap/geojson
 */
export async function getGeoJSON(req: Request, res: Response): Promise<void> {
  try {
    const {
      organizationId,
      campusId,
      buildingIds,
      categories,
      timeDecayFactor,
      severityWeightMultiplier,
    } = req.query;

    if (!organizationId) {
      res.status(400).json({ error: "organizationId is required" });
      return;
    }

    const filters: HeatmapFilters = {
      organizationId: organizationId as string,
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
      timeDecayFactor: timeDecayFactor
        ? parseFloat(timeDecayFactor as string)
        : 0.5,
      severityWeightMultiplier: severityWeightMultiplier
        ? parseFloat(severityWeightMultiplier as string)
        : 2.0,
      normalizeWeights: true,
    };

    const geojson = await getHeatmapData(filters, config);

    // Set GeoJSON content type
    res.setHeader("Content-Type", "application/geo+json");
    res.json(geojson);
  } catch (error) {
    console.error("Error getting GeoJSON:", error);
    res.status(500).json({
      error: "Failed to get GeoJSON",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get clustered heatmap data
 * GET /api/heatmap/clusters
 */
export async function getClusters(req: Request, res: Response): Promise<void> {
  try {
    const {
      organizationId,
      campusId,
      buildingIds,
      categories,
      clusterRadius,
      minClusterSize,
    } = req.query;

    if (!organizationId) {
      res.status(400).json({ error: "organizationId is required" });
      return;
    }

    const filters: HeatmapFilters = {
      organizationId: organizationId as string,
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

    const radius = clusterRadius ? parseInt(clusterRadius as string) : 100;
    const minSize = minClusterSize ? parseInt(minClusterSize as string) : 2;

    const clusteredData = await getClusteredHeatmapData(
      filters,
      radius,
      minSize
    );

    res.json({
      success: true,
      data: clusteredData,
      config: {
        clusterRadius: radius,
        minClusterSize: minSize,
      },
    });
  } catch (error) {
    console.error("Error getting clusters:", error);
    res.status(500).json({
      error: "Failed to get clusters",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get grid-based heatmap data
 * GET /api/heatmap/grid
 */
export async function getGrid(req: Request, res: Response): Promise<void> {
  try {
    const { organizationId, campusId, buildingIds, categories, gridSize } =
      req.query;

    if (!organizationId) {
      res.status(400).json({ error: "organizationId is required" });
      return;
    }

    const filters: HeatmapFilters = {
      organizationId: organizationId as string,
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

    const size = gridSize ? parseInt(gridSize as string) : 100;
    const gridData = await getGridHeatmapData(filters, size);

    res.json({
      success: true,
      data: gridData,
      config: {
        gridSize: size,
      },
    });
  } catch (error) {
    console.error("Error getting grid data:", error);
    res.status(500).json({
      error: "Failed to get grid data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get heatmap statistics
 * GET /api/heatmap/stats
 */
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const {
      organizationId,
      campusId,
      buildingIds,
      categories,
      priorities,
      statuses,
      startDate,
      endDate,
      minSeverity,
      maxAge,
      timeDecayFactor,
      severityWeightMultiplier,
    } = req.query;

    if (!organizationId) {
      res.status(400).json({ error: "organizationId is required" });
      return;
    }

    const filters: HeatmapFilters = {
      organizationId: organizationId as string,
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
        : (categories as string).includes(",")
          ? (categories as string).split(",").map((c) => c.trim())
          : [categories as string];
    }
    if (priorities) {
      const priorityArray = Array.isArray(priorities)
        ? priorities
        : (priorities as string).includes(",")
          ? (priorities as string).split(",").map((p) => p.trim())
          : [priorities];
      filters.priorities = priorityArray as IssuePriority[];
    }
    if (statuses) {
      const statusArray = Array.isArray(statuses)
        ? statuses
        : (statuses as string).includes(",")
          ? (statuses as string).split(",").map((s) => s.trim())
          : [statuses];
      filters.statuses = statusArray as IssueStatus[];
    }
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (minSeverity) filters.minSeverity = parseInt(minSeverity as string);
    if (maxAge) filters.maxAge = parseInt(maxAge as string);

    const config: HeatmapConfig = {
      timeDecayFactor: timeDecayFactor
        ? parseFloat(timeDecayFactor as string)
        : 0.5,
      severityWeightMultiplier: severityWeightMultiplier
        ? parseFloat(severityWeightMultiplier as string)
        : 2.0,
      normalizeWeights: true,
    };

    const stats = await getHeatmapStats(filters, config);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting heatmap stats:", error);
    res.status(500).json({
      error: "Failed to get heatmap stats",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get algorithm explanation
 * GET /api/heatmap/explain
 */
export async function explainAlgorithm(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const explanation = {
      algorithm: "Weighted Heatmap with Time Decay and Severity Weighting",
      description:
        "Aggregates issues by geographic location and applies time decay and severity weighting to generate heatmap visualization data in GeoJSON format.",
      steps: [
        {
          step: 1,
          name: "Location Aggregation",
          description:
            "Groups nearby issues within a configurable grid size (default 50m) using spatial clustering.",
        },
        {
          step: 2,
          name: "Time Decay Weighting",
          description:
            "Applies exponential decay to issue weights based on age. Recent issues have higher weight.",
          formula: "weight = e^(-decayFactor × normalizedAge)",
          parameters: {
            decayFactor: "0-1, higher = faster decay (default: 0.5)",
            normalizedAge: "Age normalized to 0-1 range (max 90 days)",
          },
        },
        {
          step: 3,
          name: "Severity Weighting",
          description:
            "Boosts weight based on issue severity and priority level.",
          formula: "weight = weight × (1 + avgSeverityScore × multiplier)",
          parameters: {
            multiplier: "Multiplier for severity boost (default: 2.0)",
            priorityBoosts: {
              CRITICAL: "4.0x",
              HIGH: "2.5x",
              MEDIUM: "1.5x",
              LOW: "1.0x",
            },
          },
        },
        {
          step: 4,
          name: "Weight Normalization",
          description:
            "Normalizes all weights to 0-1 range for consistent visualization.",
          formula: "normalizedWeight = (weight - min) / (max - min)",
        },
        {
          step: 5,
          name: "Optional Clustering (DBSCAN)",
          description:
            "Reduces point density by clustering nearby points using DBSCAN algorithm.",
          parameters: {
            clusterRadius: "Maximum distance for clustering (meters)",
            minClusterSize: "Minimum points to form cluster",
          },
        },
        {
          step: 6,
          name: "GeoJSON Formatting",
          description:
            "Converts weighted points to GeoJSON FeatureCollection for mapping libraries.",
        },
      ],
      output: {
        format: "GeoJSON FeatureCollection",
        properties: [
          "weight (0-1): Normalized combined weight",
          "intensity: Raw issue count",
          "issueCount: Number of issues at this point",
          "avgSeverity: Average severity score",
          "avgPriority: Average priority level",
          "categories: List of issue categories",
          "criticalCount, highCount, mediumCount, lowCount: Priority distribution",
          "oldestIssue, newestIssue: Date range",
        ],
      },
      useCases: [
        "Real-time issue visualization on campus maps",
        "Identifying hotspots for maintenance resources",
        "Historical trend analysis with time decay",
        "Priority-based resource allocation",
        "Performance monitoring via grid-based aggregation",
      ],
      configuration: {
        timeDecayFactor: {
          description: "Controls how quickly older issues lose weight",
          range: "0-1",
          default: 0.5,
          examples: {
            "0.1": "Slow decay - old issues retain weight longer",
            "0.5": "Moderate decay - balanced recency bias",
            "0.9": "Fast decay - strong bias toward recent issues",
          },
        },
        severityWeightMultiplier: {
          description: "Controls how much severity affects weight",
          range: "0+",
          default: 2.0,
          examples: {
            "0": "No severity weighting (count-based only)",
            "1.0": "Linear severity weighting",
            "2.0": "2x severity boost",
            "5.0": "Strong severity emphasis",
          },
        },
        gridSize: {
          description: "Spatial aggregation radius in meters",
          range: "10-1000",
          default: 50,
          examples: {
            "25": "Fine-grained detail (more points)",
            "50": "Balanced detail and performance",
            "100": "Coarse aggregation (fewer points)",
          },
        },
      },
    };

    res.json({
      success: true,
      data: explanation,
    });
  } catch (error) {
    console.error("Error explaining algorithm:", error);
    res.status(500).json({
      error: "Failed to explain algorithm",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
