import { getFirestore } from "../../config/firebase";
import { Issue, IssueStatus, IssuePriority } from "../../types";
import { calculateDistance } from "../issues/issues.service";
import { firestore as adminFirestore } from "firebase-admin";

const firestore = getFirestore();

/**
 * GeoJSON Feature for heatmap point
 */
export interface HeatmapFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    weight: number; // Combined weight (0-1)
    intensity: number; // Raw intensity before normalization
    issueCount: number;
    avgSeverity: number;
    avgPriority: number;
    categories: string[];
    oldestIssue: Date;
    newestIssue: Date;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    issueIds: string[]; // Array of issue IDs
    cluster?: string; // Cluster ID if clustered
  };
}

/**
 * GeoJSON FeatureCollection for heatmap
 */
export interface HeatmapGeoJSON {
  type: "FeatureCollection";
  features: HeatmapFeature[];
  metadata: {
    totalIssues: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    timeDecayFactor: number;
    severityWeightEnabled: boolean;
    clusterRadius?: number;
    generatedAt: Date;
  };
}

/**
 * Heatmap data point (internal representation)
 */
interface HeatmapPoint {
  latitude: number;
  longitude: number;
  issues: Issue[];
  weight: number;
  intensity: number;
}

/**
 * Heatmap cluster
 */
export interface HeatmapCluster {
  id: string;
  centroid: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  points: HeatmapPoint[];
  totalWeight: number;
  issueCount: number;
}

/**
 * Heatmap statistics
 */
export interface HeatmapStats {
  totalPoints: number;
  totalIssues: number;
  avgWeight: number;
  maxWeight: number;
  minWeight: number;
  weightDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  geographicBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  categoryBreakdown: Record<string, number>;
  timeDecayStats: {
    avgAge: number; // in hours
    oldestIssue: Date;
    newestIssue: Date;
  };
}

/**
 * Heatmap filter options
 */
export interface HeatmapFilters {
  organizationId: string;
  campusId?: string;
  buildingIds?: string[];
  categories?: string[];
  priorities?: IssuePriority[];
  statuses?: IssueStatus[];
  startDate?: Date;
  endDate?: Date;
  minSeverity?: number;
  maxAge?: number; // in days
}

/**
 * Heatmap configuration
 */
export interface HeatmapConfig {
  timeDecayFactor: number; // 0-1, higher = faster decay
  severityWeightMultiplier: number; // multiplier for severity
  clusterRadius?: number; // in meters
  minClusterSize?: number; // minimum issues to form cluster
  gridSize?: number; // for grid-based aggregation
  normalizeWeights?: boolean; // normalize to 0-1 range
}

/**
 * Get heatmap data with time decay and severity weighting
 */
