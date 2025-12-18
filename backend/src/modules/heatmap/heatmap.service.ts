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
  }
): Promise<HeatmapGeoJSON> {
  // Fetch issues based on filters
  let query = firestore
    .collection("issues")
    .where("organizationId", "==", filters.organizationId);

  // Apply filters
  if (filters.campusId) {
    query = query.where("campusId", "==", filters.campusId);
  }

  if (filters.buildingIds && filters.buildingIds.length > 0) {
    query = query.where("buildingId", "in", filters.buildingIds.slice(0, 10));
  }

  if (filters.categories && filters.categories.length > 0) {
    query = query.where("category", "in", filters.categories.slice(0, 10));
  }

  if (filters.priorities && filters.priorities.length > 0) {
    query = query.where("priority", "in", filters.priorities);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.where("status", "in", filters.statuses);
  }

  if (filters.startDate) {
    query = query.where(
      "reportedAt",
      ">=",
      adminFirestore.Timestamp.fromDate(filters.startDate)
    );
  }

  if (filters.endDate) {
    query = query.where(
      "reportedAt",
      "<=",
      adminFirestore.Timestamp.fromDate(filters.endDate)
    );
  }

  const snapshot = await query.get();
  let issues: Issue[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Issue[];

  // Apply additional filters
  if (filters.minSeverity) {
    issues = issues.filter((issue) => issue.severity >= filters.minSeverity!);
  }

  if (filters.maxAge) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filters.maxAge);
    issues = issues.filter((issue) => {
      const createdAt = issue.createdAt.toDate();
      return createdAt >= cutoffDate;
    });
  }

  // Group issues by location
  const points = aggregateByLocation(issues, config.gridSize);

  // Apply time decay weighting
  const decayedPoints = applyTimeDecay(points, config.timeDecayFactor);

  // Apply severity weighting
  const weightedPoints = applySeverityWeighting(
    decayedPoints,
    config.severityWeightMultiplier
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
      config.minClusterSize
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
  gridSize: number = 50 // meters
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
        otherIssue.location.longitude
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
  decayFactor: number
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
  multiplier: number
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
  minSize: number
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
  radius: number
): number[] {
  const neighbors: number[] = [];
  const point = points[index];

  for (let i = 0; i < points.length; i++) {
    if (i === index) continue;

    const distance = calculateDistance(
      point.latitude,
      point.longitude,
      points[i].latitude,
      points[i].longitude
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
  config: HeatmapConfig
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
      (p) => p === IssuePriority.CRITICAL
    ).length;
    const highCount = priorities.filter((p) => p === IssuePriority.HIGH).length;
    const mediumCount = priorities.filter(
      (p) => p === IssuePriority.MEDIUM
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
          Math.min(...reportedDates.map((d) => d.getTime()))
        ),
        newestIssue: new Date(
          Math.max(...reportedDates.map((d) => d.getTime()))
        ),
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
      },
    };
  });

  const allDates = features.flatMap((f) => [
    f.properties.oldestIssue,
    f.properties.newestIssue,
  ]);

  return {
    type: "FeatureCollection",
    features,
    metadata: {
      totalIssues: features.reduce(
        (sum, f) => sum + f.properties.issueCount,
        0
      ),
      dateRange: {
        start: new Date(Math.min(...allDates.map((d) => d.getTime()))),
        end: new Date(Math.max(...allDates.map((d) => d.getTime()))),
      },
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
  config: HeatmapConfig
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
      (now.getTime() - f.properties.newestIssue.getTime()) / (1000 * 60 * 60)
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
        0
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
  minClusterSize: number = 2
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
  gridSize: number = 100
): Promise<HeatmapGeoJSON> {
  return getHeatmapData(filters, {
    timeDecayFactor: 0.5,
    severityWeightMultiplier: 2.0,
    gridSize,
    normalizeWeights: true,
  });
}