export async function getHeatmapData(
  filters: HeatmapFilters,
  config: HeatmapConfig = {
    timeDecayFactor: 0.5,
    severityWeightMultiplier: 2.0,
    normalizeWeights: true,
  },
): Promise<HeatmapGeoJSON> {
  // If no date range is provided, default to the last 30 days to limit reads
  if (!filters.startDate && !filters.endDate) {
    const defaultDays = 30;
    const start = new Date();
    start.setDate(start.getDate() - defaultDays);
    filters.startDate = start;
    console.log(
      `ℹ️ No date range provided for heatmap; defaulting to last ${defaultDays} days`,
    );
  }

  // Build query with minimal filters to avoid index requirements
  // We'll filter the rest in memory
  let query = firestore
    .collection("issues")
    .where("organizationId", "==", filters.organizationId);

  // Only apply date range filters at database level (most important for performance)
  // This requires a simple composite index: organizationId + createdAt
  if (filters.startDate && filters.endDate) {
    // Use date range query (requires index: organizationId, createdAt)
    query = query
      .where(
        "createdAt",
        ">=",
        adminFirestore.Timestamp.fromDate(filters.startDate),
      )
      .where(
        "createdAt",
        "<=",
        adminFirestore.Timestamp.fromDate(filters.endDate),
      );
  } else if (filters.startDate) {
    query = query.where(
      "createdAt",
      ">=",
      adminFirestore.Timestamp.fromDate(filters.startDate),
    );
  } else if (filters.endDate) {
    query = query.where(
      "createdAt",
      "<=",
      adminFirestore.Timestamp.fromDate(filters.endDate),
    );
  }

  // Add limit to prevent quota exhaustion
  query = query.limit(10000);

  // Fetch all matching issues
  let snapshot;
  try {
    snapshot = await query.get();
  } catch (error: any) {
    // Handle Firestore index errors
    if (error?.code === 9 || error?.message?.includes("index")) {
      const indexUrl = error?.message?.match(
        /https:\/\/console\.firebase\.google\.com[^\s]+/,
      )?.[0];

      console.warn("⚠️  Firestore index required for optimal performance.");
      console.warn("   Error:", error.message);
      if (indexUrl) {
        console.warn("   Create index at:", indexUrl);
      } else {
        console.warn(
          "   Required index: issues collection, fields: organizationId (Ascending), createdAt (Ascending)",
        );
        console.warn(
          "   Create at: https://console.firebase.google.com/project/ciis-2882b/firestore/indexes",
        );
      }

      // Fallback: Query without date range and filter in memory with limit
      console.warn(
        "   Falling back to in-memory date filtering (slower but works without index)",
      );
      const fallbackQuery = firestore
        .collection("issues")
        .where("organizationId", "==", filters.organizationId)
        .limit(10000);

      snapshot = await fallbackQuery.get();
    } else {
      throw error;
    }
  }

  let issues: Issue[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Issue[];

  // Apply date filters in memory if we used fallback query
  // (This happens if the index doesn't exist and we fall back to basic query)
  if (filters.startDate || filters.endDate) {
    issues = issues.filter((issue) => {
      if (!issue.createdAt) return false;

      const issueDate = (issue.createdAt as adminFirestore.Timestamp).toDate();

      if (filters.startDate && issueDate < filters.startDate) return false;
      if (filters.endDate && issueDate > filters.endDate) return false;

      return true;
    });
  }

  // Apply remaining filters in memory (avoids complex index requirements)
  console.log(`🔍 Heatmap filter - Initial issues: ${issues.length}`);
  console.log(`   Categories filter:`, filters.categories);
  console.log(`   Priorities filter:`, filters.priorities);
  console.log(`   Statuses filter:`, filters.statuses);

  if (filters.campusId) {
    issues = issues.filter((issue) => issue.campusId === filters.campusId);
    console.log(`   After campusId filter: ${issues.length} issues`);
  }

  if (filters.buildingIds && filters.buildingIds.length > 0) {
    issues = issues.filter(
      (issue) =>
        issue.buildingId && filters.buildingIds!.includes(issue.buildingId),
    );
    console.log(`   After buildingIds filter: ${issues.length} issues`);
  }

  if (filters.categories && filters.categories.length > 0) {
    // Make category filter case-insensitive
    const lowerCaseCategories = filters.categories.map((c) => c.toLowerCase());
    issues = issues.filter(
      (issue) =>
        issue.category &&
        lowerCaseCategories.includes(issue.category.toLowerCase()),
    );
    console.log(`   After categories filter: ${issues.length} issues`);
  }

  if (filters.priorities && filters.priorities.length > 0) {
    const priorityValues = filters.priorities.map((p) =>
      p.toString().toLowerCase(),
    );
    issues = issues.filter(
      (issue) =>
        issue.priority &&
        priorityValues.includes(issue.priority.toString().toLowerCase()),
    );
    console.log(`   After priorities filter: ${issues.length} issues`);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    const statusValues = filters.statuses.map((s) =>
      s.toString().toLowerCase(),
    );
    issues = issues.filter(
      (issue) =>
        issue.status &&
        statusValues.includes(issue.status.toString().toLowerCase()),
    );
    console.log(`   After statuses filter: ${issues.length} issues`);
  }

  // Apply additional filters
  if (filters.minSeverity) {
    issues = issues.filter((issue) => issue.severity >= filters.minSeverity!);
    console.log(`   After minSeverity filter: ${issues.length} issues`);
  }

  if (filters.maxAge) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.maxAge);
    issues = issues.filter((issue) => {
      const createdAt = issue.createdAt.toDate();
      return createdAt >= cutoffDate;
    });
    console.log(`   After maxAge filter: ${issues.length} issues`);
  }

  console.log(`✅ Final filtered issues: ${issues.length}`);

  // Group issues by location
  const points = aggregateByLocation(issues, config.gridSize);

  // Apply time decay weighting
  const decayedPoints = applyTimeDecay(points, config.timeDecayFactor);

  // Apply severity weighting
  const weightedPoints = applySeverityWeighting(
    decayedPoints,
    config.severityWeightMultiplier,
  );

  // Normalize weights if requested
  let finalPoints = weightedPoints;
  if (config.normalizeWeights) {
    finalPoints = normalizeWeights(weightedPoints);
  }

  // Apply clustering if configured
  if (config.clusterRadius && config.minClusterSize) {
    finalPoints = applyDBSCANClustering(
      finalPoints,
      config.clusterRadius,
      config.minClusterSize,
    );
  }

  // Convert to GeoJSON
  return formatAsGeoJSON(finalPoints, filters, config);
}

/**
 * Aggregate issues by location (group nearby issues)
 */
function aggregateByLocation(
  issues: Issue[],
  gridSize: number = 50, // meters
): HeatmapPoint[] {
  const points: HeatmapPoint[] = [];
  const processed = new Set<string>();

  for (const issue of issues) {
    if (!issue.location?.latitude || !issue.location?.longitude) {
      continue;
    }

    if (processed.has(issue.id)) {
      continue;
    }

    // Find nearby issues within grid size
    const nearbyIssues: Issue[] = [issue];
    processed.add(issue.id);

    for (const otherIssue of issues) {
      if (
        processed.has(otherIssue.id) ||
        !otherIssue.location?.latitude ||
        !otherIssue.location?.longitude
      ) {
        continue;
      }

      const distance = calculateDistance(
        issue.location.latitude,
        issue.location.longitude,
        otherIssue.location.latitude,
        otherIssue.location.longitude,
      );

      if (distance <= gridSize) {
        nearbyIssues.push(otherIssue);
        processed.add(otherIssue.id);
      }
    }

    // Calculate centroid
    const avgLat =
      nearbyIssues.reduce((sum, i) => sum + i.location!.latitude, 0) /
      nearbyIssues.length;
    const avgLon =
      nearbyIssues.reduce((sum, i) => sum + i.location!.longitude, 0) /
      nearbyIssues.length;

    points.push({
      latitude: avgLat,
      longitude: avgLon,
      issues: nearbyIssues,
      weight: 1.0, // Initial weight
      intensity: nearbyIssues.length,
    });
  }

  return points;
}

/**
 * Apply time decay weighting (recent issues have higher weight)
 */
function applyTimeDecay(
  points: HeatmapPoint[],
  decayFactor: number,
): HeatmapPoint[] {
  const now = new Date();
  const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days in ms

  return points.map((point) => {
    let totalDecayWeight = 0;

    for (const issue of point.issues) {
      const age = now.getTime() - issue.createdAt.toDate().getTime();
      const normalizedAge = Math.min(age / maxAge, 1); // 0 to 1

      // Exponential decay: weight = e^(-decayFactor * age)
      const decayWeight = Math.exp(-decayFactor * normalizedAge);
      totalDecayWeight += decayWeight;
    }

    const avgDecayWeight = totalDecayWeight / point.issues.length;

    return {
      ...point,
      weight: point.weight * avgDecayWeight,
    };
  });
}

/**
 * Apply severity weighting (higher severity = higher weight)
 */
function applySeverityWeighting(
  points: HeatmapPoint[],
  multiplier: number,
): HeatmapPoint[] {
  return points.map((point) => {
    let totalSeverityWeight = 0;

    for (const issue of point.issues) {
      // Use priority as primary weight, fallback to severity
      let severityScore = issue.severity / 10; // normalize to 0-1

      // Boost by priority
      const priorityMultipliers: Record<IssuePriority, number> = {
        [IssuePriority.CRITICAL]: 4.0,
        [IssuePriority.HIGH]: 2.5,
        [IssuePriority.MEDIUM]: 1.5,
        [IssuePriority.LOW]: 1.0,
      };

      const priorityBoost = priorityMultipliers[issue.priority] || 1.0;
      severityScore *= priorityBoost;

      totalSeverityWeight += severityScore;
    }

    const avgSeverityWeight = totalSeverityWeight / point.issues.length;

    return {
      ...point,
      weight: point.weight * (1 + avgSeverityWeight * multiplier),
    };
  });
}

/**
 * Normalize weights to 0-1 range
 */
function normalizeWeights(points: HeatmapPoint[]): HeatmapPoint[] {
  if (points.length === 0) return points;

  const maxWeight = Math.max(...points.map((p) => p.weight));
  const minWeight = Math.min(...points.map((p) => p.weight));
  const range = maxWeight - minWeight;

  if (range === 0) {
    return points.map((p) => ({ ...p, weight: 1.0 }));
  }

  return points.map((point) => ({
    ...point,
    weight: (point.weight - minWeight) / range,
  }));
}

/**
 * Apply DBSCAN clustering to reduce number of points
 */
function applyDBSCANClustering(
  points: HeatmapPoint[],
  radius: number,
  minSize: number,
): HeatmapPoint[] {
  const clusters: HeatmapCluster[] = [];
  const visited = new Set<number>();
  const clustered = new Set<number>();

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    const neighbors = findNeighbors(points, i, radius);

    if (neighbors.length < minSize) {
      continue; // Noise point, keep as individual
    }

    // Create new cluster
    const cluster: HeatmapCluster = {
      id: `cluster_${clusters.length}`,
      centroid: {
        latitude: points[i].latitude,
        longitude: points[i].longitude,
      },
      radius,
      points: [points[i]],
      totalWeight: points[i].weight,
      issueCount: points[i].issues.length,
    };

    clustered.add(i);

    // Expand cluster
    const queue = [...neighbors];
    while (queue.length > 0) {
      const neighborIdx = queue.shift()!;

      if (!visited.has(neighborIdx)) {
        visited.add(neighborIdx);
        const neighborNeighbors = findNeighbors(points, neighborIdx, radius);

        if (neighborNeighbors.length >= minSize) {
          queue.push(...neighborNeighbors);
        }
      }

      if (!clustered.has(neighborIdx)) {
        cluster.points.push(points[neighborIdx]);
        cluster.totalWeight += points[neighborIdx].weight;
        cluster.issueCount += points[neighborIdx].issues.length;
        clustered.add(neighborIdx);
      }
    }

    // Update centroid
    cluster.centroid = {
      latitude:
        cluster.points.reduce((sum, p) => sum + p.latitude, 0) /
        cluster.points.length,
      longitude:
        cluster.points.reduce((sum, p) => sum + p.longitude, 0) /
        cluster.points.length,
    };

    clusters.push(cluster);
  }

  // Merge clustered points
  const mergedPoints: HeatmapPoint[] = clusters.map((cluster) => ({
    latitude: cluster.centroid.latitude,
    longitude: cluster.centroid.longitude,
    issues: cluster.points.flatMap((p) => p.issues),
    weight: cluster.totalWeight / cluster.points.length,
    intensity: cluster.issueCount,
  }));

  // Add unclustered points
  for (let i = 0; i < points.length; i++) {
    if (!clustered.has(i)) {
      mergedPoints.push(points[i]);
    }
  }

  return mergedPoints;
}

/**
 * Find neighbors within radius
 */
function findNeighbors(
  points: HeatmapPoint[],
  index: number,
  radius: number,
): number[] {
  const neighbors: number[] = [];
  const point = points[index];

  for (let i = 0; i < points.length; i++) {
    if (i === index) continue;

    const distance = calculateDistance(
      point.latitude,
      point.longitude,
      points[i].latitude,
      points[i].longitude,
    );

    if (distance <= radius) {
      neighbors.push(i);
    }
  }

  return neighbors;
}

/**
 * Format heatmap points as GeoJSON
 */
function formatAsGeoJSON(
  points: HeatmapPoint[],
  _filters: HeatmapFilters,
  config: HeatmapConfig,
): HeatmapGeoJSON {
  const features: HeatmapFeature[] = points.map((point) => {
    const priorities = point.issues.map((i) => i.priority);
    const categories = [...new Set(point.issues.map((i) => i.category))];
    const reportedDates = point.issues.map((i) => i.createdAt.toDate());
    const avgSeverity =
      point.issues.reduce((sum, i) => sum + i.severity, 0) /
      point.issues.length;

    // Calculate priority distribution
    const criticalCount = priorities.filter(
      (p) => p === IssuePriority.CRITICAL,
    ).length;
    const highCount = priorities.filter((p) => p === IssuePriority.HIGH).length;
    const mediumCount = priorities.filter(
      (p) => p === IssuePriority.MEDIUM,
    ).length;
    const lowCount = priorities.filter((p) => p === IssuePriority.LOW).length;

    // Calculate average priority score
    const priorityScores: Record<IssuePriority, number> = {
      [IssuePriority.CRITICAL]: 4,
      [IssuePriority.HIGH]: 3,
      [IssuePriority.MEDIUM]: 2,
      [IssuePriority.LOW]: 1,
    };
    const avgPriority =
      priorities.reduce((sum, p) => sum + priorityScores[p], 0) /
      priorities.length;

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude],
      },
      properties: {
        weight: point.weight,
        intensity: point.intensity,
        issueCount: point.issues.length,
        avgSeverity,
        avgPriority,
        categories,
        oldestIssue: new Date(
          Math.min(...reportedDates.map((d) => d.getTime())),
        ),
        newestIssue: new Date(
          Math.max(...reportedDates.map((d) => d.getTime())),
        ),
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        issueIds: point.issues.map((issue) => issue.id),
      },
    };
  });

  const allDates = features.flatMap((f) => [
    f.properties.oldestIssue,
    f.properties.newestIssue,
  ]);

  // Handle empty date range
  const now = new Date();
  const dateRange =
    allDates.length > 0
      ? {
          start: new Date(Math.min(...allDates.map((d) => d.getTime()))),
          end: new Date(Math.max(...allDates.map((d) => d.getTime()))),
        }
      : {
          start: now,
          end: now,
        };

  return {
    type: "FeatureCollection",
    features,
    metadata: {
      totalIssues: features.reduce(
        (sum, f) => sum + f.properties.issueCount,
        0,
      ),
      dateRange,
      timeDecayFactor: config.timeDecayFactor,
      severityWeightEnabled: config.severityWeightMultiplier > 0,
      clusterRadius: config.clusterRadius,
      generatedAt: new Date(),
    },
  };
}

/**
 * Get heatmap statistics
 */
export async function getHeatmapStats(
  filters: HeatmapFilters,
  config: HeatmapConfig,
): Promise<HeatmapStats> {
  const heatmapData = await getHeatmapData(filters, config);
  const { features } = heatmapData;

  if (features.length === 0) {
    return {
      totalPoints: 0,
      totalIssues: 0,
      avgWeight: 0,
      maxWeight: 0,
      minWeight: 0,
      weightDistribution: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      geographicBounds: {
        north: 0,
        south: 0,
        east: 0,
        west: 0,
      },
      categoryBreakdown: {},
      timeDecayStats: {
        avgAge: 0,
        oldestIssue: new Date(),
        newestIssue: new Date(),
      },
    };
  }

  const weights = features.map((f) => f.properties.weight);
  const latitudes = features.map((f) => f.geometry.coordinates[1]);
  const longitudes = features.map((f) => f.geometry.coordinates[0]);

  const categoryBreakdown: Record<string, number> = {};
  features.forEach((f) => {
    f.properties.categories.forEach((cat) => {
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });
  });

  const now = new Date();
  const ages = features.map(
    (f) =>
      (now.getTime() - f.properties.newestIssue.getTime()) / (1000 * 60 * 60),
  ); // in hours

  return {
    totalPoints: features.length,
    totalIssues: heatmapData.metadata.totalIssues,
    avgWeight: weights.reduce((sum, w) => sum + w, 0) / weights.length,
    maxWeight: Math.max(...weights),
    minWeight: Math.min(...weights),
    weightDistribution: {
      critical: features.reduce(
        (sum, f) => sum + f.properties.criticalCount,
        0,
      ),
      high: features.reduce((sum, f) => sum + f.properties.highCount, 0),
      medium: features.reduce((sum, f) => sum + f.properties.mediumCount, 0),
      low: features.reduce((sum, f) => sum + f.properties.lowCount, 0),
    },
    geographicBounds: {
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes),
    },
    categoryBreakdown,
    timeDecayStats: {
      avgAge: ages.reduce((sum, a) => sum + a, 0) / ages.length,
      oldestIssue: heatmapData.metadata.dateRange.start,
      newestIssue: heatmapData.metadata.dateRange.end,
    },
  };
}

/**
 * Get clustered heatmap data
 */
export async function getClusteredHeatmapData(
  filters: HeatmapFilters,
  clusterRadius: number = 100,
  minClusterSize: number = 2,
): Promise<HeatmapGeoJSON> {
  return getHeatmapData(filters, {
    timeDecayFactor: 0.5,
    severityWeightMultiplier: 2.0,
    clusterRadius,
    minClusterSize,
    normalizeWeights: true,
  });
}

/**
 * Get grid-based heatmap data (for performance)
 */
export async function getGridHeatmapData(
  filters: HeatmapFilters,
  gridSize: number = 100,
): Promise<HeatmapGeoJSON> {
  return getHeatmapData(filters, {
    timeDecayFactor: 0.5,
    severityWeightMultiplier: 2.0,
    gridSize,
    normalizeWeights: true,
  });
}
